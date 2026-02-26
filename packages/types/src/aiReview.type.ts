export interface AiReview {
    id: string;
    pullRequestId: string;
    status: ReviewStatus;
    score: number;
    summary: string;
    issues: string;
    startedAt: Date;
    completedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export enum ReviewStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
}