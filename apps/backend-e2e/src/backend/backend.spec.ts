/* eslint-disable @nx/enforce-module-boundaries */
import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, CanActivate, INestApplication } from '@nestjs/common';

import { AppModule } from 'apps/backend/src/app.module';
import { AuthGuard } from 'apps/backend/src/auth/auth.guard';
import { AuthService } from 'apps/backend/src/auth/auth.service';
import { PostsService } from 'apps/backend/src/posts/posts.service';

describe('Backend (e2e)', () => {
  let app: INestApplication;
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
  const postsService = {
    create: () => [],
    findAll: () => [
      {
        id: 'some-id',
        description: 'test description',
        authorId: 'some-author-id',
        createdOn: new Date(),
        updatedAt: new Date(),
      },
    ],
    findOne: () => ({
      id: 'postId',
      description: 'test description',
      authorId: 'some-author-id',
      createdOn: new Date(),
      updatedAt: new Date(),
    }),
    update: () => [],
    remove: () => [],
  };

  beforeEach(async () => {
    const mockAuthGuard: CanActivate = { canActivate: jest.fn(() => true) };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuthGuard)
      .useValue(mockAuthGuard)
      .overrideProvider(AuthService)
      .useValue(authService)
      .overrideProvider(PostsService)
      .useValue(postsService)
      .compile();

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

    const userCredentials = {
      username: 'testUsername',
      password: 'password',
    };

    const signInResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send(userCredentials);

    expect(signInResponse.body).toHaveProperty('accessToken');

    const {
      body: { accessToken },
    } = signInResponse;

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(refreshTokenDto)

      .expect(HttpStatus.NO_CONTENT);
  });

  describe('POST /posts', () => {
    it('should create a new post', async () => {
      const createPostDto = {
        description: 'This is a post description.',
      };
      const userCredentials = {
        username: 'testUsername',
        password: 'password',
      };

      const signInResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(userCredentials);

      expect(signInResponse.body).toHaveProperty('accessToken');

      const accessToken = signInResponse.body;

      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createPostDto);

      expect(response.status).toBe(HttpStatus.CREATED);
    });
  });

  describe('GET /posts', () => {
    it('should get all posts', async () => {
      const userCredentials = {
        username: 'testUsername',
        password: 'password',
      };

      const signInResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(userCredentials);

      expect(signInResponse.body).toHaveProperty('accessToken');

      const accessToken = signInResponse.body;

      const response = await request(app.getHttpServer())
        .get('/posts')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      expect({
        data: postsService.findAll(),
      });
    });
  });

  describe('GET /posts/:id', () => {
    it('should get a specific post by id', async () => {
      const postId = 'some-post-id';

      const userCredentials = {
        username: 'testUsername',
        password: 'password',
      };

      const signInResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(userCredentials);

      expect(signInResponse.body).toHaveProperty('accessToken');

      const accessToken = signInResponse.body;

      const response = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      expect({
        data: postsService.findOne(),
      });
    });
  });

  describe('PUT /posts/:id', () => {
    it('should update a specific post', async () => {
      const postId = 'some-post-id';
      const updatePostDto = {
        description: 'Updated post description',
      };

      const userCredentials = {
        username: 'testUsername',
        password: 'password',
      };

      const signInResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(userCredentials);

      expect(signInResponse.body).toHaveProperty('accessToken');

      const accessToken = signInResponse.body;

      return await request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePostDto)
        .expect(HttpStatus.NO_CONTENT);
    });
  });

  describe('DELETE /posts/:id', () => {
    it('should delete a specific post', async () => {
      const postId = 'some-post-id';

      const userCredentials = {
        username: 'testUsername',
        password: 'password',
      };

      const signInResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(userCredentials);

      expect(signInResponse.body).toHaveProperty('accessToken');

      const accessToken = signInResponse.body;

      const response = await request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(HttpStatus.NO_CONTENT);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
