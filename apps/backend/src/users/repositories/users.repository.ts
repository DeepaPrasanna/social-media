import { User } from '@prisma/client';
import { Injectable } from '@nestjs/common';

import { CreateUserDto } from '../dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<void> {
    const { firstName, lastName, email, password, contact } = createUserDto;

    await this.prismaService.user.create({
      data: { firstName, lastName, email, password, contact: +contact },
    });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    return user;
  }
}
