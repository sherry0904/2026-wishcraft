import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/push/send-daily
 * 由 Vercel Cron Job 每晚 21:00（台灣時間）觸發，提醒使用者記得填寫今日任務。
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // 安全檢查：只接受 Vercel Cron 帶的 Authorization header
  const authHeader = getHeader(event, 'authorization')
  const cronSecret = config.cronSecret
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  webpush.setVapidDetails(
    'mailto:test@example.com',
    config.public.vapidPublicKey,
    config.vapidPrivateKey
  )

  const client = createClient(config.public.supabase.url, config.public.supabase.key)

  // 1. 從 Supabase 撈出所有訂閱
  let subscriptions: any[] = []
  try {
    const { data } = await client.from('push_subscriptions').select('endpoint, subscription')
    subscriptions = data || []
  } catch (err) {
    console.error('Failed to fetch subscriptions from Supabase:', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch subscriptions' })
  }

  if (subscriptions.length === 0) {
    return { success: true, sent: 0, message: 'No subscriptions found' }
  }

  // 2. 固定文案：每晚提醒填寫任務
  const payload = JSON.stringify({
    title: '📋 記得填寫今日任務！',
    body: '今天的養成任務打卡了嗎？每天一點點，習慣就是這樣養成的 💪',
    icon: '/icon.jpg',
    badge: '/icon.jpg',
    data: { url: '/' }
  })

  // 3. 逐一發送，收集失效訂閱
  let sent = 0
  const expiredEndpoints: string[] = []

  for (const sub of subscriptions) {
    try {
      const subscriptionObj = typeof sub.subscription === 'string'
        ? JSON.parse(sub.subscription)
        : sub.subscription
      await webpush.sendNotification(subscriptionObj, payload)
      sent++
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        expiredEndpoints.push(sub.endpoint)
      } else {
        console.warn('Failed to send push:', err.message)
      }
    }
  }

  // 4. 清除已失效的訂閱
  if (expiredEndpoints.length > 0) {
    try {
      await client.from('push_subscriptions').delete().in('endpoint', expiredEndpoints)
    } catch (cleanErr) {
      console.warn('Failed to clean expired subscriptions:', cleanErr)
    }
  }

  console.log(`[Daily Push] Sent ${sent}/${subscriptions.length}, cleaned ${expiredEndpoints.length} expired`)
  return { success: true, sent, total: subscriptions.length, expired: expiredEndpoints.length }
})
