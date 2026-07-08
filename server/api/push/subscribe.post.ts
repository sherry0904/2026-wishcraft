import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const subscription = await readBody(event)
    const config = useRuntimeConfig()

    const publicVapidKey = config.public.vapidPublicKey
    const privateVapidKey = config.vapidPrivateKey

    webpush.setVapidDetails(
      'mailto:test@example.com',
      publicVapidKey,
      privateVapidKey
    )

    const client = createClient(config.public.supabase.url, config.public.supabase.key)

    // 1. 將訂閱資料儲存到 Supabase (Upsert：如果 endpoint 已存在則更新)
    const { error: saveError } = await client.from('push_subscriptions').upsert({
      endpoint: subscription.endpoint,
      subscription: subscription
    })

    if (saveError) {
      console.warn('Failed to save push subscription to Supabase:', saveError)
    }

    // 2. 發送測試通知（讓使用者確認已成功訂閱）
    const payload = JSON.stringify({
      title: '⚔️ WishCraft 通知已開啟！',
      body: '太好了！從現在起，每晚 9 點我們會提醒你完成今日任務，一起養成好習慣 💪',
      icon: '/icon.jpg',
      badge: '/icon.jpg',
      data: { url: '/' }
    })

    await webpush.sendNotification(subscription, payload)

    return { success: true, message: 'Subscribed and test notification sent' }
  } catch (error) {
    console.error('Error in push subscribe handler:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process push subscription'
    })
  }
})
