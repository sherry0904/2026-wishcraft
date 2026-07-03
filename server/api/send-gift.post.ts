
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
    throw createError({
      statusCode: 502,
      statusMessage: `Failed to send gift to Google Sheets: ${error.message}`
    })
  }
})
