import { getLocalDb, saveLocalDb } from '../utils/localDb'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const sheetUrl = config.sheetUrl
  
  if (!sheetUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Google Sheets URL is not configured. Database connection is required.'
    })
  }
  
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
    console.error('Failed to reset Google Sheets logs:', error.message)
    throw createError({
      statusCode: 502,
      statusMessage: `Failed to reset Google Sheets logs: ${error.message}`
    })
  }
})
