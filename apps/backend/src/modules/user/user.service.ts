import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) { }
  create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: createUserDto,
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(githubId: string) {
    return this.prisma.user.findUnique({
      where: { githubId },
    });
  }

  update(githubId: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { githubId },
      data: updateUserDto,
    });
  }

  remove(githubId: string) {
    return this.prisma.user.delete({
      where: { githubId },
    });
  }
}
