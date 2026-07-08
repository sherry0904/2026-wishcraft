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
    const timestampStr = new Date().toISOString()

    const { error } = await client.from('gifts')
      .update({ 
        used: true,
        used_timestamp: timestampStr
      })
      .eq('id', body.giftId)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Failed to update gift to Supabase:', error.message)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to use gift: ${error.message}`
    })
  }
})
