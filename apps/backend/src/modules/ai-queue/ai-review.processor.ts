import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { ReviewStatus } from "@prisma/client";
import { Job } from "bullmq";
import { PrismaService } from "src/prisma/prisma.service";


@Processor('ai-reviews')
export class AiReviewProcessor extends WorkerHost {
    private readonly logger = new Logger(AiReviewProcessor.name);
    constructor(
        private readonly prisma: PrismaService,
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

        this.logger.log(`🔑 Obteniendo token de acceso para la instalación ${installationId}...`);

        this.logger.log(`📥 Descargando código del PR #${prNumber} de ${repoFullName}...`);

        await new Promise(resolve => setTimeout(resolve, 5000));

        this.logger.log(`✅ Revisión de IA completada para el PR: ${job.data.pullRequestId}`);

        return { status: 'success', message: 'Código revisado correctamente' };
    }

    @OnWorkerEvent('completed')
    async onCompleted(job: Job, result: any): Promise<void> {
        this.logger.log(`✅ Trabajo completado: ${job.id}. Resultado: ${result?.message}`); await this.prisma.aiReview.update({
            where: {
                id: job.data.aiReviewId
            },
            data: {
                status: ReviewStatus.COMPLETED
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
                status: ReviewStatus.FAILED
            }
        })
    }

}