import { createClient } from '@supabase/supabase-js'

interface SaveConfigBody {
  guildName: string;
  playerAName: string;
  playerBName: string;
  aiPrompt: string;
  weeklyQuota: number;
  comboCategory: string;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<SaveConfigBody>(event)

  if (!body.guildName || !body.playerAName || !body.playerBName || body.weeklyQuota === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required parameters'
    })
  }

  try {
    const config = useRuntimeConfig()
    const client = createClient(config.public.supabase.url, config.public.supabase.key)

    // 更新第一筆設定
    const { data: configData } = await client.from('config').select('id').limit(1)
    const configId = configData?.[0]?.id

    if (configId) {
      const { error } = await client.from('config')
        .update({
          guild_name: body.guildName,
          player_a_name: body.playerAName,
          player_b_name: body.playerBName,
          ai_prompt: body.aiPrompt,
          weekly_quota: body.weeklyQuota,
          combo_category: body.comboCategory
        })
        .eq('id', configId)

      if (error) throw error
    } else {
      const { error } = await client.from('config').insert({
        guild_name: body.guildName,
        player_a_name: body.playerAName,
        player_b_name: body.playerBName,
        ai_prompt: body.aiPrompt,
        weekly_quota: body.weeklyQuota,
        combo_category: body.comboCategory
      })
      if (error) throw error
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to save config to Supabase:', error.message)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to save configuration to Supabase: ${error.message}`
    })
  }
})
