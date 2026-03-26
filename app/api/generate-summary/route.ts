// app/api/generate-summary/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const FALLBACK_PROMPT = `
Eres un asistente que resume transcripciones de videos de YouTube en español.

Formato (Markdown):
1. Resumen ejecutivo (3-5 bullets)
2. Puntos clave (5-10 viñetas)
3. Acciones o recomendaciones (opcionales)
4. Citas textuales breves (opcional)
5. Glosario técnico (opcional)

Reglas:
- Sé conciso y evita relleno.
- No inventes información no presente en la transcripción.
- Si falta contenido o es ruidoso, indícalo brevemente al inicio.
- Omite secciones sin contenido.
`.trim();

// Initialize OpenAI with your API key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { content } = await request.json();

        if (!content) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            );
        }

        // Read the prompt file, fall back to a safe default if missing/empty
        const promptPath = path.join(process.cwd(), 'instructions', 'PromptResumen.md');
        let prompt = FALLBACK_PROMPT;

        try {
            if (fs.existsSync(promptPath)) {
                const fileContent = fs.readFileSync(promptPath, 'utf8').trim();
                prompt = fileContent || FALLBACK_PROMPT;
            } else {
                console.warn('PromptResumen.md no encontrado, usando prompt por defecto.');
            }
        } catch (readError) {
            console.warn('No se pudo leer PromptResumen.md, usando prompt por defecto.', readError);
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [
                {
                    role: "system",
                    content: prompt
                },
                {
                    role: "user",
                    content: `Por favor, resume la siguiente transcripción siguiendo el formato especificado en el prompt:\n\n${content}`
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        return NextResponse.json({
            summary: response.choices[0].message.content
        });
    } catch (error: unknown) {
        console.error('Error generating summary:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        const stack = error instanceof Error ? error.stack : undefined;
        return NextResponse.json(
            {
                error: 'Error al generar el resumen',
                details: message,
                stack: process.env.NODE_ENV === 'development' ? stack : undefined
            },
            { status: 500 }
        );
    }
}
