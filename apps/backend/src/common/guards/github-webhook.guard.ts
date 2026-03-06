import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Observable } from "rxjs";
import { ConfigService } from "@nestjs/config";
import { verifySignature } from "../utils/verify-signature";

@Injectable()
export class GithubWebhookGuard implements CanActivate {

    constructor(private readonly configService: ConfigService) { }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const signature = request.headers['x-hub-signature-256'];

        if (!signature) {
            throw new UnauthorizedException('Missing signature');
        }

        const payload = request.rawBody;
        if (!payload) {
            throw new UnauthorizedException('Missing payload');
        }
        const secret = this.configService.get<string>('GITHUB_WEBHOOK_SECRET')!;
        if (!secret) {
            throw new UnauthorizedException('Missing secret');
        }
        const isValid = verifySignature(signature, payload, secret);
        if (!isValid) {
            throw new UnauthorizedException('Invalid signature');
        }
        return true;
    }
}
