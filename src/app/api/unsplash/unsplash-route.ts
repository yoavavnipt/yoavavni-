import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query') || 'physiotherapy'
  const apiKey = process.env.UNSPLASH_ACCESS_KEY || ''
  
  if (!apiKey) {
    return NextResponse.json({ error: 'No Unsplash key' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=squarish&client_id=${apiKey}`,
      { headers: { 'Accept-Version': 'v1' } }
    )
    const data = await res.json()
    return NextResponse.json({ url: data.urls?.regular || '' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
