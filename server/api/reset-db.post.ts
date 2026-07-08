import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const client = createClient(config.public.supabase.url, config.public.supabase.key)

    // 清空 quest_logs
    const { error: logsError } = await client.from('quest_logs').delete().neq('id', 0)
    if (logsError) throw logsError

    // 清空 gifts
    const { error: giftsError } = await client.from('gifts').delete().neq('id', '0')
    if (giftsError) throw giftsError

    return { success: true }
  } catch (error: any) {
    console.error('Failed to reset Supabase logs:', error.message)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to reset Supabase logs: ${error.message}`
    })
  }
})
