import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { GithubApiService } from '../github-api/github-api.service';
import { Logger } from '@nestjs/common';
import { IAiProvider } from './interfaces/ai-provider.interface';
import { OpenAiProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { ReviewResult } from './schema/ai-review.schema';

@Injectable()
export class AiService {

  private readonly logger = new Logger(AiService.name);

  constructor(private readonly configService: ConfigService, private readonly prisma: PrismaService, private readonly githubApiService: GithubApiService) { }

  getProvider(): IAiProvider<ReviewResult> {
    // Leemos qué IA queremos usar desde el archivo .env
    const providerType = this.configService.get<string>('ACTIVE_AI_PROVIDER', 'OPENAI').toUpperCase();

    switch (providerType) {
      case 'OPENAI':
        const openAiKey = this.configService.getOrThrow<string>('OPENAI_API_KEY');
        const openAiModel = this.configService.getOrThrow<string>('OPENAI_MODEL');
        return new OpenAiProvider(openAiKey, openAiModel);

      case 'GEMINI':
        const geminiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');
        const geminiModel = this.configService.getOrThrow<string>('GEMINI_MODEL');
        return new GeminiProvider(geminiKey, geminiModel);

      default:
        throw new InternalServerErrorException(`Proveedor de IA no soportado: ${providerType}`);
    }
  }

  async extractDiff(repoFullName: string, prNumber: number, installationId: string): Promise<{ diff: string, length: number, status: string, message: string }> {
    this.logger.log(`🔑 Obteniendo token de acceso para la instalación ${installationId}...`);
    const accessToken = await this.githubApiService.getInstallationAccessToken(installationId);

    this.logger.log(`📥 Descargando código del PR #${prNumber} de ${repoFullName}...`);
    const diffResponse = await fetch(`${this.configService.get<string>('GITHUB_API_URL')}/repos/${repoFullName}/pulls/${prNumber}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3.diff',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!diffResponse.ok) {
      const errorText = await diffResponse.text();
      throw new Error(`Fallo al descargar el Diff de GitHub: ${diffResponse.status} - ${errorText}`);
    }

    const diffText = await diffResponse.text();

    // Si el PR está vacío (no hay cambios reales)
    if (!diffText || diffText.trim() === '') {
      this.logger.warn(`El PR #${prNumber} no tiene cambios en el código.`);
      return { status: 'success', message: 'PR sin cambios', diff: '', length: 0 };
    }

    this.logger.log(`✅ Diff descargado con éxito. Tamaño: ${diffText.length} caracteres.`);

    return { status: 'success', message: 'Diff descargado con éxito', diff: diffText, length: diffText.length };
  }
}
