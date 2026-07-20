import { z } from 'zod';

export const ReviewSchema = z.object({
    score: z.number().min(0).max(100),
    summary: z.string(),
    issues: z.array(z.object({
        file: z.string(),
        line: z.union([z.string(), z.number()]),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
        description: z.string()
    }))
});

export type ReviewResult = z.infer<typeof ReviewSchema>;