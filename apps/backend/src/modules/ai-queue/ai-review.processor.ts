import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { ReviewStatus } from "@prisma/client";
import { Job } from "bullmq";
import { PrismaService } from "src/prisma/prisma.service";
import { AiService } from "../ai-engine/ai.service";
import { formatReviewToGithubReview } from "src/common/utils/formatReviewToGithubReview";
import { GithubApiService } from "../github-api/github-api.service";


@Processor('ai-reviews')
export class AiReviewProcessor extends WorkerHost {
    private readonly logger = new Logger(AiReviewProcessor.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly aiService: AiService,
        private readonly githubApiService: GithubApiService
    ) {
        super();
    }

    async process(job: Job): Promise<any> {

        const { aiReviewId, pullRequestId, installationId } = job.data

        this.logger.log(`⚙️ Iniciando procesamiento de trabajo ID: ${job.id}`);
        this.logger.log(`📦 Datos del PR a revisar: ${JSON.stringify(job.data)}`);

        const aiReview = await this.prisma.aiReview.findUnique({
            where: {
                id: aiReviewId
            },
        })

        if (!aiReview) {
            throw new Error(`AI Review ${job.data.aiReviewId} no encontrado`);
        }

        await this.prisma.aiReview.update({
            where: {
                id: aiReviewId
            },
            data: {
                status: ReviewStatus.PROCESSING
            }
        })

        const pullRequest = await this.prisma.pullRequest.findUnique({
            where: {
                id: pullRequestId
            },
            include: {
                repository: true
            }
        })

        if (!pullRequest || !pullRequest.repository) {
            throw new Error(`PR o Repositorio no encontrado en la BD para el ID: ${pullRequestId}`);
        }

        const repoFullName = pullRequest.repository.name
        const prNumber = pullRequest.number

        const { diff, length, status, message } = await this.aiService.extractDiff(repoFullName, prNumber, installationId);

        if (status !== 'success') {
            throw new Error(`Fallo al descargar el Diff de GitHub: ${message}`);
        }

        if (length > 100000) {
            this.logger.warn(`🚫 PR #${prNumber} excede el límite de tamaño (${length} chars). Fallando graciosamente.`);

            // Lo marcamos como fallido directamente por tamaño excedido
            await this.prisma.aiReview.update({
                where: { id: aiReviewId },
                data: {
                    status: 'FAILED',
                    summary: 'PR Too Large. The diff exceeds the maximum allowed length of 100,000 characters.',
                    updatedAt: new Date(),
                    completedAt: new Date(),
                }
            });
            // Al hacer return en lugar de throw, evitamos que BullMQ lo reintente (porque el PR seguirá siendo gigante)
            return { status: 'failed', message: 'PR Too Large' };
        }

        const aiProvider = this.aiService.getProvider();
        const reviewResult = await aiProvider.generateReview(diff, repoFullName, prNumber);

        // TODO: Enviar aiMarkdownReview de vuelta a GitHub como un comentario en el PR
        console.log(reviewResult);
        this.logger.log(`💾 Guardando resultados estructurados en Prisma (Score: ${reviewResult.score})`);

        await this.prisma.aiReview.update({
            where: { id: aiReviewId },
            data: {
                status: 'COMPLETED',
                score: reviewResult.score,
                summary: reviewResult.summary,
                issues: reviewResult.issues,
                updatedAt: new Date(),
                completedAt: new Date(),
            }
        });


        const githubReviewData = formatReviewToGithubReview(reviewResult);

        await this.githubApiService.createPullRequestReview(
            installationId,
            repoFullName,
            prNumber,
            githubReviewData.summaryMarkdown,
            githubReviewData.lineComments
        );



        this.logger.log(`✅ Revisión de IA completada para el PR: ${job.data.pullRequestId}`);

        return { status: 'success', message: 'Revisión generada correctamente', score: reviewResult.score };
    }

    @OnWorkerEvent('completed')
    async onCompleted(job: Job, result: any): Promise<void> {
        this.logger.log(`✅ Trabajo completado: ${job.id}. Resultado: ${result?.message}`);
        await this.prisma.aiReview.update({
            where: {
                id: job.data.aiReviewId
            },
            data: {
                status: ReviewStatus.COMPLETED,
                updatedAt: new Date(),
                completedAt: new Date(),
            }
        })
    }

    @OnWorkerEvent('failed')
    async onFailed(job: Job | undefined, error: Error): Promise<void> {
        const jobId = job ? job.id : 'desconocido';
        const reviewId = job?.data?.aiReviewId;

        if (!reviewId) {
            this.logger.error(`❌ Trabajo fallido [ID: ${jobId}]: ${error.message}`, error.stack);
            return;
        }
        this.logger.error(`❌ Trabajo fallido [ID: ${jobId}]: ${error.message}`, error.stack);
        await this.prisma.aiReview.update({
            where: {
                id: reviewId
            },
            data: {
                status: ReviewStatus.FAILED,
                updatedAt: new Date(),
                completedAt: new Date(),
            }
        })
    }

}