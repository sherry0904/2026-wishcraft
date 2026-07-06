export default defineNuxtRouteMiddleware((to, from) => {
  // 客戶端檢查這個非 HttpOnly 的 flag
  const authStateCookie = useCookie('wishcraft_auth_state')
  const isVerified = authStateCookie.value === 'true'

  if (to.path !== '/auth' && !isVerified) {
    return navigateTo('/auth')
  }

  if (to.path === '/auth' && isVerified) {
    return navigateTo('/')
  }
})
