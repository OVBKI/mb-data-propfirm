export async function POST(request) {
  try {
    const body = await request.json()
    const { userName, password, clientId } = body

    const response = await fetch('https://gateway.projectx.com/api/v1/Auth/loginKey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName, password,
        deviceId: 'MB-Data',
        appId: 'MBData',
        appVersion: '1.0',
        clientId
      })
    })

    const data = await response.json()
    if (!response.ok || !data.token) {
      return Response.json({ error: data.message || 'Identifiants incorrects' }, { status: 401 })
    }

    // Fetch accounts
    const acctRes = await fetch('https://gateway.projectx.com/api/v1/Account/search', {
      headers: { 'Authorization': 'Bearer ' + data.token }
    })
    const acctData = await acctRes.json()
    const accounts = acctData.accounts || acctData || []

    // Fetch trades & positions for first account
    let trades = [], positions = []
    if (accounts[0]?.id) {
      const [posRes, trdRes] = await Promise.all([
        fetch(`https://gateway.projectx.com/api/v1/Position/searchOpen?accountId=${accounts[0].id}`, {
          headers: { 'Authorization': 'Bearer ' + data.token }
        }),
        fetch(`https://gateway.projectx.com/api/v1/Order/search?accountId=${accounts[0].id}`, {
          headers: { 'Authorization': 'Bearer ' + data.token }
        })
      ])
      const posData = await posRes.json()
      const trdData = await trdRes.json()
      positions = posData.positions || posData || []
      trades = trdData.orders || trdData || []
    }

    return Response.json({ token: data.token, accounts, trades, positions })
  } catch (err) {
    return Response.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
