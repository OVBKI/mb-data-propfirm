export async function POST(request) {
  try {
    const body = await request.json()
    const { userName, apiKey, clientId } = body

    // Map firm to correct API URL
    const API_URLS = {
      'topstepx':  'https://api.topstepx.com/api',
      'tradeify':  'https://api.tradeify.com/api',
      'tpt':       'https://api.takeprofittrader.com/api',
      'mff':       'https://api.myfuturesfunding.com/api',
      'tradeday':  'https://api.tradeday.co/api',
      'uprofit':   'https://api.uprofit.com/api',
    }

    const baseUrl = API_URLS[clientId] || `https://api.${clientId}.com/api`

    // Auth with API key (official ProjectX method)
    const authRes = await fetch(`${baseUrl}/Auth/loginKey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'accept': 'text/plain' },
      body: JSON.stringify({ userName, apiKey })
    })

    const authData = await authRes.json()
    if (!authData.success || !authData.token) {
      return Response.json({ error: authData.errorMessage || 'Identifiants incorrects — vérifiez votre clé API' }, { status: 401 })
    }

    const token = authData.token
    const headers = { 'Authorization': `Bearer ${token}`, 'accept': 'text/plain' }

    // Fetch accounts
    const acctRes = await fetch(`${baseUrl}/Account/search`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ onlyActiveAccounts: true })
    })
    const acctData = await acctRes.json()
    const accounts = acctData.accounts || []

    // Fetch trades & positions for first account
    let trades = [], positions = []
    if (accounts[0]?.id) {
      const acctId = accounts[0].id
      const now = new Date()
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)

      const [posRes, trdRes] = await Promise.all([
        fetch(`${baseUrl}/Position/searchOpen`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId: acctId })
        }),
        fetch(`${baseUrl}/Trade/search`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: acctId,
            startTimestamp: thirtyDaysAgo.toISOString(),
            endTimestamp: now.toISOString()
          })
        })
      ])

      const posData = await posRes.json()
      const trdData = await trdRes.json()
      positions = posData.positions || []
      trades = trdData.trades || []
    }

    return Response.json({ token, accounts, trades, positions })
  } catch (err) {
    return Response.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
