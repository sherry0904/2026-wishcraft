const http = require('http')
const options = {
  hostname: 'localhost',
  port: 3003,
  path: '/api/guild-data',
  method: 'GET',
  headers: {
    'Cookie': 'wishcraft_token=2026'
  }
}
const req = http.request(options, res => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    try {
      const json = JSON.parse(data)
      let sum = 0
      json.logs.forEach(l => {
        if (l.Date === '2026-07-07' && l.Player === 'A' && !l.QuestId.startsWith('redeem_')) {
          sum += Number(l.XP) || 0
        }
      })
      console.log('Player A sum for 07-07:', sum)
    } catch(e) { console.error(e) }
  })
})
req.end()
