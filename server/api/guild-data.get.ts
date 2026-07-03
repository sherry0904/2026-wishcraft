
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
    // 呼叫 Google Apps Script API
    const response = await $fetch<any>(`${sheetUrl}?action=getData`, {
      method: 'GET',
      timeout: 10000 // 10秒逾時
    })
    
    const finalShopItems = response.shopItems || []
    
    // 動態注入自訂驚喜兌現券商品，免除使用者手動修改 Sheets 欄位的負擔
    if (Array.isArray(finalShopItems) && !finalShopItems.some((i: any) => Number(i.Tier) === 8)) {
      finalShopItems.push({
        Tier: 8,
        XPThreshold: 150,
        RewardName: '🎨 自訂驚喜兌現券',
        Description: '花費 150 XP 自訂一張專屬券送給夥伴，內容與稱呼由你發揮！',
        Unlocked: false
      })
    }
    
    return {
      quests: response.quests || [],
      milestones: response.milestones || [],
      shopItems: finalShopItems,
      gifts: response.gifts || [],
      logs: response.logs || [],
      config: response.config || {},
      offline: false
    }
  } catch (error: any) {
    console.error('Failed to fetch data from Google Sheets:', error.message)
    throw createError({
      statusCode: 502,
      statusMessage: `Failed to connect to Google Sheets: ${error.message}`
    })
  }
})
