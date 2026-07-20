import { IAiProvider } from '../interfaces/ai-provider.interface';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { Logger } from '@nestjs/common';
import { ReviewResult, ReviewSchema } from '../schema/ai-review.schema';

export class GeminiProvider implements IAiProvider<ReviewResult> {
    private readonly logger = new Logger(GeminiProvider.name);
    private readonly ai: GoogleGenerativeAI;
    private readonly model: GenerativeModel;

    constructor(private readonly apiKey: string, private readonly modelName: string) {
        const systemPrompt = `You are a Senior Software Engineer acting as a code reviewer.
        Analyze the provided git diff. Focus on:
        1. Security vulnerabilities.
        2. Performance issues (e.g., N+1 queries, memory leaks).
        3. Code style and SOLID principle violations.
        4. Logic errors.

        You MUST respond with a valid JSON object strictly matching this schema:
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
        }`;
        this.ai = new GoogleGenerativeAI(this.apiKey);

        // 2. Elegimos el modelo. 'gemini-2.5-flash' es ideal para velocidad y tareas de código.
        // Si necesitas análisis arquitectónico mucho más profundo, podrías usar la versión 'pro'.
        this.model = this.ai.getGenerativeModel({
            model: this.modelName,
            systemInstruction: systemPrompt, // En Gemini 1.5, el system prompt va aquí
            generationConfig: {
                temperature: 0.2, // Baja creatividad, alta precisión (Requisito del ticket)
                responseMimeType: 'application/json', // Fuerza la salida JSON
            }
        });
    }

    async generateReview(diffText: string, repoName: string, prNumber: number): Promise<ReviewResult> {
        this.logger.log(`✨ Invocando a Gemini para revisar PR #${prNumber} en ${repoName}...`);

        this.logger.log('🧠 Solicitando análisis estructurado a Gemini 1.5 Flash...');

        try {
            // 4. Enviamos el código modificado al modelo
            const result = await this.model.generateContent(diffText);
            const content = result.response.text();

            if (!content) {
                throw new Error("Respuesta vacía de Gemini");
            }

            // 5. Parseo y validación estricta con Zod
            const parsedJson = JSON.parse(content);
            const validatedData = ReviewSchema.parse(parsedJson);

            return validatedData;

        } catch (error) {
            this.logger.error('❌ Falló la generación o validación del JSON de Gemini', error.message);

            // Si Zod detecta que Gemini alucinó y no cumplió el esquema, lanzará un ZodError.
            // Lo dejamos subir para que BullMQ marque el Job como FAILED.
            throw error;
        }
    }
}