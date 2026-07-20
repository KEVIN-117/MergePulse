import { IAiProvider } from '../interfaces/ai-provider.interface';
import OpenAI from 'openai';
import { ReviewSchema, ReviewResult } from '../schema/ai-review.schema';
import { Logger } from '@nestjs/common';

export class OpenAiProvider implements IAiProvider<ReviewResult> {
    private readonly logger = new Logger(OpenAiProvider.name);
    private readonly openai: OpenAI;

    constructor(private readonly apiKey: string, private readonly modelName: string) {
        this.openai = new OpenAI({
            apiKey: this.apiKey,
        });
    }

    async generateReview(diffText: string, repoName: string, prNumber: number): Promise<ReviewResult> {
        this.logger.log('🧠 Solicitando análisis estructurado a OpenAI (gpt-4o-mini)...');

        // 2. El Prompt exacto del ticket
        const systemPrompt = `You are a Senior Software Engineer acting as a code reviewer.
        Analyze the provided git diff. Focus on:
        1. Security vulnerabilities.
        2. Performance issues (e.g., N+1 queries, memory leaks).
        3. Code style and SOLID principle violations.
        4. Logic errors.

        You MUST respond with a valid JSON object strictly matching this schema:
        \`\`\`json
        {
        "score": <0-100 integer>,
        "summary": "<concise summary of changes>",
        "issues": [
            {
            "file": "<filename>",
            "line": "<line number or 'general'>",
            "severity": "<low|medium|high|critical>",
            "description": "<short description>"
            }
        ]
        }\`\`\``;

        try {
            // 3. Llamada al LLM con parámetros optimizados para precisión
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                temperature: 0.2, // Baja creatividad, alta precisión
                response_format: { type: 'json_object' }, // Fuerza a que la salida sea un JSON parseable
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: diffText }
                ],
            });

            const content = response.choices[0].message.content;
            if (!content) throw new Error("Respuesta vacía de OpenAI");

            // 4. Parseo y validación estricta con Zod
            const parsedJson = JSON.parse(content);
            const validatedData = ReviewSchema.parse(parsedJson);

            return validatedData;

        } catch (error) {
            this.logger.error('❌ Falló la generación o validación del JSON de la IA', error.message);
            // Si Zod falla, lanzará un ZodError. Al lanzarlo aquí, BullMQ lo atrapará 
            // y mandará el Job a estado 'FAILED' automáticamente.
            throw error;
        }
    }
}