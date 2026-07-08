import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ endpoint: string }>(event)

  if (!body?.endpoint) {
    throw createError({ statusCode: 400, statusMessage: 'Missing endpoint' })
  }

  try {
    const config = useRuntimeConfig()
    const client = createClient(config.public.supabase.url, config.public.supabase.key)
    await client.from('push_subscriptions').delete().eq('endpoint', body.endpoint)
    return { success: true }
  } catch (error: any) {
    console.error('Failed to remove subscription from Supabase:', error.message)
    throw createError({ statusCode: 500, statusMessage: 'Failed to remove subscription' })
  }
})
