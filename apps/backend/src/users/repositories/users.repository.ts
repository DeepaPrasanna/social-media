import { User } from '@prisma/client';
import { Injectable } from '@nestjs/common';

import { CreateUserDto, UpdateUserDto } from '../dto';
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

  async findOne(id: string) {
    return await this.prismaService.user.findUnique({
      where: { id },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        contact: true,
      },
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

  async delete(id: string): Promise<void> {
    await this.prismaService.user.delete({
      where: {
        id,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<void> {
    const { firstName, lastName, contact } = updateUserDto;
    let body = {};

    if (firstName) body = { ...body, firstName };
    if (lastName) body = { ...body, lastName };
    if (contact) body = { ...body, contact: +contact };

    await this.prismaService.user.update({
      where: { id },
      data: body,
    });
  }

  async resetPassword(id: string, hashedPassword: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });
  }

  async updateProfilePic(url: string, id: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id },
      data: {
        profileUrl: url,
      },
    });
  }
}
