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
    throw createError({
      statusCode: 400,
      statusMessage: 'Google Sheets URL is not configured. Database connection is required.'
    })
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
    throw createError({
      statusCode: 502,
      statusMessage: `Failed to save configuration to Google Sheets: ${error.message}`
    })
  }
})
