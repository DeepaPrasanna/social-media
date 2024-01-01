import { User } from '@prisma/client';
import { Injectable } from '@nestjs/common';

import { CreateUserDto } from './dto';
import { UserRepository } from './repositories/users.repository';
// import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}
  async create(createUserDto: CreateUserDto) {
    await this.userRepository.create(createUserDto);
  }

  // findAll() {
  //   return `This action returns all users`;
  // }

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOneByEmail(email);
  }

  // update(id: number, updateUserDto: UpdateUserDto) {
  //   return `This action updates a #${id} user`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} user`;
  // }
}
