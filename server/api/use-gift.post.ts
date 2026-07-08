import { createClient } from '@supabase/supabase-js'

interface UseGiftBody {
  giftId: string;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<UseGiftBody>(event)

  if (!body.giftId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing giftId'
    })
  }

  try {
    const config = useRuntimeConfig()
    const client = createClient(config.public.supabase.url, config.public.supabase.key)
    const timestampStr = getTaipeiISOString()

    // 1. 取得該禮物的資料，判斷是否有附贈點數
    const { data: giftData, error: fetchError } = await client.from('gifts')
      .select('receiver, attached_xp, reward_name')
      .eq('id', body.giftId)
      .single()
      
    if (fetchError) throw fetchError

    // 2. 更新禮物狀態為已使用
    const { error } = await client.from('gifts')
      .update({ 
        used: true,
        used_timestamp: timestampStr
      })
      .eq('id', body.giftId)

    if (error) throw error

    // 3. 如果該禮物有附贈點數，則為接收者增加點數
    if (giftData && giftData.attached_xp > 0) {
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
        player: giftData.receiver,
        quest_id: 'receive_gift',
        xp: giftData.attached_xp,
        is_skip_pass: false
      })

      if (logError) throw logError
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to update gift to Supabase:', error.message)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to use gift: ${error.message}`
    })
  }
})
