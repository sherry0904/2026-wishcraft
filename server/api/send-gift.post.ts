import { createClient } from '@supabase/supabase-js'

interface SendGiftBody {
  sender: 'A' | 'B';
  receiver: 'A' | 'B';
  buyer: 'A' | 'B';
  rewardName: string;
  message?: string;
  xp: number;
  tier: number;
  attachedXp: number;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<SendGiftBody>(event)

  if (!body.sender || !body.receiver || !body.buyer || !body.rewardName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required parameters: sender, receiver, buyer, rewardName'
    })
  }

  try {
    const config = useRuntimeConfig()
    const client = createClient(config.public.supabase.url, config.public.supabase.key)
    const timestampStr = new Date().toISOString()
    const giftId = 'gift_' + Date.now()

    // 1. 新增禮物紀錄
    const { error: giftError } = await client.from('gifts').insert({
      id: giftId,
      sender: body.sender,
      receiver: body.receiver,
      reward_name: body.rewardName,
      message: body.message || '',
      timestamp: timestampStr,
      used: false,
      attached_xp: body.attachedXp || 0,
      used_timestamp: ''
    })

    if (giftError) throw giftError

    // 2. 如果有扣點 (XP > 0)，寫入 quest_logs 進行扣點
    if (body.xp > 0) {
      // 取得台灣時區的今天日期 (YYYY-MM-DD)
      const formatter = new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Taipei'
      })
      const parts = formatter.formatToParts(new Date())
      const year = parts.find(p => p.type === 'year')?.value
      const month = parts.find(p => p.type === 'month')?.value
      const day = parts.find(p => p.type === 'day')?.value
      const todayStr = `${year}-${month}-${day}`

      const { error: logError } = await client.from('quest_logs').insert({
        timestamp: timestampStr,
        date: todayStr,
        player: body.buyer,
        quest_id: 'redeem_tier_' + body.tier,
        xp: -body.xp, // 負數扣點
        is_skip_pass: false
      })

      if (logError) throw logError
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send gift to Supabase:', error.message)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to send gift: ${error.message}`
    })
  }
})
