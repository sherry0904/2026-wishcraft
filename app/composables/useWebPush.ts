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

  /**
   * 訂閱推播通知。
   * 回傳 'success' | 'permission_denied' | 'error'
   * 由呼叫方決定要顯示什麼 UI（toast / alert）
   */
  const subscribe = async (): Promise<'success' | 'permission_denied' | 'error'> => {
    try {
      const permission = await Notification.requestPermission()
      permissionGranted.value = permission === 'granted'

      if (permission !== 'granted') {
        return 'permission_denied'
      }

      const registration = await navigator.serviceWorker.ready

      const config = useRuntimeConfig()
      const applicationServerKey = config.public.vapidPublicKey

      const padding = '='.repeat((4 - applicationServerKey.length % 4) % 4)
      const base64 = (applicationServerKey + padding).replace(/\-/g, '+').replace(/_/g, '/')
      const rawData = window.atob(base64)
      const outputArray = new Uint8Array(rawData.length)
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: outputArray
      })

      await $fetch('/api/push/subscribe', {
        method: 'POST',
        body: subscription
      })

      isSubscribed.value = true
      return 'success'
    } catch (e) {
      console.error('Subscription failed', e)
      return 'error'
    }
  }

  /**
   * 取消訂閱推播通知。
   * 回傳 true 表示成功，false 表示失敗。
   */
  const unsubscribe = async (): Promise<boolean> => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        isSubscribed.value = false
        return true
      }
      return false
    } catch (e) {
      console.error('Unsubscribe failed', e)
      return false
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
