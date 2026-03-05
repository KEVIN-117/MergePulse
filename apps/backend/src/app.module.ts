import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JobsModule } from './jobs/jobs.module';
import { PrismaModule } from './prisma/prisma.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { AuthModule } from './modules/auth/auth.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { UserModule } from './modules/user/user.module';
import { RepositoriesModule } from './modules/repositories/repositories.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }), PrismaModule, JobsModule, OrganizationsModule, AuthModule, WebhooksModule, UserModule, RepositoriesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
