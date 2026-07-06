import webpush from 'web-push'

export default defineEventHandler(async (event) => {
  try {
    const subscription = await readBody(event)
    const config = useRuntimeConfig()
    const sheetUrl = config.sheetUrl

    const publicVapidKey = config.public.vapidPublicKey
    const privateVapidKey = config.vapidPrivateKey

    webpush.setVapidDetails(
      'mailto:test@example.com',
      publicVapidKey,
      privateVapidKey
    )

    // 1. 將訂閱資料儲存到 Google Sheets（PushSubscriptions tab）
    if (sheetUrl) {
      try {
        await $fetch<any>(sheetUrl, {
          method: 'POST',
          body: {
            action: 'savePushSubscription',
            secretToken: config.gasSecretToken,
            endpoint: subscription.endpoint,
            subscription: JSON.stringify(subscription)
          }
        })
      } catch (saveError) {
        // 儲存失敗不影響測試通知，僅記錄警告
        console.warn('Failed to save push subscription to Sheets:', saveError)
      }
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
