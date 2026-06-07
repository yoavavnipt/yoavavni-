import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query') || 'physiotherapy'
  const apiKey = process.env.PEXELS_API_KEY || ''

  if (!apiKey) return NextResponse.json({ error: 'No key' }, { status: 400 })

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=square`,
      { headers: { 'Authorization': apiKey } }
    )
    const data = await res.json()
    const photos = data.photos || []
    if (photos.length === 0) return NextResponse.json({ error: 'No photos' }, { status: 404 })

    // בחר תמונה אקראית מהתוצאות
    const photo = photos[Math.floor(Math.random() * photos.length)]
    const imageUrl = photo.src?.large || photo.src?.medium || ''

    // proxy את התמונה דרך ה-server
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
