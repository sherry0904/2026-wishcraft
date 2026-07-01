import { getLocalDb, saveLocalDb } from '../utils/localDb'

interface UseSkipBody {
  player: 'A' | 'B';
  date: string; // YYYY-MM-DD
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const sheetUrl = config.sheetUrl
  const body = await readBody<UseSkipBody>(event)

  if (!body.player || !body.date) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required parameters: player, date'
    })
  }

  if (!sheetUrl) {
    // 離線模擬請假券邏輯
    const db = getLocalDb()
    const targetDate = new Date(body.date)
    
    // 計算該玩家當週的請假次數（週日為一週開始）
    const startOfWeek = new Date(targetDate)
    startOfWeek.setDate(targetDate.getDate() - targetDate.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    
    let skipCountThisWeek = 0;
    let alreadySkippedToday = false;

    db.logs.forEach(log => {
      if (log.Player === body.player && log.IsSkipPass) {
        const logDate = new Date(log.Date)
        if (log.Date === body.date) {
          alreadySkippedToday = true
        }
        if (logDate >= startOfWeek) {
          skipCountThisWeek++
        }
      }
    })

    if (alreadySkippedToday) {
      throw createError({
        statusCode: 400,
        statusMessage: '今日已經使用過請假券了。'
      })
    }

    const quota = Number(db.config.WeeklyQuota) || 2
    if (skipCountThisWeek >= quota) {
      throw createError({
        statusCode: 400,
        statusMessage: `本週請假券額度（${quota}次）已用完。`
      })
    }

    // 寫入請假紀錄
    db.logs.push({
      Timestamp: new Date().toISOString(),
      Date: body.date,
      Player: body.player,
      QuestId: 'skip',
      XP: 0,
      IsSkipPass: true
    })

    saveLocalDb(db)
    return { success: true, offline: true }
  }

  try {
    const response = await $fetch<any>(sheetUrl, {
      method: 'POST',
      body: {
        action: 'useSkip',
        player: body.player,
        date: body.date
      }
    })

    return { success: true, response }
  } catch (error: any) {
    console.error('Failed to post useSkip to Google Sheets:', error.message)
    
    // 轉發失敗時降級使用本地儲存
    const db = getLocalDb()
    const targetDate = new Date(body.date)
    const startOfWeek = new Date(targetDate)
    startOfWeek.setDate(targetDate.getDate() - targetDate.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    
    let skipCountThisWeek = 0;
    let alreadySkippedToday = false;

    db.logs.forEach(log => {
      if (log.Player === body.player && log.IsSkipPass) {
        const logDate = new Date(log.Date)
        if (log.Date === body.date) {
          alreadySkippedToday = true
        }
        if (logDate >= startOfWeek) {
          skipCountThisWeek++
        }
      }
    })

    if (alreadySkippedToday) {
      throw createError({
        statusCode: 400,
        statusMessage: '今日已經使用過請假券了。'
      })
    }

    const quota = Number(db.config.WeeklyQuota) || 2
    if (skipCountThisWeek >= quota) {
      throw createError({
        statusCode: 400,
        statusMessage: `本週請假券額度（${quota}次）已用完。`
      })
    }

    db.logs.push({
      Timestamp: new Date().toISOString(),
      Date: body.date,
      Player: body.player,
      QuestId: 'skip',
      XP: 0,
      IsSkipPass: true
    })

    saveLocalDb(db)

    return { 
      success: true, 
      offline: true, 
      warning: '無法同步請假至 Google Sheets，已先暫存於本地。' 
    }
  }
})
