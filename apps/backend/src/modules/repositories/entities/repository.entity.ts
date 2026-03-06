import { Repository as PrismaRepository, Visibility } from '@prisma/client';

export class Repository implements PrismaRepository {
    createdAt: Date;
    updatedAt: Date;
    id: string;
    githubRepoId: string;
    name: string;
    description: string | null;
    url: string | null;
    stars: number | null;
    forks: number | null;
    visibility: Visibility;
    organizationId: string;
}
