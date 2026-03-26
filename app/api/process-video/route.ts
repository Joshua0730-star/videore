// app/api/process-video/route.ts
import { NextResponse } from 'next/server'
import { SUPADATA_CONFIG } from '@/lib/supadata/config'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const url = searchParams.get('url')
        const lang = searchParams.get('lang') || 'es'

        if (!url) {
            return NextResponse.json(
                { error: 'URL es requerida' },
                { status: 400 }
            )
        }

        if (!SUPADATA_CONFIG.API_KEY) {
            return NextResponse.json(
                { error: 'Error de configuración: Falta la API key de SUPADATA' },
                { status: 500 }
            )
        }

        const apiUrl = new URL(`${SUPADATA_CONFIG.API_URL}/transcript`)
        apiUrl.searchParams.append('url', url)
        apiUrl.searchParams.append('lang', lang)
        apiUrl.searchParams.append('text', 'true')

        const response = await fetch(apiUrl.toString(), {
            method: 'GET',
            headers: {
                'x-api-key': SUPADATA_CONFIG.API_KEY,
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('Error de la API de SUPADATA:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            })
            throw new Error(errorData.message || 'Error al procesar el video')
        }

        const data = await response.json()
        return NextResponse.json(data)

    } catch (error: unknown) {
        console.error('Error en el servidor:', error)
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
            {
                error: 'Error al procesar la solicitud',
                details: message
            },
            { status: 500 }
        )
    }
}
