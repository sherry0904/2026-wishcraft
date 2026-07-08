export function getTaipeiISOString() {
  const d = new Date()
  const tzOffset = 8 * 60 * 60 * 1000 // 台北時間 UTC+8
  const localTime = new Date(d.getTime() + tzOffset)
  // 將結尾的 Z 替換為 +08:00，確保這是一個合法的 ISO 字串，並且帶有正確的時區偏移
  return localTime.toISOString().replace('Z', '+08:00')
}
