import { Test, TestingModule } from '@nestjs/testing';

import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { CreatePostDto, UpdatePostDto } from './dto';

describe('PostsController', () => {
  let controller: PostsController;
  let postsService: PostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
    postsService = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Create Post', () => {
    it('should call with correct parameters', async () => {
      const createPostDto: CreatePostDto = {
        description: 'This is a post description. This is for testing purposes',
      };

      const createPostSpy = jest
        .spyOn(postsService, 'create')
        .mockResolvedValue();

      const reqMockObj = { user: { user_id: 'some-random-id' } };

      await controller.create(createPostDto, reqMockObj);

      expect(createPostSpy).toHaveBeenCalledWith(
        createPostDto,
        reqMockObj.user
      );
    });
  });

  describe('Find All Posts', () => {
    it('should call with correct parameters', async () => {
      const mockPosts = [
        {
          id: 'some-id',
          description: 'test description',
          authorId: 'some-author-id',
          createdOn: new Date(),
          updatedAt: new Date(),
        },

        {
          id: 'some-id-2',
          description: 'test description 2',
          authorId: 'some-author-id-2',
          createdOn: new Date(),
          updatedAt: new Date(),
        },
      ];
      const findAllSpy = jest
        .spyOn(postsService, 'findAll')
        .mockResolvedValue(mockPosts);

      const reqMockObj = { user: { user_id: 'some-random-id' } };

      await controller.findAll(reqMockObj);

      expect(findAllSpy).toHaveBeenCalledWith(reqMockObj.user);
    });

    it('should return posts', async () => {
      const mockPosts = [
        {
          id: 'some-id',
          description: 'test description',
          authorId: 'some-author-id',
          createdOn: new Date(),
          updatedAt: new Date(),
        },

        {
          id: 'some-id-2',
          description: 'test description 2',
          authorId: 'some-author-id-2',
          createdOn: new Date(),
          updatedAt: new Date(),
        },
      ];
      jest.spyOn(postsService, 'findAll').mockResolvedValue(mockPosts);

      const reqMockObj = { user: { user_id: 'some-random-id' } };

      const result = await controller.findAll(reqMockObj);

      expect(result).toEqual(mockPosts);
    });

    it('should return [] if no posts are found', async () => {
      const mockPosts = [];

      jest.spyOn(postsService, 'findAll').mockResolvedValue(mockPosts);

      const reqMockObj = { user: { user_id: 'some-random-id' } };

      const result = await controller.findAll(reqMockObj);

      expect(result).toEqual(mockPosts);
      expect(mockPosts).toEqual([]);
    });
  });

  describe('Find One Post by id', () => {
    it('should call with post id', async () => {
      const mockPost = {
        id: 'some-id',
        description: 'test description',
        authorId: 'some-author-id',
        createdOn: new Date(),
        updatedAt: new Date(),
      };

      const findOneSpy = jest
        .spyOn(postsService, 'findOne')
        .mockResolvedValue(mockPost);

      const postId = 'some-post-id';

      await controller.findOne(postId);

      expect(findOneSpy).toHaveBeenCalledWith(postId);
    });

    it('should return post object', async () => {
      const mockPost = {
        id: 'some-id',
        description: 'test description',
        authorId: 'some-author-id',
        createdOn: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(postsService, 'findOne').mockResolvedValue(mockPost);

      const postId = 'some-post-id';

      const result = await controller.findOne(postId);

      expect(result).toEqual(mockPost);
    });

    it('should return null if no post with id is found', async () => {
      const mockPost = null;

      jest.spyOn(postsService, 'findOne').mockResolvedValue(mockPost);

      const postId = 'some-post-id';

      const result = await controller.findOne(postId);

      expect(result).toEqual(null);
    });
  });

  describe('Update Post', () => {
    it('should call with correct parameters', async () => {
      const updatePostDto: UpdatePostDto = {
        description: 'Updated post description',
      };

      const updateSpy = jest.spyOn(postsService, 'update').mockResolvedValue();

      const postId = 'some-post-id';

      await controller.update(postId, updatePostDto);

      expect(updateSpy).toHaveBeenCalledWith(postId, updatePostDto);
    });
  });

  describe('Remove Post', () => {
    it('should call with correct parameters', async () => {
      const removeSpy = jest.spyOn(postsService, 'remove').mockResolvedValue();

      const postId = 'some-post-id';

      await controller.remove(postId);

      expect(removeSpy).toHaveBeenCalledWith(postId);
    });
  });
});
