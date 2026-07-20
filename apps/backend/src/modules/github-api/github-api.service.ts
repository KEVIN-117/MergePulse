import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { ReviewResult } from '../ai-engine/schema/ai-review.schema';
import { GithubLineComment } from './dto/types';

@Injectable()
export class GithubApiService {

  private readonly logger = new Logger(GithubApiService.name);

  private readonly githubApiUrl: string;
  constructor(private readonly authService: AuthService, private readonly configService: ConfigService) {
    this.githubApiUrl = this.configService.get<string>('GITHUB_API_URL') as string;
  }

  async getInstallationAccessToken(installationId: string): Promise<string> {
    try {
      // 1. Generamos el JWT usando el método que ya habías construido
      const appJwt = this.authService.generateAppJwt();


      // 2. Hacemos un POST a GitHub pidiendo las llaves para esta instalación
      const response = await fetch(`${this.githubApiUrl}/app/installations/${installationId}/access_tokens`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${appJwt}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error('No se pudo generar el token de instalación de GitHub');
      }

      const data = await response.json();

      return data.token;

    } catch (error) {
      throw new InternalServerErrorException('Error de comunicación con GitHub');
    }
  }

  /**
   * Publica un comentario en un Pull Request específico.
   */
  async createPullRequestComment(installationId: string, repoFullName: string, prNumber: number, markdownBody: string): Promise<void> {
    try {
      // 1. Obtenemos el token fresco para esta organización
      const token = await this.getInstallationAccessToken(installationId);

      // 2. Hacemos el POST a la API de GitHub
      // Nota: En la API de GitHub, los comentarios de PRs se hacen en el endpoint de /issues/
      const response = await fetch(`${this.githubApiUrl}/repos/${repoFullName}/issues/${prNumber}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: markdownBody,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        this.logger.error(`Fallo al publicar el comentario en el PR #${prNumber}: ${errorData}`);
        throw new Error('No se pudo publicar el comentario en GitHub');
      }

      this.logger.log(`✅ Comentario publicado exitosamente en ${repoFullName}#${prNumber}`);

    } catch (error) {
      this.logger.error(`Error en createPullRequestComment: ${error.message}`);
      throw error;
    }
  }

  async createPullRequestReview(installationId: string, repoFullName: string, prNumber: number, summaryMarkdown: string, lineComments: GithubLineComment[]) {
    try {
      const token = await this.getInstallationAccessToken(installationId)

      const res = await fetch(`${this.githubApiUrl}/repos/${repoFullName}/pulls/${prNumber}/reviews`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: summaryMarkdown,
          event: 'COMMENT',
          comments: lineComments,
        }),
      })

      if (!res.ok) {
        const errorData = await res.text();
        this.logger.error(`Fallo al publicar el review en el PR #${prNumber}: ${errorData}`);
        throw new Error('No se pudo publicar el review en GitHub');
      }

      this.logger.log(`✅ Review publicado exitosamente en ${repoFullName}#${prNumber}`);

    } catch (error) {
      this.logger.error(`Error en createPullRequestReview: ${error.message}`);
      throw error;
    }
  }


  formatReviewToMarkdown(review: ReviewResult): string {
    // 1. Asignar color/emoji al Score general
    let scoreBadge = '🟢';
    if (review.score < 80) scoreBadge = '🟡';
    if (review.score < 50) scoreBadge = '🔴';

    // 2. Construir la cabecera y el resumen
    let markdown = `## 🤖 MergePulse AI Review\n\n`;
    markdown += `**Score de Calidad:** ${scoreBadge} **${review.score}/100**\n\n`;
    markdown += `### 📝 Resumen\n${review.summary}\n\n`;

    // 3. Si no hay problemas, felicitamos al dev
    if (!review.issues || review.issues.length === 0) {
      markdown += `✨ **¡Excelente trabajo!** No se encontraron problemas de seguridad, rendimiento o arquitectura en este código.\n`;
      return markdown;
    }

    // 4. Si hay problemas, construimos una tabla de Markdown
    markdown += `### 🚨 Hallazgos (Issues)\n\n`;
    markdown += `| Severidad | Archivo | Línea | Descripción |\n`;
    markdown += `| :--- | :--- | :--- | :--- |\n`;

    review.issues.forEach((issue) => {
      let severityIcon = '⚪';
      switch (issue.severity.toLowerCase()) {
        case 'critical': severityIcon = '🔥 CRITICAL'; break;
        case 'high': severityIcon = '🔴 HIGH'; break;
        case 'medium': severityIcon = '🟡 MEDIUM'; break;
        case 'low': severityIcon = '🔵 LOW'; break;
      }

      markdown += `| ${severityIcon} | \`${issue.file}\` | \`${issue.line}\` | ${issue.description} |\n`;
    });

    return markdown;
  }
}
