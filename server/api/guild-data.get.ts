import { getLocalDb } from '../utils/localDb'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const sheetUrl = config.sheetUrl

  if (!sheetUrl) {
    // 沒設定 Google Sheets URL，回傳本地模擬資料
    const db = getLocalDb()
    return {
      quests: db.quests,
      milestones: db.milestones,
      shopItems: db.shopItems,
      logs: db.logs,
      config: db.config,
      offline: true
    }
  }

  try {
    // 呼叫 Google Apps Script API
    const response = await $fetch<any>(`${sheetUrl}?action=getData`, {
      method: 'GET',
      timeout: 10000 // 10秒逾時
    })
    
    const db = getLocalDb()
    
    return {
      quests: response.quests || [],
      milestones: response.milestones || [],
      shopItems: response.shopItems || db.shopItems, // 若 GAS 尚未回傳，則降級套用預設商店清單
      logs: response.logs || [],
      config: response.config || {},
      offline: false
    }
  } catch (error: any) {
    console.error('Failed to fetch data from Google Sheets:', error.message)
    
    // API 呼叫失敗時，降級使用本地模擬資料庫
    const db = getLocalDb()
    return {
      quests: db.quests,
      milestones: db.milestones,
      shopItems: db.shopItems,
      logs: db.logs,
      config: db.config,
      offline: true,
      error: 'Google Sheets 連線失敗，已自動切換至離線模式。'
    }
  }
})
