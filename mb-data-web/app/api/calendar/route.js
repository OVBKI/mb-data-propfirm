// Force le rendu dynamique (pas de cache statique au build)
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const week = searchParams.get('week') || 'this' // this | next

    const url = week === 'next'
      ? 'https://nfs.faireconomy.media/ff_calendar_nextweek.xml'
      : 'https://nfs.faireconomy.media/ff_calendar_thisweek.xml'

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MBDataBot/1.0)' },
      cache: 'no-store',
    })

    if (!res.ok) {
      return Response.json({
        error: `ForexFactory unreachable (HTTP ${res.status})`,
        events: [],
        week,
      }, { status: 502 })
    }

    const xml = await res.text()

    // Parse XML to JSON
    const events = []
    const eventMatches = xml.matchAll(/<event>([\s\S]*?)<\/event>/g)

    for (const match of eventMatches) {
      const block = match[1]
      const get = (tag) => {
        const m = block.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}>([\\s\\S]*?)<\\/${tag}>`))
        return m ? (m[1] || m[2] || '').trim() : ''
      }
      events.push({
        id:        get('id'),
        title:     get('title'),
        country:   get('country'),
        date:      get('date'),
        time:      get('time'),
        impact:    get('impact'),
        forecast:  get('forecast'),
        previous:  get('previous'),
        actual:    get('actual'),
        currency:  get('currency'),
      })
    }

    // Headers anti-cache : on veut toujours les données fraîches
    return new Response(JSON.stringify({
      events,
      week,
      count: events.length,
      fetched: new Date().toISOString(),
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    })
  } catch (err) {
    return Response.json({ error: err.message, events: [] }, { status: 500 })
  }
}
