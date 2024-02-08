/* eslint-disable @nx/enforce-module-boundaries */
import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { PostsModule } from 'apps/backend/src/posts/posts.module';
import { PostsService } from 'apps/backend/src/posts/posts.service';

describe('PostsController (e2e)', () => {
  let app: INestApplication;
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
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PostsModule],
    })

      .overrideProvider(PostsService)
      .useValue(postsService)
      .compile();

    app = moduleFixture.createNestApplication();

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /posts', () => {
    it('should create a new post', async () => {
      const createPostDto = {
        description: 'This is a post description.',
      };

      const response = await request(app.getHttpServer())
        .post('/posts')
        .send(createPostDto);

      expect(response.status).toBe(HttpStatus.CREATED);
    });
  });

  describe('GET /posts', () => {
    it('should get all posts', async () => {
      const response = await request(app.getHttpServer()).get('/posts');

      expect(response.status).toBe(HttpStatus.OK);
      expect({
        data: postsService.findAll(),
      });
    });
  });

  describe('GET /posts/:id', () => {
    it('should get a specific post by id', async () => {
      const postId = 'some-post-id';

      const response = await request(app.getHttpServer()).get(
        `/posts/${postId}`
      );

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

      return await request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .send(updatePostDto)
        .expect(HttpStatus.NO_CONTENT);
    });
  });

  describe('DELETE /posts/:id', () => {
    it('should delete a specific post', async () => {
      const postId = 'some-post-id';

      const response = await request(app.getHttpServer()).delete(
        `/posts/${postId}`
      );

      expect(response.status).toBe(HttpStatus.NO_CONTENT);
    });
  });
});
