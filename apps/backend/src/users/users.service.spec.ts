import { Test, TestingModule } from '@nestjs/testing';

import { UsersService } from './users.service';
import { UserRepository } from './repositories';

describe('UsersService', () => {
  let service: UsersService;
  let repository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: { findOneByEmail: jest.fn(), create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UserRepository>(UserRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneByEmail', () => {
    it('should return a user if found', async () => {
      const user = {
        id: 'id',
        email: 'tom@test.com',
        firstName: 'Tom',
        lastName: 'Jerry',
        password: 'Tom@123',
        contact: 123456789,
      };

      jest.spyOn(repository, 'findOneByEmail').mockResolvedValue(user);

      const foundUser = await service.findOneByEmail(user.email);

      expect(foundUser).toEqual(user);
    });

    it('should return null if user not found', async () => {
      const user = {
        id: 'id',
        email: 'tom@test.com',
        firstName: 'Tom',
        lastName: 'Jerry',
        password: 'Tom@123',
        contact: 123456789,
      };

      jest.spyOn(repository, 'findOneByEmail').mockResolvedValue(null);

      const result = await service.findOneByEmail(user.email);
      expect(result).toBeNull();
    });
  });

  describe('create user', () => {
    it('should create user', async () => {
      const user = {
        email: 'tom@test.com',
        firstName: 'Tom',
        lastName: 'Jerry',
        password: 'Tom@123',
        contact: '123456789',
      };

      const mockCreateUser = jest
        .spyOn(repository, 'create')
        .mockResolvedValue();

      await service.create(user);

      expect(mockCreateUser).toBeCalledWith(user);
    });
  });
});
