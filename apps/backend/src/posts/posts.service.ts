import { Injectable } from '@nestjs/common';

import { PostsRepository } from './repositories';
import { CreatePostDto, UpdatePostDto } from './dto';

@Injectable()
export class PostsService {
  constructor(readonly postRepository: PostsRepository) {}

  async create(createPostDto: CreatePostDto, user) {
    const { sub: userId } = user;

    return await this.postRepository.create(createPostDto, userId);
  }

  async findAll(user) {
    const { sub: userId } = user;

    return await this.postRepository.findAll(userId);
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
}
