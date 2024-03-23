import { Injectable } from '@nestjs/common';
import { Upload } from '@aws-sdk/lib-storage';
import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

import { PostsRepository } from './repositories';
import { CreatePostDto, SharePostDto, UpdatePostDto } from './dto';

@Injectable()
export class PostsService {
  constructor(
    readonly postRepository: PostsRepository,
    private configService: ConfigService
  ) {}

  AWS_S3_BUCKET = this.configService.get<string>('AWS_S3_BUCKET');
  s3 = new S3Client({
    credentials: {
      accessKeyId: this.configService.get<string>('ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('SECRET_ACCESS_KEY'),
    },
    region: this.configService.get<string>('BUCKET_REGION'),
  });

  async create(createPostDto: CreatePostDto, user, file) {
    const { sub: userId } = user;

    const imageUrl = file ? await this.uploadPostImage(file) : null;

    return await this.postRepository.create(createPostDto, userId, imageUrl);
  }

  async uploadPostImage(file) {
    const { buffer, originalname, mimetype } = file;
    const bucket = this.AWS_S3_BUCKET;

    try {
      const upload = new Upload({
        client: this.s3,
        params: {
          Bucket: bucket,
          Key: `posts/${String(originalname)}`,
          Body: buffer,
          ACL: 'public-read',
          ContentType: mimetype,
          ContentDisposition: 'inline',
        },
      });
      const response = await upload.done();
      return response.Location;
    } catch (e) {
      console.log(e);
    }
  }
  async findAll(user) {
    const { sub: userId } = user;

    const posts = await this.postRepository.findAll(userId);

    const sharedPosts = await this.postRepository.getSharedPosts(userId);

    return { posts, sharedPosts };
  }

  async findOne(id: string) {
    return await this.postRepository.findOne(id);
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    return await this.postRepository.update(id, updatePostDto);
  }

  remove(id: string) {
    return this.postRepository.delete(id);
  }

  search(query: string) {
    return this.postRepository.search(query);
  }

  share(id: string, sharePostDto: SharePostDto) {
    return this.postRepository.share(id, sharePostDto);
  }
}
