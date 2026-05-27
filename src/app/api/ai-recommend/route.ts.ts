import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()
    
    const apiKey = process.env.ANTHROPIC_API_KEY || ''
    if (!apiKey) {
      return NextResponse.json({ text: 'שגיאה: ANTHROPIC_API_KEY לא מוגדר' }, { status: 400 })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    
    if (!response.ok || data.error) {
      return NextResponse.json({ 
        text: `שגיאה ${response.status}: ${data.error?.message || JSON.stringify(data)}` 
      }, { status: 400 })
    }

    const text = data.content?.[0]?.text || 'לא התקבלה תשובה'
    return NextResponse.json({ text })
  } catch (err: any) {
    return NextResponse.json({ text: `שגיאה: ${err.message}` }, { status: 500 })
  }
}
