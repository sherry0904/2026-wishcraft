import { createClient } from '@supabase/supabase-js'

interface SyncQuestBody {
  date: string;
  player: 'A' | 'B';
  questId: string;
  xp: number;
  completed?: boolean;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<SyncQuestBody>(event)

  if (!body.date || !body.player || !body.questId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required parameters: date, player, questId'
    })
  }

  try {
    const config = useRuntimeConfig()
    const client = createClient(config.public.supabase.url, config.public.supabase.key)

    if (body.completed === false) {
      // 刪除打卡紀錄
      const { error } = await client.from('quest_logs')
        .delete()
        .eq('date', body.date)
        .eq('player', body.player)
        .eq('quest_id', body.questId)
        .eq('is_skip_pass', false)

      if (error) throw error
    } else {
      // 新增打卡紀錄
      const timestampStr = new Date().toISOString()

      const { error } = await client.from('quest_logs').insert({
        timestamp: timestampStr,
        date: body.date,
        player: body.player,
        quest_id: body.questId,
        xp: body.xp,
        is_skip_pass: false
      })

      if (error) throw error
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to sync quest to Supabase:', error.message)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to sync quest to Supabase: ${error.message}`
    })
  }
})
