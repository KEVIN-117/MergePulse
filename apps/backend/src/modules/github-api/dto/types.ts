export interface GithubReviewData {
    summaryMarkdown: string;
    lineComments: GithubLineComment[];
}

export interface GithubLineComment {
    path: string;
    position: number;
    body: string;
    line?: number;
    side?: 'LEFT' | 'RIGHT';
    start_line?: number;
    start_side?: 'LEFT' | 'RIGHT';
}