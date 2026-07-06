import webpush from 'web-push'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const sheetUrl = config.sheetUrl
  const body = await readBody<{ endpoint: string }>(event)

  if (!body?.endpoint) {
    throw createError({ statusCode: 400, statusMessage: 'Missing endpoint' })
  }

  if (!sheetUrl) {
    throw createError({ statusCode: 400, statusMessage: 'Sheet URL not configured' })
  }

  try {
    await $fetch<any>(sheetUrl, {
      method: 'POST',
      body: {
        action: 'removeExpiredSubscriptions',
        secretToken: config.gasSecretToken,
        endpoints: [body.endpoint]
      }
    })
    return { success: true }
  } catch (error: any) {
    console.error('Failed to remove subscription from Sheets:', error.message)
    throw createError({ statusCode: 502, statusMessage: 'Failed to remove subscription' })
  }
})
