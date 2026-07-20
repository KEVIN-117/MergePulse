import { ReviewResult } from "src/modules/ai-engine/schema/ai-review.schema";
import { GithubLineComment, GithubReviewData } from "src/modules/github-api/dto/types";

export function formatReviewToGithubReview(review: ReviewResult): GithubReviewData {
    // 1. Asignar color/emoji al Score general
    let scoreBadge = '🟢';
    if (review.score < 80) scoreBadge = '🟡';
    if (review.score < 50) scoreBadge = '🔴';

    // 2. Construir el Resumen Principal (Markdown).
    let summaryMarkdown = `## Resumen de la Revisión de IA\n\n`;
    summaryMarkdown += `**Puntuación de la IA:** ${scoreBadge} **${review.score}/100**\n\n`;
    summaryMarkdown += `### 📝 Resumen General\n${review.summary}\n\n`;

    // 3. Si no hay problemas, felicitamos al dev y terminamos
    if (!review.issues || review.issues.length === 0) {
        summaryMarkdown += `✨ **¡Excelente trabajo!** No se encontraron problemas de seguridad, rendimiento o arquitectura en este código.\n`;
        return { summaryMarkdown, lineComments: [] };
    }

    // 4. Si hay problemas, los separamos. Los "generales" van al resumen principal.
    // Los de línea específica se convierten en la matriz lineComments.
    const generalIssues = review.issues.filter(issue => issue.line === 'general');
    const lineIssues = review.issues.filter(issue => typeof issue.line === 'number');

    if (generalIssues.length > 0) {
        summaryMarkdown += `### 🌐 Problemas Generales (No vinculados a una línea)\n\n`;
        generalIssues.forEach(issue => {
            let severityIcon = '⚪';
            switch (issue.severity.toLowerCase()) {
                case 'critical': severityIcon = '🔥 CRITICAL'; break;
                case 'high': severityIcon = '🔴 HIGH'; break;
                case 'medium': severityIcon = '🟡 MEDIUM'; break;
                case 'low': severityIcon = '🔵 LOW'; break;
            }
            summaryMarkdown += `- **${severityIcon}:** ${issue.description}\n`;
        });
        summaryMarkdown += `\n`;
    }

    // 5. Construir la matriz de comentarios de línea
    const lineComments = lineIssues.map((issue): GithubLineComment => {
        let severityIcon = '⚪';
        switch (issue.severity.toLowerCase()) {
            case 'critical': severityIcon = '🔥 CRITICAL'; break;
            case 'high': severityIcon = '🔴 HIGH'; break;
            case 'medium': severityIcon = '🟡 MEDIUM'; break;
            case 'low': severityIcon = '🔵 LOW'; break;
        }

        // Creamos el texto Markdown para el comentario de línea individual
        const commentBody = `**Severidad:** ${severityIcon}\n\n**Descripción:** ${issue.description}`;

        // Creamos el objeto con path e line
        return {
            path: issue.file,
            body: commentBody,
            line: issue.line as number, // Zod ya valida que sea número
            side: 'RIGHT', // Asumimos código agregado/modificado. Si la IA detecta eliminado, necesitarás más lógica.
            position: issue.line as number,
        };
    });

    return { summaryMarkdown, lineComments };
}