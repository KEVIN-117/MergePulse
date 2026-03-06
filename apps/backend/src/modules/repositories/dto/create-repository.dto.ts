import { Visibility } from "@prisma/client";

export class CreateRepositoryDto {
    githubRepoId: string;
    name: string;
    organizationId: string;
    description?: string;
    url?: string;
    stars?: number;
    forks?: number;
    visibility: Visibility;
}
