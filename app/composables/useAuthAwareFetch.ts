/**
 * 建立帶 401 自動重導向的 fetch 實例。
 * 當任何 API 呼叫收到 401（Session 失效、SESSION_PASSWORD 更動等），
 * 自動清除前端 auth 狀態並跳回登入頁，桌面與 PWA 手機皆適用。
 */
export function useAuthAwareFetch() {
  const authStateCookie = useCookie('wishcraft_auth_state')

  return $fetch.create({
    onResponseError({ response }) {
      if (response.status === 401) {
        authStateCookie.value = null
        navigateTo('/auth')
      }
    }
  })
}
