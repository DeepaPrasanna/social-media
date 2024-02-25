import { Injectable } from '@nestjs/common';

import { PostsRepository } from './repositories';
import { CreatePostDto, SharePostDto, UpdatePostDto } from './dto';

@Injectable()
export class PostsService {
  constructor(readonly postRepository: PostsRepository) {}

  async create(createPostDto: CreatePostDto, user) {
    const { sub: userId } = user;

    return await this.postRepository.create(createPostDto, userId);
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
