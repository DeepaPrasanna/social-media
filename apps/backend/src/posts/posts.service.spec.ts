import { Test, TestingModule } from '@nestjs/testing';

import { PostsService } from './posts.service';
import { PostsRepository } from './repositories';

describe('PostsService', () => {
  let service: PostsService;
  let repository: PostsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PostsRepository,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    repository = module.get<PostsRepository>(PostsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create post', () => {
    it('should successfully create new post', async () => {
      const body = {
        description: 'This is my post description',
      };

      const user_id = 'some-random-id';

      const user = { sub: user_id };
      jest.spyOn(repository, 'create').mockResolvedValue(null);

      await service.create(body, user);

      // assertions
      expect(repository.create).toHaveBeenCalledWith(body, user_id);

      expect(repository.create).toBeCalledTimes(1);
    });
  });

  describe('find all posts of a user', () => {
    it('should successfully return all posts', async () => {
      const user_id = 'some-random-id';

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

      jest.spyOn(repository, 'findAll').mockResolvedValue(mockPosts);

      await service.findAll({ sub: user_id });

      // assertions
      expect(repository.findAll).toHaveBeenCalledWith(user_id);

      expect(repository.findAll).toBeCalledTimes(1);
    });

    it('should return [] if no posts are found', async () => {
      const mockPosts = [];

      const user_id = 'some-random-id';

      jest.spyOn(repository, 'findAll').mockResolvedValue(mockPosts);

      const result = await service.findAll(user_id);

      expect(result).toEqual(mockPosts);
      expect(mockPosts).toEqual([]);
    });
  });

  describe('find a post by its id', () => {
    it('should successfully return a single post', async () => {
      const post_id = 'some-random-id';

      const post = {
        id: 'some-id',
        description: 'test description',
        authorId: 'some-author-id',
        createdOn: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(post);

      await service.findOne(post_id);

      // assertions
      expect(repository.findOne).toHaveBeenCalledWith(post_id);

      expect(repository.findOne).toBeCalledTimes(1);
    });

    it('should return null if no posts are found', async () => {
      const post_id = 'some-random-id';

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await service.findOne(post_id);

      expect(result).toEqual(null);
    });
  });

  it('update a post by its id', async () => {
    const post_id = 'some-random-id';

    const post = {
      description: 'test description',
    };

    await service.update(post_id, post);

    // assertions
    expect(repository.update).toHaveBeenCalledWith(post_id, post);

    expect(repository.update).toBeCalledTimes(1);
  });

  it('delete a post by its id', async () => {
    const post_id = 'some-random-id';

    await service.remove(post_id);

    // assertions
    expect(repository.delete).toHaveBeenCalledWith(post_id);

    expect(repository.delete).toBeCalledTimes(1);
  });
});
