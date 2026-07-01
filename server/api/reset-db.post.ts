import { getLocalDb, saveLocalDb } from '../utils/localDb'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const sheetUrl = config.sheetUrl
  
  if (sheetUrl) {
    try {
      // 線上模式：向 Google Sheets 發送清空全部日誌的請求
      const response = await $fetch<any>(sheetUrl, {
        method: 'POST',
        body: {
          action: 'clearAllLogs'
        }
      })
      return response
    } catch (error: any) {
      return { error: '連線 Google Sheets 失敗，無法清空雲端資料。', details: error.message }
    }
  }
  
  // 離線模式：清空本地資料庫的 logs 與 gifts
  const db = getLocalDb()
  db.logs = []
  db.gifts = []
  saveLocalDb(db)
  
  return { success: true }
})
