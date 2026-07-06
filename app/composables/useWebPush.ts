import { ref, onMounted } from 'vue'

export const useWebPush = () => {
  const isSupported = ref(false)
  const isSubscribed = ref(false)
  const permissionGranted = ref(false)

  onMounted(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      isSupported.value = true
      checkSubscription()
    }
  })

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      isSubscribed.value = !!subscription
      permissionGranted.value = Notification.permission === 'granted'
    } catch (e) {
      console.error('Error checking subscription', e)
    }
  }

  const subscribe = async () => {
    try {
      const permission = await Notification.requestPermission()
      permissionGranted.value = permission === 'granted'
      
      if (permission !== 'granted') {
        alert('您必須允許通知權限才能接收定時提醒！')
        return
      }

      const registration = await navigator.serviceWorker.ready
      
      // 從 Nuxt config 中讀取 Public Key
      const config = useRuntimeConfig()
      const applicationServerKey = config.public.vapidPublicKey
      
      const padding = '='.repeat((4 - applicationServerKey.length % 4) % 4);
      const base64 = (applicationServerKey + padding).replace(/\-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: outputArray
      })
      
      console.log('Push subscription successful:', subscription)
      
      // 發送到後端，後端會立刻進行回聲測試推播
      await $fetch('/api/push/subscribe', {
        method: 'POST',
        body: subscription
      })

      isSubscribed.value = true
      alert('已成功開啟通知！請檢查手機是否收到測試通知 🎉')
    } catch (e) {
      console.error('Subscription failed', e)
      alert('開啟通知失敗，請確認您的瀏覽器是否支援或已封鎖通知。\\n詳細錯誤：' + (e as Error).message)
    }
  }

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        isSubscribed.value = false
        // 同步通知後端刪除該訂閱
        // await $fetch('/api/push/unsubscribe', { method: 'POST', body: { endpoint: subscription.endpoint } })
        alert('已關閉通知！')
      }
    } catch (e) {
      console.error('Unsubscribe failed', e)
    }
  }

  return {
    isSupported,
    isSubscribed,
    permissionGranted,
    subscribe,
    unsubscribe
  }
}
