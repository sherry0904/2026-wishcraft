import { getLocalDb, saveLocalDb } from '../utils/localDb'

export default defineEventHandler(async (event) => {
  const body = await readBody<any>(event)
  const config = useRuntimeConfig()
  const sheetUrl = config.sheetUrl
  
  if (sheetUrl) {
    try {
      // 1. 線上模式：向 Google Sheets 送出使用禮物要求
      const response = await $fetch<any>(sheetUrl, {
        method: 'POST',
        body: {
          action: 'useGift',
          giftId: body.giftId
        }
      })
      return response
    } catch (error: any) {
      console.error('Failed to claim gift on Google Sheets:', error.message)
      return { error: '連線 Google Sheets 失敗，無法使用禮物。', details: error.message }
    }
  }
  
  // 2. 離線模式：直接修改本地 local_db.json
  const db = getLocalDb()
  const giftIndex = db.gifts.findIndex(g => g.Id === body.giftId)
  
  if (giftIndex !== -1) {
    const gift = db.gifts[giftIndex]
    gift.Used = true
    
    // 如果卡片有附帶贈送的點數，寫入一筆正值日誌以充值收禮人錢包！
    if (gift.AttachedXp && gift.AttachedXp > 0) {
      db.logs.push({
        Timestamp: new Date().toISOString(),
        Date: new Date().toISOString().substring(0, 10),
        Player: gift.Receiver,
        QuestId: 'claim_gift_' + gift.Id,
        XP: Math.abs(gift.AttachedXp),
        IsSkipPass: false
      })
    }
    
    saveLocalDb(db)
    return { success: true }
  }
  
  return { error: '找不到該筆禮物卡紀錄。' }
})
