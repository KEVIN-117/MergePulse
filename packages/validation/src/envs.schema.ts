import { z } from "zod";

interface GlobalEnvs {
    DATABASE_URL: string;
    POSTGRES_DB: string;
    POSTGRES_USER: string;
    POSTGRES_PASSWORD: string;
    POSTGRES_PORT: string;
    REDIS_PORT: string;
    BACKEND_PORT: string;
    WEB_PORT: string;
    DOCS_PORT: string;
}

interface BackendEnvs {
    PORT: string;
    DATABASE_URL: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
    GITHUB_APP_ID: string;
    GITHUB_PRIVATE_KEY: string;
    JWT_SECRET: string;
    GITHUB_CALLBACK_URL: string;
    GITHUB_API_URL: string;
    GITHUB_WEBHOOK_SECRET: string;
}

export const globalEnvsSchema = z.object({
    DATABASE_URL: z.string(),
    POSTGRES_DB: z.string(),
    POSTGRES_USER: z.string(),
    POSTGRES_PASSWORD: z.string(),
    POSTGRES_PORT: z.string(),
    REDIS_PORT: z.string(),
    BACKEND_PORT: z.string(),
    WEB_PORT: z.string(),
    DOCS_PORT: z.string(),
})

export const backendEnvsSchema = z.object({
    PORT: z.string(),
    DATABASE_URL: z.string(),
    GITHUB_CLIENT_ID: z.string(),
    GITHUB_CLIENT_SECRET: z.string(),
    GITHUB_APP_ID: z.string(),
    GITHUB_PRIVATE_KEY: z.string(),
    JWT_SECRET: z.string(),
    GITHUB_CALLBACK_URL: z.string(),
    GITHUB_API_URL: z.string(),
    GITHUB_WEBHOOK_SECRET: z.string(),
})

let _globalEnvs: GlobalEnvs | undefined;
let _backendEnvs: BackendEnvs | undefined;

export function getGlobalEnvs(): GlobalEnvs {
    if (!_globalEnvs) {
        _globalEnvs = globalEnvsSchema.parse(process.env);
    }
    return _globalEnvs;
}

export function getBackendEnvs(): BackendEnvs {
    if (!_backendEnvs) {
        _backendEnvs = backendEnvsSchema.parse(process.env);
    }
    return _backendEnvs;
}
