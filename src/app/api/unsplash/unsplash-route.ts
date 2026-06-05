import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query') || 'physiotherapy'
  const apiKey = process.env.UNSPLASH_ACCESS_KEY || ''

  if (!apiKey) return NextResponse.json({ error: 'No key' }, { status: 400 })

  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=squarish&client_id=${apiKey}`,
      { headers: { 'Accept-Version': 'v1' } }
    )
    const data = await res.json()
    const imageUrl = data.urls?.regular || ''
    if (!imageUrl) return NextResponse.json({ url: '' })

    // מוריד את התמונה ומחזיר אותה דרך ה-server כדי להימנע מ-CORS
    const imgRes = await fetch(imageUrl)
    const imgBuffer = await imgRes.arrayBuffer()
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg'

    return new NextResponse(imgBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
