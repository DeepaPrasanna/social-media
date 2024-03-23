import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LoginDto, RefreshTokenDto, SignupDto } from './dto';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signup: jest.fn(),
            login: jest.fn(),
            renewTokens: jest.fn(),
            logout: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('signup', () => {
    it('should call with correct parameters', async () => {
      const signupDto: SignupDto = {
        email: 'test@example.com',
        password: 'Test@123',
        firstName: 'John',
        lastName: 'Doe',
        contact: '123456789',
      };

      const signupSpy = jest.spyOn(authService, 'signup').mockResolvedValue();

      await authController.signup(signupDto);

      expect(signupSpy).toHaveBeenCalledWith(signupDto);
    });
  });

  describe('login', () => {
    it('should call with correct parameters', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Test@123',
      };

      const loginSpy = jest.spyOn(authService, 'login').mockResolvedValue({
        accessToken: 'mockedAccessToken',
        refreshToken: 'mockedRefreshToken',
      });

      await authController.login(loginDto);

      expect(loginSpy).toHaveBeenCalledWith(loginDto);
    });

    it('should return access token and refresh token', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Test@123',
      };

      jest.spyOn(authService, 'login').mockResolvedValue({
        accessToken: 'mockedAccessToken',
        refreshToken: 'mockedRefreshToken',
      });

      const result = await authController.login(loginDto);

      expect(result).toEqual({
        accessToken: 'mockedAccessToken',
        refreshToken: 'mockedRefreshToken',
      });
    });
  });

  describe('renewTokens', () => {
    it('should call with correct parameters', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'mockedRefreshToken',
      };

      const renewTokensSpy = jest
        .spyOn(authService, 'renewTokens')
        .mockResolvedValue({
          accessToken: 'mockedAccessToken',
          refreshToken: 'mockedRefreshToken',
        });

      const result = await authController.renewTokens(refreshTokenDto);

      expect(renewTokensSpy).toHaveBeenCalledWith(refreshTokenDto);
      expect(result).toEqual({
        accessToken: 'mockedAccessToken',
        refreshToken: 'mockedRefreshToken',
      });
    });

    it('should return access and refresh tokens', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'mockedRefreshToken',
      };

      jest.spyOn(authService, 'renewTokens').mockResolvedValue({
        accessToken: 'mockedAccessToken',
        refreshToken: 'mockedRefreshToken',
      });

      const result = await authController.renewTokens(refreshTokenDto);

      expect(result).toEqual({
        accessToken: 'mockedAccessToken',
        refreshToken: 'mockedRefreshToken',
      });
    });

    it('should handle UnauthorizedException', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'expiredRefreshToken',
      };

      jest
        .spyOn(authService, 'renewTokens')
        .mockRejectedValue(new UnauthorizedException('Token is invalid'));

      await expect(
        authController.renewTokens(refreshTokenDto)
      ).rejects.toThrowError(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should call with correct parameters', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'mockedRefreshToken',
      };

      const logoutSpy = jest.spyOn(authService, 'logout').mockResolvedValue();

      await authController.logout(refreshTokenDto);

      expect(logoutSpy).toHaveBeenCalledWith(refreshTokenDto);
    });

    it('should handle UnauthorizedException', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'invalidRefreshToken',
      };

      jest
        .spyOn(authService, 'logout')
        .mockRejectedValue(new UnauthorizedException('Token is invalid'));

      await expect(authController.logout(refreshTokenDto)).rejects.toThrowError(
        UnauthorizedException
      );
    });
  });
});
