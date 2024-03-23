import { Module } from '@nestjs/common';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UserRepository } from './repositories/users.repository';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  exports: [UsersService],
  controllers: [UsersController],
  providers: [UsersService, UserRepository],
})
export class UsersModule {}
