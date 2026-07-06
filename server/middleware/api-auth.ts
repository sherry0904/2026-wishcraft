export default defineEventHandler(async (event) => {
  // 只攔截 /api 開頭的路由，排除 /api/auth
  if (event.path.startsWith('/api/') && !event.path.startsWith('/api/auth')) {
    const config = useRuntimeConfig()
    
    // 檢查 HttpOnly Session
    const session = await useSession(event, { password: config.sessionPassword })
    
    if (!session.data.verified) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized. 尚未登入或 Session 已過期。'
      })
    }
  }
})
