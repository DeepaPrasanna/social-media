import { Injectable } from '@nestjs/common';

import { CreatePostDto, UpdatePostDto } from '../dto';
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
    return await this.prismaService.post.findMany({
      where: { authorId: userId },
    });
  }

  async findOne(id: string) {
    return await this.prismaService.post.findUniqueOrThrow({ where: { id } });
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
}
