import {
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  HttpCode,
  HttpStatus,
  Controller,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Multer } from 'multer';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

import { UsersService } from './users.service';
import { ResetPasswordDto, UpdateUserDto } from './dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id/reset-password')
  resetPassword(
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetPasswordDto
  ) {
    return this.usersService.resetPassword(id, resetPasswordDto);
  }

  @Post(':id/upload-profile-pic')
  @UseInterceptors(FileInterceptor('file'))
  uploadProfilePic(@UploadedFile() file: Express.Multer.File, @Request() req) {
    return this.usersService.uploadProfilePic(file, req.user.sub);
  }
}
