const fs = require('fs')

function parseCsv(file) {
  const lines = fs.readFileSync(file, 'utf-8').split('\n').filter(l => l.trim())
  const headers = lines[0].split(',').map(h => h.replace(/"/g, ''))
  return lines.slice(1).map(l => {
    // Basic CSV parser to handle quotes
    const cols = []
    let inQuote = false
    let current = ''
    for (let i = 0; i < l.length; i++) {
      if (l[i] === '"') {
        inQuote = !inQuote
      } else if (l[i] === ',' && !inQuote) {
        cols.push(current)
        current = ''
      } else {
        current += l[i]
      }
    }
    cols.push(current)
    return cols
  })
}

const quests = parseCsv('quests.csv')
console.log('-- 寫入預設任務')
console.log('INSERT INTO public.quests (id, player, category, name, description, xp, icon, active) VALUES')
const questVals = quests.map(q => `('${q[0]}', '${q[1]}', '${q[2]}', '${q[3]}', '${q[4]}', ${q[5]}, '💡', ${q[6].toLowerCase()})`)
console.log(questVals.join(',\n') + ';')
console.log()

const milestones = parseCsv('milestones.csv')
console.log('-- 寫入預設里程碑')
console.log('INSERT INTO public.milestones (tier, xp_threshold, reward_name, description, unlocked) VALUES')
const msVals = milestones.map(m => `(${m[0]}, ${m[1]}, '${m[2]}', '${m[3]}', ${m[4].toLowerCase()})`)
console.log(msVals.join(',\n') + ';')
console.log()

const shop = parseCsv('shop.csv')
console.log('-- 寫入預設商店道具')
console.log('INSERT INTO public.shop_items (tier, xp_threshold, reward_name, description, unlocked) VALUES')
const shopVals = shop.map(s => `(${s[0]}, ${s[1]}, '${s[2]}', '${s[3]}', ${s[4].toLowerCase()})`)
console.log(shopVals.join(',\n') + ';')
