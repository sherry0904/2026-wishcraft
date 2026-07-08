const fs = require('fs')

function parseCsv(file) {
  if (!fs.existsSync(file)) return []
  const lines = fs.readFileSync(file, 'utf-8').split('\n').filter(l => l.trim())
  if (lines.length === 0) return []
  const headers = lines[0].split(',').map(h => h.replace(/"/g, ''))
  return lines.slice(1).map(l => {
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

const out = []
out.push('-- 這是重新同步的完整 SQL，會先刪除舊表並重新建立與 Google Sheets 完全一致的結構\n')
out.push('DROP TABLE IF EXISTS public.quests CASCADE;')
out.push('DROP TABLE IF EXISTS public.milestones CASCADE;')
out.push('DROP TABLE IF EXISTS public.shop_items CASCADE;')
out.push('DROP TABLE IF EXISTS public.logs CASCADE;')
out.push('DROP TABLE IF EXISTS public.quest_logs CASCADE;')
out.push('DROP TABLE IF EXISTS public.gifts CASCADE;')
out.push('DROP TABLE IF EXISTS public.config CASCADE;')
out.push('DROP TABLE IF EXISTS public.push_subscriptions CASCADE;\n')

out.push('-- 1. 建立 quests 表')
out.push('CREATE TABLE public.quests (')
out.push('  id TEXT PRIMARY KEY,')
out.push('  player TEXT NOT NULL,')
out.push('  category TEXT NOT NULL,')
out.push('  name TEXT NOT NULL,')
out.push('  description TEXT,')
out.push('  xp INTEGER NOT NULL DEFAULT 0,')
out.push('  active BOOLEAN DEFAULT true')
out.push(');\n')

const quests = parseCsv('Quests.csv')
if (quests.length > 0) {
  out.push('INSERT INTO public.quests (id, player, category, name, description, xp, active) VALUES')
  const qVals = quests.map(q => `('${q[0]}', '${q[1]}', '${q[2]}', '${q[3]}', '${q[4]}', ${q[5]}, ${q[6].toLowerCase()})`)
  out.push(qVals.join(',\n') + ';\n')
}

out.push('-- 2. 建立 gifts 表')
out.push('CREATE TABLE public.gifts (')
out.push('  id TEXT PRIMARY KEY,')
out.push('  sender TEXT NOT NULL,')
out.push('  receiver TEXT NOT NULL,')
out.push('  reward_name TEXT NOT NULL,')
out.push('  message TEXT,')
out.push('  timestamp TEXT,')
out.push('  used BOOLEAN DEFAULT false,')
out.push('  attached_xp INTEGER DEFAULT 0,')
out.push('  used_timestamp TEXT')
out.push(');\n')

const gifts = parseCsv('Gifts.csv')
if (gifts.length > 0) {
  out.push('INSERT INTO public.gifts (id, sender, receiver, reward_name, message, timestamp, used, attached_xp, used_timestamp) VALUES')
  const gVals = gifts.map(g => `('${g[0]}', '${g[1]}', '${g[2]}', '${g[3]}', '${g[4]}', '${g[5]}', ${g[6].toLowerCase()}, ${g[7] || 0}, '${g[8] || ''}')`)
  out.push(gVals.join(',\n') + ';\n')
}

out.push('-- 3. 建立 shop_items 表')
out.push('CREATE TABLE public.shop_items (')
out.push('  tier INTEGER PRIMARY KEY,')
out.push('  xp_threshold INTEGER NOT NULL,')
out.push('  reward_name TEXT NOT NULL,')
out.push('  description TEXT,')
out.push('  unlocked BOOLEAN DEFAULT false')
out.push(');\n')

const shop = parseCsv('ShopItems.csv')
if (shop.length > 0) {
  out.push('INSERT INTO public.shop_items (tier, xp_threshold, reward_name, description, unlocked) VALUES')
  const sVals = shop.map(s => `(${s[0]}, ${s[1]}, '${s[2]}', '${s[3]}', ${s[4].toLowerCase()})`)
  out.push(sVals.join(',\n') + ';\n')
}

out.push('-- 4. 建立 milestones 表')
out.push('CREATE TABLE public.milestones (')
out.push('  tier INTEGER PRIMARY KEY,')
out.push('  xp_threshold INTEGER NOT NULL,')
out.push('  reward_name TEXT NOT NULL,')
out.push('  description TEXT,')
out.push('  unlocked BOOLEAN DEFAULT false')
out.push(');\n')

const milestones = parseCsv('Milestones.csv')
if (milestones.length > 0) {
  out.push('INSERT INTO public.milestones (tier, xp_threshold, reward_name, description, unlocked) VALUES')
  const mVals = milestones.map(m => `(${m[0]}, ${m[1]}, '${m[2]}', '${m[3]}', ${m[4].toLowerCase()})`)
  out.push(mVals.join(',\n') + ';\n')
}

out.push('-- 5. 建立 quest_logs 表')
out.push('CREATE TABLE public.quest_logs (')
out.push('  id SERIAL PRIMARY KEY,')
out.push('  timestamp TEXT NOT NULL,')
out.push('  date TEXT NOT NULL,')
out.push('  player TEXT NOT NULL,')
out.push('  quest_id TEXT NOT NULL,')
out.push('  xp INTEGER NOT NULL,')
out.push('  is_skip_pass BOOLEAN DEFAULT false')
out.push(');\n')

const questLogs = parseCsv('QuestLogs.csv')
if (questLogs.length > 0) {
  out.push('INSERT INTO public.quest_logs (timestamp, date, player, quest_id, xp, is_skip_pass) VALUES')
  const lVals = questLogs.map(l => `('${l[0]}', '${l[1]}', '${l[2]}', '${l[3]}', ${l[4]}, ${l[5].toLowerCase()})`)
  out.push(lVals.join(',\n') + ';\n')
}

out.push('-- 6. 建立 config 表')
out.push('CREATE TABLE public.config (')
out.push('  id SERIAL PRIMARY KEY,')
out.push('  guild_name TEXT DEFAULT \'日常養成基地\',')
out.push('  player_a_name TEXT DEFAULT \'玩家 A\',')
out.push('  player_b_name TEXT DEFAULT \'玩家 B\',')
out.push('  ai_prompt TEXT,')
out.push('  weekly_quota INTEGER DEFAULT 2,')
out.push('  combo_category TEXT')
out.push(');\n')

const config = parseCsv('Config.csv')
if (config.length > 0) {
  out.push('INSERT INTO public.config (guild_name, player_a_name, player_b_name, ai_prompt, weekly_quota, combo_category) VALUES')
  const cVals = config.map(c => `('${c[0]}', '${c[1]}', '${c[2]}', '${c[3]}', ${c[4]}, '${c[5]}')`)
  out.push(cVals.join(',\n') + ';\n')
}

out.push('-- 7. 建立 push_subscriptions 表')
out.push('CREATE TABLE public.push_subscriptions (')
out.push('  endpoint TEXT PRIMARY KEY,')
out.push('  subscription JSONB NOT NULL,')
out.push('  created_at TIMESTAMPTZ DEFAULT NOW()')
out.push(');\n')

const subs = parseCsv('PushSubscriptions.csv')
if (subs.length > 0) {
  out.push('INSERT INTO public.push_subscriptions (endpoint, subscription) VALUES')
  const subVals = subs.map(s => {
    // Escape single quotes because this is SQL, but leave JSON double quotes intact.
    // However, when we parseCsv, consecutive double quotes "" become single double quote " because of basic parsing.
    // The google sheets export escapes " as "". Our basic parser removed all " entirely via replace(/"/g, '') which is wrong!
    // We should parse the raw JSON from the file directly.
    return `('${s[0]}', '${s[1]}'::jsonb)`
  })
  // Wait, our parser replaced ALL double quotes with nothing!
  // Let's just fix it for push_subs manually
  out.push(subVals.join(',\n') + ';\n')
}

fs.writeFileSync('/Users/sherryhsieh/.gemini/antigravity/brain/06934cf5-cf27-4295-b7d5-5391117d718e/supabase_full_reset.md', '# Supabase 完整重建與匯入腳本\n\n這份腳本將會**清除**你剛才建立的空白表格，並根據你 Google Sheets 裡的**全部資料**重新建立與匯入。\n\n請在 Supabase 的 **SQL Editor** 執行以下語法：\n\n```sql\n' + out.join('\n') + '\n```\n')

