export interface User {
    id: string;
    githubUsername: string;
    role: UserRole;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
}

export enum UserRole {
    ADMIN = "ADMIN",
    DEVELOPER = "DEVELOPER",
}