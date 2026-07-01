import { getLocalDb, saveLocalDb } from '../utils/localDb'

interface SaveConfigBody {
  guildName: string;
  playerAName: string;
  playerBName: string;
  aiPrompt: string;
  weeklyQuota: number;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const sheetUrl = config.sheetUrl
  const body = await readBody<SaveConfigBody>(event)

  if (!body.guildName || !body.playerAName || !body.playerBName || !body.aiPrompt || body.weeklyQuota === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required parameters'
    })
  }

  if (!sheetUrl) {
    // 離線模式：寫入本地 local_db.json
    const db = getLocalDb()
    db.config.GuildName = body.guildName
    db.config.PlayerAName = body.playerAName
    db.config.PlayerBName = body.playerBName
    db.config.AIPrompt = body.aiPrompt
    db.config.WeeklyQuota = body.weeklyQuota
    
    saveLocalDb(db)
    return { success: true, offline: true }
  }

  try {
    // 連線模式：轉發給 Google Sheets Apps Script
    const response = await $fetch<any>(sheetUrl, {
      method: 'POST',
      body: {
        action: 'saveConfig',
        guildName: body.guildName,
        playerAName: body.playerAName,
        playerBName: body.playerBName,
        aiPrompt: body.aiPrompt,
        weeklyQuota: body.weeklyQuota
      }
    })

    return { success: true, response }
  } catch (error: any) {
    console.error('Failed to save config to Google Sheets:', error.message)
    
    // 轉發失敗時降級更新本地資料庫
    const db = getLocalDb()
    db.config.GuildName = body.guildName
    db.config.PlayerAName = body.playerAName
    db.config.PlayerBName = body.playerBName
    db.config.AIPrompt = body.aiPrompt
    db.config.WeeklyQuota = body.weeklyQuota
    
    saveLocalDb(db)
    
    return { 
      success: true, 
      offline: true, 
      warning: '無法同步設定至 Google Sheets，已先暫存於本地。' 
    }
  }
})
