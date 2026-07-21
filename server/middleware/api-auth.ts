export default defineEventHandler(async (event) => {
  // 只攔截 /api 開頭的路由，排除 /api/auth 與 /api/push
  if (event.path.startsWith('/api/') && !event.path.startsWith('/api/auth') && !event.path.startsWith('/api/push/')) {
    const config = useRuntimeConfig()
    
    const token = getCookie(event, 'wishcraft_token')
    
    if (token !== config.passcode) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized. 尚未登入或密碼無效。'
      })
    }
  }
})
