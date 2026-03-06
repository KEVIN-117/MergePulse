import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { UserModule } from '../user/user.module';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [UserModule, AuthModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, ConfigService, JwtService],
})
export class WebhooksModule { }
