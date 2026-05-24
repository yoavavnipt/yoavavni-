import { NextRequest, NextResponse } from 'next/server'

const VERIFY_TOKEN = 'yoavavni_clinic_2024'

// GET - אימות Webhook מ-Meta
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

// POST - קבלת הודעות נכנסות
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('WhatsApp webhook:', JSON.stringify(body, null, 2))
    return NextResponse.json({ status: 'ok' })
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}
