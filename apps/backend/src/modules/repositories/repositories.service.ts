import { Injectable } from '@nestjs/common';
import { CreateRepositoryDto } from './dto/create-repository.dto';
import { UpdateRepositoryDto } from './dto/update-repository.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Repository } from './entities/repository.entity';

@Injectable()
export class RepositoriesService {

  constructor(private readonly prisma: PrismaService) { }

  create(createRepositoryDto: CreateRepositoryDto): Promise<Repository> {
    return this.prisma.repository.create({
      data: createRepositoryDto,
    });
  }

  findAll(): Promise<Repository[]> {
    return this.prisma.repository.findMany();
  }

  findOne(id: string): Promise<Repository> {
    return this.prisma.repository.findUnique({
      where: { id },
    }) as Promise<Repository>;
  }

  update(id: string, updateRepositoryDto: UpdateRepositoryDto): Promise<Repository> {
    return this.prisma.repository.update({
      where: { id },
      data: updateRepositoryDto,
    });
  }

  remove(id: string): Promise<Repository> {
    return this.prisma.repository.delete({
      where: { id },
    });
  }
}
