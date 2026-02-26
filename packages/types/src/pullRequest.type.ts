export interface PullRequest {
    id: string;
    githubPrId: string;
    number: number;
    title: string;
    status: PrStatus;
    repositoryId: string;
    organizationId: string;
    authorId: string;
    createdAt: Date;
    closedAt: Date;
    mergedAt: Date;
}

export enum PrStatus {
    OPEN = "OPEN",
    CLOSED = "CLOSED",
    MERGED = "MERGED",
}