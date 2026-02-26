export interface Organization {
    id: string;
    name: string;
    slug: string;
    githubInstallationId: string;
    plan: string;
    createdAt: Date;
    updatedAt: Date;
}