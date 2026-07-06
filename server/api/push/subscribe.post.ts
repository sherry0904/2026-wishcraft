import webpush from 'web-push'

export default defineEventHandler(async (event) => {
  try {
    const subscription = await readBody(event)

    const config = useRuntimeConfig()
    
    // 從環境變數或 Nuxt 設定讀取 VAPID 金鑰
    const publicVapidKey = config.public.vapidPublicKey
    const privateVapidKey = config.vapidPrivateKey

    // 這個 email 只是用來讓推播服務商（Apple/Google）在有問題時可以聯絡我們
    webpush.setVapidDetails(
      'mailto:test@example.com',
      publicVapidKey,
      privateVapidKey
    )

    // 構建通知內容
    const payload = JSON.stringify({
      title: '測試成功！🎉',
      body: '您的手機已經完美支援定時推播提醒！未來每晚 21:00 如果還沒完成任務，我們就會這樣提醒您喔！',
      icon: '/icon.jpg', // 您的 App 圖示
      badge: '/icon.jpg',
      data: {
        url: '/'
      }
    })

    // 發送通知 (回聲測試)
    await webpush.sendNotification(subscription, payload)

    return { success: true, message: 'Test notification sent' }
  } catch (error) {
    console.error('Error sending push notification:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send notification'
    })
  }
})
