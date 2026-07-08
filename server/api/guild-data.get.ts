import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  let quests: any[] = []
  let milestones: any[] = []
  let logs: any[] = []
  let configData: any = {}
  let shopItems: any[] = []
  let gifts: any[] = []

  try {
    const config = useRuntimeConfig()
    const client = createClient(config.public.supabase.url, config.public.supabase.key)

    const [
      { data: questsRes, error: questsError },
      { data: milestonesRes },
      { data: logsRes },
      { data: configRes },
      { data: shopItemsRes },
      { data: giftsRes }
    ] = await Promise.all([
      client.from('quests').select('*'),
      client.from('milestones').select('*').order('tier'),
      client.from('quest_logs').select('*'),
      client.from('config').select('*').limit(1),
      client.from('shop_items').select('*').order('tier'),
      client.from('gifts').select('*')
    ])

    if (questsError) {
      console.error('Supabase query error:', questsError)
    }

    // Map quests
    quests = (questsRes || []).map(q => ({
      Id: q.id,
      Player: q.player,
      Category: q.category,
      Name: q.name,
      Description: q.description,
      XP: q.xp,
      Icon: q.icon,
      Active: q.active
    }))

    // Map milestones
    milestones = (milestonesRes || []).map(m => ({
      Tier: m.tier,
      XPThreshold: m.xp_threshold,
      RewardName: m.reward_name,
      Description: m.description,
      Unlocked: m.unlocked
    }))

    // Map quest_logs -> logs
    logs = (logsRes || []).map(l => ({
      Timestamp: l.timestamp,
      Date: l.date,
      Player: l.player,
      QuestId: l.quest_id,
      XP: l.xp,
      IsSkipPass: l.is_skip_pass
    }))

    // Map shopItems
    shopItems = (shopItemsRes || []).map(s => ({
      Tier: s.tier,
      XPThreshold: s.xp_threshold,
      RewardName: s.reward_name,
      Description: s.description,
      Unlocked: s.unlocked
    }))

    // Map gifts
    gifts = (giftsRes || []).map(g => ({
      Id: g.id,
      Sender: g.sender,
      Receiver: g.receiver,
      RewardName: g.reward_name,
      Message: g.message,
      Timestamp: g.timestamp,
      Used: g.used,
      AttachedXp: g.attached_xp,
      UsedTimestamp: g.used_timestamp
    }))

    // Map config
    const c = configRes?.[0] || {}
    configData = {
      GuildName: c.guild_name,
      PlayerAName: c.player_a_name,
      PlayerBName: c.player_b_name,
      AIPrompt: c.ai_prompt,
      WeeklyQuota: c.weekly_quota,
      ComboCategory: c.combo_category
    }

    return { quests, milestones, logs, config: configData, shopItems, gifts }
  } catch (error: any) {
    console.error('Failed to fetch from Supabase:', error.message)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch database: ${error.message}`
    })
  }
})
