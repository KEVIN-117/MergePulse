import { backendEnvs } from "@repo/validation";

export default {
    port: parseInt(backendEnvs.PORT),
    database: {
        url: backendEnvs.DATABASE_URL,
    },
    github: {
        clientId: backendEnvs.GITHUB_CLIENT_ID,
        clientSecret: backendEnvs.GITHUB_CLIENT_SECRET,
        appId: backendEnvs.GITHUB_APP_ID,
        privateKey: backendEnvs.GITHUB_PRIVATE_KEY,
        callbackUrl: backendEnvs.GITHUB_CALLBACK_URL,
        apiUrl: backendEnvs.GITHUB_API_URL,
        webhookSecret: backendEnvs.GITHUB_WEBHOOK_SECRET,
    },
    jwt: {
        secret: backendEnvs.JWT_SECRET,
    },
}