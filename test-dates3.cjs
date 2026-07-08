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
      json.logs.forEach(l => {
        if (l.Date === '2026-07-07' && l.Player === 'A' && !l.QuestId.startsWith('redeem_')) {
          console.log(`Quest: ${l.QuestId}, XP: ${l.XP}`)
        }
      })
    } catch(e) { console.error(e) }
  })
})
req.end()
