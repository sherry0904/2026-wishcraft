import { createClient } from '@supabase/supabase-js'

interface UseSkipBody {
  player: 'A' | 'B';
  date: string; // YYYY-MM-DD
}

export default defineEventHandler(async (event) => {
  const body = await readBody<UseSkipBody>(event)

  if (!body.player || !body.date) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required parameters: player, date'
    })
  }

  try {
    const config = useRuntimeConfig()
    const client = createClient(config.public.supabase.url, config.public.supabase.key)
    const timestampStr = getTaipeiISOString()

    const { error } = await client.from('quest_logs').insert({
      timestamp: timestampStr,
      date: body.date,
      player: body.player,
      quest_id: 'skip',
      xp: 0,
      is_skip_pass: true
    })

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Failed to post useSkip to Supabase:', error.message)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to use skip ticket on Supabase: ${error.message}`
    })
  }
})
