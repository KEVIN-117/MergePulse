import { UserRole } from "@prisma/client";

export class CreateUserDto {
    githubId: string;
    githubUsername: string;
    displayName: string;
    email: string;
    avatarUrl: string;
    lastLoginAt: Date;
    organizationId: string;
    role: UserRole;
}