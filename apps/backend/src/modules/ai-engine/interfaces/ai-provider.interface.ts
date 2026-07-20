export interface IAiProvider<T> {
    /**
     * Recibe el código modificado (diff) y genera una revisión en Markdown.
     */
    generateReview(diffText: string, repoName: string, prNumber: number): Promise<T>;
}