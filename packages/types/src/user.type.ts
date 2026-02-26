export enum UserRole {
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER',
}

export interface User {
    id: string;
    githubUsername: string;
    role: UserRole;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
}