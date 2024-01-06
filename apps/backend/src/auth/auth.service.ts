import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { nanoid } from 'nanoid';
import { JwtService } from '@nestjs/jwt';
import { InjectRedis } from '@liaoliaots/nestjs-redis';

// import { jwtConstants } from './constants';
import { UsersService } from '../users/users.service';
import { RefreshTokenDto, SignupDto, LoginDto } from './dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly redis: Redis;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private configService: ConfigService,
    @InjectRedis() private readonly client: Redis
  ) {}

  async signup(signupDto: SignupDto): Promise<void> {
    const { email, password } = signupDto;

    const user = await this.usersService.findOneByEmail(email);

    if (user) throw new BadRequestException('User already exists!!');

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    await this.usersService.create({
      ...signupDto,
      password: hashedPassword,
    });
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findOneByEmail(email);

    if (!user)
      throw new NotFoundException(
        "The user doesn't exists! consider signing up!!"
      );

    // check if the password matches

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) throw new UnauthorizedException('Invalid credentials!');

    // create access token and refresh token here

    // Jti is used here to identify the related pair of access and refresh tokens
    const jti = nanoid();

    const payload = {
      sub: user.id,
      jti,
    };

    const username = `${user.firstName} ${user.lastName}`;

    const accessToken = await this.jwtService.signAsync({
      ...payload,
      username,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRY'),
    });
    return {
      accessToken,
      refreshToken,
    };
  }

  async renewTokens(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken: token } = refreshTokenDto;

    // verify refreshToken
    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
    });

    const { sub, jti } = payload;

    // check if the user has revoked refresh token

    const data = await this.client.get(`${jti}:${sub}`);

    if (data) {
      throw new UnauthorizedException('Token is invalid');
    }

    // if its not,  generate new ones

    const updatedPayload = { sub, jti };

    const accessToken = await this.jwtService.signAsync(updatedPayload);

    const refreshToken = await this.jwtService.signAsync(updatedPayload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRY'),
    });
    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    // verify refreshToken
    const payload = await this.jwtService.verifyAsync(refreshToken, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
    });

    const { sub, jti, exp } = payload;

    // check if the user has revoked refresh token. A revoked refresh token is identified by its jti of a particular user.

    const key = `${jti}:${sub}`;

    const data = await this.client.get(key);

    if (data) {
      throw new UnauthorizedException('Token is invalid');
    }

    // if the token is not revoked, then mark the token as blacklisted one by setting its jti_userId as the key in cache memory with the ttl of the secs left until the expiration of that token

    const value = Date.now();
    const expiryTimeInSeconds = (exp * 1000 - Date.now()) / 1000;
    await this.client.set(key, value, 'EX', expiryTimeInSeconds);
  }
}
