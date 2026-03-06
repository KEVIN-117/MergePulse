import { getBackendEnvs } from "@repo/validation";

export default {
    port: parseInt(getBackendEnvs().PORT),
    database: {
        url: getBackendEnvs().DATABASE_URL,
    },
    github: {
        clientId: getBackendEnvs().GITHUB_CLIENT_ID,
        clientSecret: getBackendEnvs().GITHUB_CLIENT_SECRET,
        appId: getBackendEnvs().GITHUB_APP_ID,
        privateKey: getBackendEnvs().GITHUB_PRIVATE_KEY,
        callbackUrl: getBackendEnvs().GITHUB_CALLBACK_URL,
        apiUrl: getBackendEnvs().GITHUB_API_URL,
        webhookSecret: getBackendEnvs().GITHUB_WEBHOOK_SECRET,
    },
    jwt: {
        secret: getBackendEnvs().JWT_SECRET,
    },
}