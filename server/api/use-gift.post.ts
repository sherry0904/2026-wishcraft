import { getLocalDb, saveLocalDb } from '../utils/localDb'

export default defineEventHandler(async (event) => {
  const body = await readBody<any>(event)
  const config = useRuntimeConfig()
  const sheetUrl = config.sheetUrl
  
  if (!sheetUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Google Sheets URL is not configured. Database connection is required.'
    })
  }

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
    throw createError({
      statusCode: 502,
      statusMessage: `Failed to claim gift on Google Sheets: ${error.message}`
    })
  }
})
