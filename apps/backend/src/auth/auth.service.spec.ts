import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRedisToken } from '@liaoliaots/nestjs-redis';

import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let authService: AuthService;
  let get: jest.Mock;
  let set: jest.Mock;
  let del: jest.Mock;
  let userServiceMock: UsersService;
  let jwtService: JwtService;

  const mockedConfigService = {
    get(key: string | number) {
      switch (key) {
        case 'ACCESS_TOKEN_SECRET':
          return 'some-secret';
        case 'ACCESS_TOKEN_EXPIRY':
          return '240s';
        case 'REFRESH_TOKEN_SECRET':
          return 'some-secret';
        case 'REFRESH_TOKEN_EXPIRY':
          return '480s';
      }
    },
  };

  beforeEach(async () => {
    get = jest.fn();
    set = jest.fn();
    del = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        UsersModule,
        JwtModule.register({
          secret: mockedConfigService.get('ACCESS_TOKEN_SECRET'),
          signOptions: {
            expiresIn: mockedConfigService.get('ACCESS_TOKEN_EXPIRY'),
          },
        }),
      ],
      providers: [
        AuthService,
        {
          provide: getRedisToken('default'),
          useValue: {
            get,
            set,
            del,
          },
        },
        {
          provide: 'UsersService',
          useValue: { findOneByEmail: jest.fn(), create: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: mockedConfigService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userServiceMock = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('signup', () => {
    it('should successfully create new user', async () => {
      const user = {
        email: 'tom@test.com',
        firstName: 'Tom',
        lastName: 'Jerry',
        password: 'Tom@123',
        contact: '123456789',
      };

      // Mock the findOneByEmail to return null, indicating that the user does not exist

      jest.spyOn(userServiceMock, 'findOneByEmail').mockResolvedValue(null);
      jest.spyOn(userServiceMock, 'create').mockImplementation(async () => {
        console.log('Mocked create method called');
      });

      const mockGenerateSalt = jest
        .spyOn(bcrypt, 'genSalt')
        .mockImplementation(() => Promise.resolve('some-salt'));

      const mockGenerateHash = jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('some-password-hash'));

      await authService.signup(user);

      // assertions
      expect(userServiceMock.findOneByEmail).toHaveBeenCalledWith(user.email);

      expect(userServiceMock.create).toBeCalledTimes(1);

      expect(mockGenerateSalt).toHaveBeenCalled();

      expect(mockGenerateHash).toHaveBeenCalledWith(user.password, 'some-salt');

      mockGenerateSalt.mockRestore();
      mockGenerateHash.mockRestore();
    });

    it('should throw BadRequestException if user already exists', async () => {
      const user = {
        email: 'john@doe.com',
        password: 'John@123',
        firstName: 'John',
        lastName: 'Doe',
        contact: '123456789',
      };

      // Mock the findOneByEmail to return a user, indicating that the user already exists
      jest.spyOn(userServiceMock, 'findOneByEmail').mockResolvedValue({
        ...user,
        id: 'some-user-id',
        contact: +user.contact,
        profileUrl: null,
      });

      // Call the signup method and expect it to throw a BadRequestException
      await expect(authService.signup(user)).rejects.toThrowError(
        BadRequestException
      );
    });
  });

  describe('login', () => {
    it('should successfully login with correct credentials', async () => {
      const loginDto: LoginDto = {
        email: 'john@test.com',
        password: 'Tom@123',
      };

      const mockUser = {
        id: 'some-user-id',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        contact: 1234567890,
        password: 'hashedPassword',
        profileUrl: null,
      };
      jest.spyOn(userServiceMock, 'findOneByEmail').mockResolvedValue(mockUser);

      // Mock the bcrypt.compare method to return true
      const mockCompare = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(async () => true);

      // Mock the jwtService.signAsync method
      const mockSignAsync = jest
        .spyOn(jwtService, 'signAsync')
        .mockImplementation(async () => 'mockedAccessToken');

      const result = await authService.login(loginDto);

      // Assertions
      expect(userServiceMock.findOneByEmail).toHaveBeenCalledWith(
        loginDto.email
      );
      expect(mockCompare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password
      );
      expect(mockSignAsync).toHaveBeenCalledTimes(2);
      expect(result.accessToken).toEqual('mockedAccessToken');
      expect(result.refreshToken).toBeDefined();

      // Clean up
      mockCompare.mockRestore();
      mockSignAsync.mockRestore();
    });

    it('should throw NotFoundException for non-existing user', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      // Mock the findOneByEmail to return null, indicating that the user does not exist
      jest.spyOn(userServiceMock, 'findOneByEmail').mockResolvedValue(null);

      // Call the login method and expect it to throw a NotFoundException
      await expect(authService.login(loginDto)).rejects.toThrowError(
        NotFoundException
      );
    });

    it('should throw UnauthorizedException for incorrect password', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'incorrectPassword',
      };

      // Mock the findOneByEmail to return a user
      const mockUser = {
        id: 'some-user-id',
        firstName: 'John',
        lastName: 'Doe',
        contact: 1234567890,
        email: 'test@example.com',
        password: 'hashedPassword',
        profileUrl: null,
      };

      jest.spyOn(userServiceMock, 'findOneByEmail').mockResolvedValue(mockUser);

      // Mock the bcrypt.compare method to return false for any password
      const mockCompare = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(async () => false);

      // Call the login method and expect it to throw an UnauthorizedException
      await expect(authService.login(loginDto)).rejects.toThrowError(
        UnauthorizedException
      );

      // Clean up
      mockCompare.mockRestore();
    });
  });

  describe('renew access and refresh tokens', () => {
    it('should successfully renew tokens with valid refresh token', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'validRefreshToken',
      };

      // Mock the jwtService.verifyAsync method
      const mockVerifyAsync = jest
        .spyOn(jwtService, 'verifyAsync')
        .mockResolvedValue({ sub: 'some-user-id', jti: 'some-jti' });

      // Mock the client.get method to return null (indicating the refresh token is not revoked)
      get.mockResolvedValue(null);

      // Mock the jwtService.signAsync method
      const mockSignAsync = jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValue('mockedAccessToken');

      const result = await authService.renewTokens(refreshTokenDto);

      // Assertions
      expect(mockVerifyAsync).toHaveBeenCalledWith('validRefreshToken', {
        secret: mockedConfigService.get('REFRESH_TOKEN_SECRET'),
      });

      expect(get).toHaveBeenCalledWith('some-jti:some-user-id');
      expect(mockSignAsync).toHaveBeenCalledTimes(2); // Two calls, one for access token and one for refresh token
      expect(result.accessToken).toEqual('mockedAccessToken');
      expect(result.refreshToken).toBeDefined();

      // Clean up
      mockVerifyAsync.mockRestore();
      mockSignAsync.mockRestore();
    });

    it('should throw UnauthorizedException for revoked refresh token', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'revokedRefreshToken',
      };

      // Mock the jwtService.verifyAsync method
      const mockVerifyAsync = jest
        .spyOn(jwtService, 'verifyAsync')
        .mockResolvedValue({ sub: 'some-user-id', jti: 'some-jti' });

      // Mock the client.get method to return a value (indicating the refresh token is revoked)
      get.mockResolvedValue('revoked');

      // Call the renewTokens method and expect it to throw an UnauthorizedException
      await expect(
        authService.renewTokens(refreshTokenDto)
      ).rejects.toThrowError(UnauthorizedException);

      // Clean up
      mockVerifyAsync.mockRestore();
    });
  });

  describe('logout', () => {
    // given a valid refresh token, it should logout
    // given a expired refresh token, it should throw error
    //  given a revoked token, it should throw error

    it('should successfully logout with valid refresh token', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'validRefreshToken',
      };

      // Mock the jwtService.verifyAsync method
      const mockVerifyAsync = jest
        .spyOn(jwtService, 'verifyAsync')
        .mockResolvedValue({
          sub: 'some-user-id',
          jti: 'some-jti',
          exp: 'expiry in seconds',
        });

      // Mock the redis get method to return null (indicating the refresh token is not revoked)
      get.mockResolvedValue(null);

      // Mock the redis set method
      set.mockResolvedValue('successfully set');

      await authService.logout(refreshTokenDto);

      // Assertions
      expect(mockVerifyAsync).toHaveBeenCalledWith('validRefreshToken', {
        secret: mockedConfigService.get('REFRESH_TOKEN_SECRET'),
      });

      expect(get).toHaveBeenCalledWith('some-jti:some-user-id');

      expect(set).toBeCalledTimes(1);

      // Clean up
      mockVerifyAsync.mockRestore();
    });

    it('should throw UnauthorizedException for revoked refresh token', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'revokedRefreshToken',
      };

      // Mock the jwtService.verifyAsync method
      const mockVerifyAsync = jest
        .spyOn(jwtService, 'verifyAsync')
        .mockResolvedValue({
          sub: 'some-user-id',
          jti: 'some-jti',
          exp: 'expiry in seconds',
        });

      // Mock the client.get method to return a value (indicating the refresh token is revoked)
      get.mockResolvedValue('revoked');

      // Call the renewTokens method and expect it to throw an UnauthorizedException
      await expect(authService.logout(refreshTokenDto)).rejects.toThrowError(
        UnauthorizedException
      );

      // Clean up
      mockVerifyAsync.mockRestore();
    });
  });
});
