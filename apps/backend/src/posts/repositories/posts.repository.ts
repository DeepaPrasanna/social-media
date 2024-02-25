import { Injectable } from '@nestjs/common';

import { CreatePostDto, SharePostDto, UpdatePostDto } from '../dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PostsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createPostDto: CreatePostDto, userId: string): Promise<void> {
    const { description } = createPostDto;

    await this.prismaService.post.create({
      data: { description, authorId: userId, createdOn: new Date() },
    });
  }

  async findAll(userId: string) {
    return await this.prismaService.post.aggregateRaw({
      pipeline: [
        {
          $match: {
            authorId: { $oid: userId },
          },
        },
        {
          $lookup: {
            from: 'shared-posts',
            localField: '_id',
            foreignField: 'postId',
            as: 'sharedPosts',
          },
        },
        {
          $project: {
            description: 1,
            createdOn: 1,
            numberOfShares: { $size: '$sharedPosts' },
          },
        },
      ],
    });
  }

  async findOne(id: string) {
    const post = await this.prismaService.post.aggregateRaw({
      pipeline: [
        {
          $match: {
            _id: { $oid: id },
          },
        },
        {
          $lookup: {
            from: 'shared-posts',
            localField: '_id',
            foreignField: 'postId',
            as: 'sharedPosts',
          },
        },
        {
          $project: {
            description: 1,
            createdOn: 1,
            numberOfShares: { $size: '$sharedPosts' },
          },
        },
      ],
    });

    return post[0];
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    await this.prismaService.post.update({
      where: { id },
      data: { ...updatePostDto, updatedAt: new Date() },
    });
  }

  async delete(id: string) {
    await this.prismaService.post.delete({ where: { id } });
  }

  async search(query: string) {
    return await this.prismaService.post.aggregateRaw({
      pipeline: [
        {
          $search: {
            index: 'title',
            text: {
              query,
              path: 'description',
              fuzzy: {},
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'authorId',
            foreignField: '_id',
            as: 'author',
          },
        },
        {
          $unwind: '$author',
        },
        {
          $project: {
            description: 1,
            createdOn: 1,
            'author.firstName': 1,
            'author.lastName': 1,
            'author._id': 1,
          },
        },
      ],
    });
  }

  async share(id: string, sharePostDto: SharePostDto) {
    await this.prismaService.sharedPost.create({
      data: {
        postId: id,
        userId: sharePostDto.userId,
      },
    });
  }

  async getSharedPosts(userId: string) {
    return await this.prismaService.sharedPost.aggregateRaw({
      pipeline: [
        {
          $match: {
            userId: { $oid: userId },
          },
        },
        {
          $lookup: {
            from: 'posts',
            localField: 'postId',
            foreignField: '_id',
            as: 'post',
          },
        },
        {
          $unwind: '$post',
        },
        {
          $lookup: {
            from: 'users',
            localField: 'post.authorId',
            foreignField: '_id',
            as: 'author',
          },
        },
        {
          $unwind: '$author',
        },
        {
          $project: {
            'post._id': 1,
            'post.description': 1,
            'post.created_on': 1,
            'author.firstName': 1,
            'author.lastName': 1,
            'author._id': 1,
          },
        },
      ],
    });
  }
}
