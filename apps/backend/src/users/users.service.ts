import bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { Upload } from '@aws-sdk/lib-storage';
import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

import { UserRepository } from './repositories';
import { CreateUserDto, ResetPasswordDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  private readonly AWS_S3_BUCKET: string;
  private readonly s3: S3Client;

  constructor(
    private readonly userRepository: UserRepository,
    private configService: ConfigService
  ) {
    this.AWS_S3_BUCKET = this.configService.get<string>('AWS_S3_BUCKET');

    this.s3 = new S3Client({
      credentials: {
        accessKeyId: this.configService.get<string>('ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('SECRET_ACCESS_KEY'),
      },
      region: this.configService.get<string>('BUCKET_REGION'),
    });
  }

  async create(createUserDto: CreateUserDto) {
    await this.userRepository.create(createUserDto);
  }

  async findOne(id: string) {
    return await this.userRepository.findOne(id);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOneByEmail(email);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return await this.userRepository.update(id, updateUserDto);
  }

  async remove(id: string) {
    return await this.userRepository.delete(id);
  }

  async resetPassword(id: string, resetPasswordDto: ResetPasswordDto) {
    const { newPassword } = resetPasswordDto;
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    return await this.userRepository.resetPassword(id, hashedPassword);
  }

  async uploadProfilePic(file, userId: string) {
    const { buffer, originalname, mimetype } = file;

    try {
      const upload = new Upload({
        client: this.s3,
        params: {
          Bucket: this.AWS_S3_BUCKET,
          Key: `profile-pictures/${String(originalname)}`,
          Body: buffer,
          ACL: 'public-read',
          ContentType: mimetype,
          ContentDisposition: 'inline',
        },
      });

      const response = await upload.done();
      return await this.userRepository.updateProfilePic(
        response.Location,
        userId
      );
    } catch (e) {
      console.log(e);
    }
  }
}
