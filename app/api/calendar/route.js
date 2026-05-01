export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const week = searchParams.get('week') || 'this' // this | next

    const url = week === 'next'
      ? 'https://nfs.faireconomy.media/ff_calendar_nextweek.xml'
      : 'https://nfs.faireconomy.media/ff_calendar_thisweek.xml'

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 } // cache 5 min
    })

    if (!res.ok) throw new Error('ForexFactory unreachable')
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

    return Response.json({ events, week, fetched: new Date().toISOString() })
  } catch (err) {
    return Response.json({ error: err.message, events: [] }, { status: 500 })
  }
}
