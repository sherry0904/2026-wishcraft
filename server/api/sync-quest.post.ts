import { getLocalDb, saveLocalDb } from '../utils/localDb'

interface SyncQuestBody {
  player: 'A' | 'B';
  questId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  xp: number;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const sheetUrl = config.sheetUrl
  const body = await readBody<SyncQuestBody>(event)

  if (!body.player || !body.questId || !body.date) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required parameters: player, questId, date'
    })
  }

  if (!sheetUrl) {
    // 沒設定 Google Sheets，寫入本地模擬資料庫
    const db = getLocalDb()
    
    // 尋找是否已有相同紀錄
    const existingIndex = db.logs.findIndex(log => 
      log.Date === body.date && 
      log.Player === body.player && 
      log.QuestId === body.questId && 
      !log.IsSkipPass
    )

    if (body.completed) {
      if (existingIndex === -1) {
        db.logs.push({
          Timestamp: new Date().toISOString(),
          Date: body.date,
          Player: body.player,
          QuestId: body.questId,
          XP: body.xp,
          IsSkipPass: false
        })
      }
    } else {
      if (existingIndex !== -1) {
        db.logs.splice(existingIndex, 1)
      }
    }

    saveLocalDb(db)
    return { success: true, offline: true }
  }

  try {
    // 轉發給 Google Apps Script
    const response = await $fetch<any>(sheetUrl, {
      method: 'POST',
      body: {
        action: 'toggleQuest',
        player: body.player,
        questId: body.questId,
        date: body.date,
        xp: body.xp,
        completed: body.completed
      }
    })

    return { success: true, response }
  } catch (error: any) {
    console.error('Failed to sync quest to Google Sheets:', error.message)
    
    // 轉發失敗時降級寫入本地資料庫，確保使用者不卡住
    const db = getLocalDb()
    const existingIndex = db.logs.findIndex(log => 
      log.Date === body.date && 
      log.Player === body.player && 
      log.QuestId === body.questId && 
      !log.IsSkipPass
    )

    if (body.completed) {
      if (existingIndex === -1) {
        db.logs.push({
          Timestamp: new Date().toISOString(),
          Date: body.date,
          Player: body.player,
          QuestId: body.questId,
          XP: body.xp,
          IsSkipPass: false
        })
      }
    } else {
      if (existingIndex !== -1) {
        db.logs.splice(existingIndex, 1)
      }
    }

    saveLocalDb(db)
    
    return { 
      success: true, 
      offline: true, 
      warning: '無法同步至 Google Sheets，已先暫存於本地儲存。' 
    }
  }
})
