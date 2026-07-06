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
      
      // 這是測試用的 VAPID Public Key，正式環境需要從後端/環境變數獲取
      // 使用 web-push 套件生成: npx web-push generate-vapid-keys
      const applicationServerKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuB-5g8XJp_c8qZ4-E6L05V6k8' 
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      })
      
      // 這裡應該將 subscription 發送到後端儲存
      console.log('Push subscription successful:', subscription)
      
      // 模擬發送到後端
      await $fetch('/api/push/subscribe', {
        method: 'POST',
        body: subscription
      })

      isSubscribed.value = true
      alert('已成功開啟通知！每天 21:00 您將收到提醒。')
    } catch (e) {
      console.error('Subscription failed', e)
      alert('開啟通知失敗，請確認您的瀏覽器是否支援或已封鎖通知。')
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
