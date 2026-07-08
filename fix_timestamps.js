const fs = require('fs');

function fixTimestamp(ts) {
  if (!ts) return ts;
  if (ts.includes(' 上午 ')) {
    return ts.replace(' 上午 ', ' ');
  }
  if (ts.includes(' 下午 ')) {
    const parts = ts.split(' 下午 ');
    const datePart = parts[0];
    const timePart = parts[1];
    const timeParts = timePart.split(':');
    let h = parseInt(timeParts[0]);
    if (h < 12) h += 12;
    timeParts[0] = h.toString().padStart(2, '0');
    return datePart + ' ' + timeParts.join(':');
  }
  return ts;
}

// read the csvs
const questLogs = fs.readFileSync('QuestLogs.csv', 'utf8').split('\n');
console.log('Sample fixed:', fixTimestamp('2026/7/6 下午 11:00:53'));
console.log('Sample fixed 2:', fixTimestamp('2026/7/7 上午 8:12:43'));
