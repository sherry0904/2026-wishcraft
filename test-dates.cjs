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
      const dates = {}
      json.logs.forEach(l => {
        const d = l.Date
        dates[d] = (dates[d] || 0) + 1
      })
      console.log('Dates:', dates)
    } catch(e) { console.error(e) }
  })
})
req.end()
