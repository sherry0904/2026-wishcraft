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
    throw createError({
      statusCode: 400,
      statusMessage: 'Google Sheets URL is not configured. Database connection is required.'
    })
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
    throw createError({
      statusCode: 502,
      statusMessage: `Failed to sync quest to Google Sheets: ${error.message}`
    })
  }
})
