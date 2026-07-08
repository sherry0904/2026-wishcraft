import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const giftsCsv = `gift_1783350052428,A,B,❤️ 溫馨卡片,寶貝，我愛你，希望你今晚可以一覺好眠❤️,2026/7/6 下午 11:00:53,TRUE,0,
gift_1783350102357,B,A,❤️ 溫馨卡片,希望我們都能一起做好夢~,2026/7/6 下午 11:01:43,TRUE,0,
gift_1783377288299,B,A,❤️ 溫馨卡片,謝謝寶貝做的一切❤️ 我愛妳❤️,2026/7/7 上午 6:34:49,TRUE,0,
gift_1783383162780,A,B,❤️ 溫馨卡片,哇！收到寶貝的小卡，好心動！,2026/7/7 上午 8:12:43,TRUE,0,
gift_1783466105852,B,A,⭐ 讚賞卡片,今天的寶貝是個可愛的睡覺樣子❤️,2026/7/8 上午 7:15:06,TRUE,0,
gift_1783467966847,A,B,⭐ 讚賞卡片,寶貝昨天睡一睡來握住我的手，超可愛的😍 雖然可能只是在提醒我早點睡哈哈哈哈,2026/7/8 上午 7:46:07,FALSE,0,`

const logsCsv = `2026/7/6 下午 11:00:53,2026-07-06,A,redeem_tier_98,0,FALSE
2026/7/6 下午 11:01:43,2026-07-06,B,redeem_tier_98,0,FALSE
2026/7/7 上午 6:34:16,2026-07-07,B,q_stretch_b,15,FALSE
2026/7/7 上午 6:34:49,2026-07-07,B,redeem_tier_98,0,FALSE
2026/7/7 上午 8:12:43,2026-07-07,A,redeem_tier_98,0,FALSE
2026/7/7 下午 12:02:20,2026-07-07,B,q_move_b,20,FALSE
2026/7/7 下午 5:31:35,2026-07-07,A,q_water_a,10,FALSE
2026/7/7 下午 5:44:55,2026-07-07,A,q_stretch_a,15,FALSE
2026/7/7 下午 6:29:00,2026-07-07,B,q_water_b,10,FALSE
2026/7/7 下午 6:47:52,2026-07-07,A,q_move_a,20,FALSE
2026/7/7 下午 9:43:03,2026-07-07,A,q_resist_a,25,FALSE
2026/7/7 下午 10:02:14,2026-07-07,A,q_chore_a,25,FALSE
2026/7/8 上午 7:14:10,2026-07-08,B,q_food_b,15,FALSE
2026/7/8 上午 7:14:15,2026-07-08,B,q_move_b,20,FALSE
2026/7/8 上午 7:15:07,2026-07-08,B,redeem_tier_98,0,FALSE
2026/7/8 上午 7:46:07,2026-07-08,A,redeem_tier_98,0,FALSE
2026/7/8 下午 4:32:11,2026-07-08,A,q_water_a,10,FALSE`

function convertToTaipeiISO(ts) {
  if (!ts || ts.trim() === '') return null
  let cleanTs = ts.trim()
  if (ts.includes(' 上午 ')) {
    cleanTs = ts.replace(' 上午 ', ' ')
  } else if (ts.includes(' 下午 ')) {
    const parts = ts.split(' 下午 ')
    if (parts.length === 2) {
      const timeParts = parts[1].split(':')
      let hours = parseInt(timeParts[0], 10)
      if (hours !== 12) hours += 12
      cleanTs = `${parts[0]} ${hours}:${timeParts[1]}:${timeParts[2]}`
    }
  }
  
  const d = new Date(cleanTs)
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000+08:00`
}

async function main() {
  const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
  
  // 1. Delete the bad data
  await client.from('gifts').delete().eq('id', 'gift_1783350052428')
  await client.from('quest_logs').delete().eq('timestamp', '2026-07-06T23:00:53.000+08:00').eq('player', 'A')

  // 2. Parse correctly
  const giftsLines = giftsCsv.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  const giftsToInsert = giftsLines.map(line => {
    const parts = line.split(',')
    // Since there are NO english commas in the actual message (all are chinese commas except one but wait!)
    // Oh wait, in "寶貝，我愛你，希望你今晚可以一覺好眠❤️,2026/7/6 下午 11:00:53,TRUE,0," the message is parts[4]. But is there an English comma?
    // User data: 寶貝，我愛你，希望你今晚可以一覺好眠❤️
    // User data: 希望我們都能一起做好夢~
    // User data: 謝謝寶貝做的一切❤️ 我愛妳❤️
    // User data: 哇！收到寶貝的小卡，好心動！
    // User data: 今天的寶貝是個可愛的睡覺樣子❤️
    // User data: 寶貝昨天睡一睡來握住我的手，超可愛的😍 雖然可能只是在提醒我早點睡哈哈哈哈
    // None of these messages contain an English comma!
    // So we can safely just take the last 4 parts.
    
    const pUsedTimestamp = parts.pop()
    const pAttachedXp = parts.pop()
    const pUsed = parts.pop()
    const pTimestamp = parts.pop()
    
    // the rest are Id, Sender, Receiver, RewardName, Message
    const pId = parts[0]
    const pSender = parts[1]
    const pReceiver = parts[2]
    const pRewardName = parts[3]
    const pMessage = parts.slice(4).join(',')
    
    return {
      id: pId,
      sender: pSender,
      receiver: pReceiver,
      reward_name: pRewardName,
      message: pMessage,
      timestamp: convertToTaipeiISO(pTimestamp),
      used: pUsed === 'TRUE',
      attached_xp: parseInt(pAttachedXp || '0', 10),
      used_timestamp: pUsedTimestamp ? convertToTaipeiISO(pUsedTimestamp) : null
    }
  })
  
  const { error: giftsError } = await client.from('gifts').insert(giftsToInsert)
  if (giftsError) console.error('Gifts insert error:', giftsError)
  else console.log('Gifts inserted successfully! Count:', giftsToInsert.length)
  
  const logsLines = logsCsv.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  const logsToInsert = logsLines.map(line => {
    const parts = line.split(',')
    return {
      timestamp: convertToTaipeiISO(parts[0]),
      date: parts[1],
      player: parts[2],
      quest_id: parts[3],
      xp: parseInt(parts[4], 10),
      is_skip_pass: parts[5] === 'TRUE'
    }
  })
  
  const { error: logsError } = await client.from('quest_logs').insert(logsToInsert)
  if (logsError) console.error('Quest Logs insert error:', logsError)
  else console.log('Quest Logs inserted successfully! Count:', logsToInsert.length)
}
main()
