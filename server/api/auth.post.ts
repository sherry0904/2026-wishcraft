// 簡易的記憶體 Rate Limiting (防暴力破解)
const rateLimitMap = new Map<string, { count: number, blockedUntil: number }>()

export default defineEventHandler(async (event) => {
  // 取得請求 IP (在 Vercel 中通常透過 x-forwarded-for 取得)
  const ip = getRequestHeader(event, 'x-forwarded-for') || event.node.req.socket.remoteAddress || 'unknown'
  
  const now = Date.now()
  const record = rateLimitMap.get(ip) || { count: 0, blockedUntil: 0 }
  
  // 檢查是否被封鎖
  if (record.blockedUntil > now) {
    const waitMinutes = Math.ceil((record.blockedUntil - now) / 60000)
    return { success: false, message: `嘗試次數過多，請等待 ${waitMinutes} 分鐘後再試` }
  }
  
  const body = await readBody(event)
  const config = useRuntimeConfig()
  
  if (body.passcode === config.passcode) {
    // 密碼正確，清除錯誤紀錄
    rateLimitMap.delete(ip)
    
    // 建立 HttpOnly 加密 Session (使用設定的 sessionPassword)
    const session = await useSession(event, {
      password: config.sessionPassword,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      }
    })
    
    await session.update({ verified: true })
    
    // 同時讓前端知道驗證成功 (非 HttpOnly，僅供 UI 顯示使用)
    setCookie(event, 'wishcraft_auth_state', 'true', {
      maxAge: 60 * 60 * 24 * 365,
      path: '/'
    })
    
    return { success: true }
  }
  
  // 密碼錯誤，增加錯誤次數
  record.count += 1
  if (record.count >= 5) {
    // 封鎖 15 分鐘
    record.blockedUntil = now + 15 * 60 * 1000
    record.count = 0
  }
  rateLimitMap.set(ip, record)
  
  return { success: false, message: '密碼錯誤' }
})
