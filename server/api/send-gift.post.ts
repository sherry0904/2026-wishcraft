import { getLocalDb, saveLocalDb } from '../utils/localDb'

export default defineEventHandler(async (event) => {
  const body = await readBody<any>(event)
  const config = useRuntimeConfig()
  const sheetUrl = config.sheetUrl
  
  if (sheetUrl) {
    try {
      // 1. 線上模式：將送禮資料同步至 Google Sheets
      const response = await $fetch<any>(sheetUrl, {
        method: 'POST',
        body: {
          action: 'sendGift',
          sender: body.sender,
          receiver: body.receiver,
          buyer: body.buyer || body.sender,
          rewardName: body.rewardName,
          message: body.message,
          xp: body.xp,
          tier: body.tier,
          attachedXp: body.attachedXp || 0
        }
      })
      return response
    } catch (error: any) {
      console.error('Failed to send gift to Google Sheets:', error.message)
      // 若 Sheets 失敗，則直接降級回傳錯誤，避免點數同步不一致
      return { error: '連線 Google Sheets 失敗，無法送出禮物。', details: error.message }
    }
  }
  
  // 2. 離線模式：寫入本地暫存 local_db.json
  const db = getLocalDb()
  const giftId = 'gift_' + new Date().getTime()
  const timestamp = new Date().toISOString()
  
  const newGift = {
    Id: giftId,
    Sender: body.sender,
    Receiver: body.receiver,
    RewardName: body.rewardName,
    Message: body.message,
    Timestamp: timestamp,
    Used: false,
    AttachedXp: Number(body.attachedXp) || 0
  }
  
  // 寫入負分日誌以扣減錢包餘額
  const newLog = {
    Timestamp: timestamp,
    Date: new Date().toISOString().substring(0, 10),
    Player: (body.buyer || body.sender) as 'A' | 'B',
    QuestId: 'redeem_tier_' + body.tier,
    XP: -Math.abs(body.xp),
    IsSkipPass: false
  }
  
  db.gifts.push(newGift)
  db.logs.push(newLog)
  saveLocalDb(db)
  
  return { success: true, giftId }
})
