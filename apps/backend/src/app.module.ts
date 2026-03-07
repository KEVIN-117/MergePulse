import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JobsModule } from './jobs/jobs.module';
import { PrismaModule } from './prisma/prisma.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { AuthModule } from './modules/auth/auth.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { UserModule } from './modules/user/user.module';
import { RepositoriesModule } from './modules/repositories/repositories.module';
import { AiQueueModuleModule } from './modules/ai-queue/ai-queue.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('BULLMQ_HOST'),
          port: configService.get<number>('BULLMQ_PORT'),
          password: configService.get<string>('BULLMQ_PASSWORD'),
          db: configService.get<number>('BULLMQ_DB'),
        },
      }),
    }),
    PrismaModule,
    JobsModule,
    OrganizationsModule,
    AuthModule,
    WebhooksModule,
    UserModule,
    RepositoriesModule,
    AiQueueModuleModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
