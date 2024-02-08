/* eslint-disable @nx/enforce-module-boundaries */
import { Redis } from 'ioredis';
import request from 'supertest';
import {
  getRedisToken,
  DEFAULT_REDIS_NAMESPACE,
} from '@liaoliaots/nestjs-redis';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpStatus, CanActivate, INestApplication } from '@nestjs/common';

import { AuthGuard } from 'apps/backend/src/auth/auth.guard';
import { AuthModule } from 'apps/backend/src/auth/auth.module';
import { AuthService } from 'apps/backend/src/auth/auth.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let client: Redis;
  const authService = {
    signup: () => [],
    login: () => ({
      accessToken: 'testAccessToken',
      refreshToken: 'testRefreshToken',
    }),
    renewTokens: () => ({
      accessToken: 'testAccessToken',
      refreshToken: 'testRefreshToken',
    }),
    logout: () => [],
  };

  beforeEach(async () => {
    const mockAuthGuard: CanActivate = { canActivate: jest.fn(() => true) };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        JwtModule.registerAsync({
          useFactory: async (configService: ConfigService) => ({
            secret: configService.get<string>('ACCESS_TOKEN_SECRET'),
            signOptions: {
              expiresIn: configService.get<string>('ACCESS_TOKEN_EXPIRY'),
            },
          }),
          inject: [ConfigService],
        }),
      ],
    })
      .overrideProvider(AuthGuard)
      .useValue(mockAuthGuard)
      .overrideProvider(AuthService)
      .useValue(authService)
      .compile();

    client = moduleFixture.get<Redis>(getRedisToken(DEFAULT_REDIS_NAMESPACE));
    app = moduleFixture.createNestApplication();

    await app.init();
  });

  it('/auth/signup (POST)', async () => {
    const signupDto = {
      email: 'test@example.com',
      password: 'Test@123',
      firstName: 'John',
      lastName: 'Doe',
      contact: '123456789',
    };

    await request(app.getHttpServer())
      .post('/auth/signup')
      .send(signupDto)
      .expect(HttpStatus.CREATED);
  });

  it('/auth/login (POST)', async () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Test@123',
    };

    await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto)
      .expect(200)
      .expect((response) => {
        const { accessToken, refreshToken } = response.body;
        expect(accessToken).toBeDefined();
        expect(refreshToken).toBeDefined();
        expect({ data: authService.login() });
      });
  });

  it('/auth/renew-tokens (POST)', async () => {
    const refreshTokenDto = {
      refreshToken: 'validRefreshToken',
    };

    await request(app.getHttpServer())
      .post('/auth/renew')
      .send(refreshTokenDto)
      .expect(200)
      .expect((response) => {
        const { accessToken, refreshToken } = response.body;
        expect(accessToken).toBeDefined();
        expect(refreshToken).toBeDefined();
        expect({ data: authService.renewTokens() });
      });
  });

  it('/auth/logout (POST)', async () => {
    const refreshTokenDto = {
      refreshToken: 'validRefreshToken',
    };

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send(refreshTokenDto)
      .expect(HttpStatus.NO_CONTENT);
  });

  afterEach(async () => {
    await client.quit();
    await app.close();
  });
});
