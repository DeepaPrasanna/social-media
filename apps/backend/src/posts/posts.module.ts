import { Module } from '@nestjs/common';

import { PostsService } from './posts.service';
import { PostsRepository } from './repositories';
import { PostsController } from './posts.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PostsController],
  providers: [PostsService, PostsRepository],
})
export class PostsModule {}
