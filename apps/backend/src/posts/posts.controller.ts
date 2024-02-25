import {
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  Request,
  HttpCode,
  HttpStatus,
  Controller,
} from '@nestjs/common';

import { PostsService } from './posts.service';
import { CreatePostDto, SharePostDto, UpdatePostDto } from './dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Body() createPostDto: CreatePostDto, @Request() req) {
    return this.postsService.create(createPostDto, req.user);
  }

  @Get()
  findAll(@Request() req) {
    return this.postsService.findAll(req.user);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.postsService.search(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Post(':id/share')
  share(@Param('id') id: string, @Body() sharePostDto: SharePostDto) {
    return this.postsService.share(id, sharePostDto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(id, updatePostDto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }
}
