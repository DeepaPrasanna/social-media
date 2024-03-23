import { ConfigService } from '@nestjs/config';
import { mockClient } from 'aws-sdk-client-mock';
import { Test, TestingModule } from '@nestjs/testing';
import {
  S3Client,
  UploadPartCommand,
  CreateMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

import { UsersService } from './users.service';
import { UserRepository } from './repositories';
import { ResetPasswordDto, UpdateUserDto } from './dto';

describe('UsersService', () => {
  let service: UsersService;
  let repository: UserRepository;

  const mockedConfigService = {
    get(key: string | number) {
      switch (key) {
        case 'AWS_S3_BUCKET':
          return 'some value';
      }
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: {
            findOneByEmail: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            resetPassword: jest.fn(),
            updateProfilePic: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: mockedConfigService,
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
        profileUrl: null,
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
        profileUrl: null,
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

  describe('findOneById', () => {
    it('should return a user if found', async () => {
      const user = {
        id: 'id',
        email: 'tom@test.com',
        firstName: 'Tom',
        lastName: 'Jerry',
        password: 'Tom@123',
        contact: 123456789,
        profileUrl: null,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(user);

      const foundUser = await service.findOne(user.id);

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
        profileUrl: null,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await service.findOne(user.id);
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const userId = 'id';
      const updateUserDto: UpdateUserDto = {
        firstName: 'UpdatedFirstName',
        lastName: 'UpdatedLastName',
        contact: '1234567890',
      };

      const mockUpdateUser = jest
        .spyOn(repository, 'update')
        .mockResolvedValue();

      await service.update(userId, updateUserDto);

      expect(mockUpdateUser).toBeCalledWith(userId, updateUserDto);
    });
  });

  describe('remove', () => {
    it('should delete user', async () => {
      const userId = 'id';

      const mockDeleteUser = jest
        .spyOn(repository, 'delete')
        .mockResolvedValue();

      await service.remove(userId);

      expect(mockDeleteUser).toBeCalledWith(userId);
    });
  });

  describe('resetPassword', () => {
    it('should reset user password', async () => {
      const userId = 'id';
      const resetPasswordDto: ResetPasswordDto = {
        newPassword: 'NewPassword@123',
      };

      const mockResetPassword = jest
        .spyOn(repository, 'resetPassword')
        .mockResolvedValue();

      await service.resetPassword(userId, resetPasswordDto);

      expect(mockResetPassword).toBeCalledWith(userId, expect.any(String));
    });
  });

  describe('uploadProfilePic', () => {
    it('should upload profile picture and update user profile URL', async () => {
      const file = {
        buffer: Buffer.from('test content'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        type: 'Buffer',
      };
      const userId = 'id';

      const s3Mock = mockClient(S3Client);
      s3Mock.on(CreateMultipartUploadCommand).resolves({ UploadId: '1' });
      s3Mock.on(UploadPartCommand).resolves({ ETag: '1' });

      const s3Upload = new Upload({
        client: new S3Client({}),
        params: {
          Bucket: 'mock',
          Key: 'test',
          Body: 'x'.repeat(6 * 1024 * 1024), // 6 MB
        },
      });

      await s3Upload.done();

      const mockUpdateProfilePic = jest
        .spyOn(repository, 'updateProfilePic')
        .mockResolvedValue();

      await service.uploadProfilePic(file, userId);

      expect(mockUpdateProfilePic).toHaveBeenCalledWith(
        'https://some%20value.s3.ap-south-1.amazonaws.com/profile-pictures/test.jpg',
        userId
      );
    });
  });
});
