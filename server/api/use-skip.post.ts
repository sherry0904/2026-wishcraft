
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
    throw createError({
      statusCode: 400,
      statusMessage: 'Google Sheets URL is not configured. Database connection is required.'
    })
  }

  try {
    const response = await $fetch<any>(sheetUrl, {
      method: 'POST',
      body: {
        action: 'useSkip',
        secretToken: config.gasSecretToken,
        player: body.player,
        date: body.date
      }
    })

    return { success: true, response }
  } catch (error: any) {
    console.error('Failed to post useSkip to Google Sheets:', error.message)
    throw createError({
      statusCode: 502,
      statusMessage: `Failed to use skip ticket on Google Sheets: ${error.message}`
    })
  }
})
