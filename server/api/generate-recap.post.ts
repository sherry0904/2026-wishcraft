
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const sheetUrl = config.sheetUrl
  
  if (!sheetUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Google Sheets URL is not configured. Database connection is required.'
    })
  }

  let quests: any[] = []
  let logs: any[] = []
  let configData: any = {}
  
  try {
    const response = await $fetch<any>(`${sheetUrl}?action=getData`, {
      method: 'GET',
      timeout: 10000
    })
    quests = response.quests || []
    logs = response.logs || []
    configData = response.config || {}
  } catch (err: any) {
    console.error('Recap API failed to fetch from Sheets:', err.message)
    throw createError({
      statusCode: 502,
      statusMessage: `Failed to fetch data from Google Sheets for recap: ${err.message}`
    })
  }
  
  // 2. 計算本週起始日 (週日 00:00:00) 的 YYYY-MM-DD 本地日期字串
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  
  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const startOfWeekStr = formatLocalDate(startOfWeek)
  
  // 3. 統計雙方本週完成任務次數 (比對 YYYY-MM-DD 字串)
  const aDone = logs.filter(l => {
    const logDateStr = l.Date ? String(l.Date).substring(0, 10) : ''
    return l.Player === 'A' && 
      l.QuestId !== 'skip' && 
      !l.QuestId.startsWith('redeem_') &&
      logDateStr >= startOfWeekStr
  }).length

  const bDone = logs.filter(l => {
    const logDateStr = l.Date ? String(l.Date).substring(0, 10) : ''
    return l.Player === 'B' && 
      l.QuestId !== 'skip' && 
      !l.QuestId.startsWith('redeem_') &&
      logDateStr >= startOfWeekStr
  }).length
  
  const playerA = (configData.PlayerAName as string) || '萱'
  const playerB = (configData.PlayerBName as string) || '至'
  
  // 4. 讀取並格式化 AI 提示詞
  let promptTemplate = (configData.AIPrompt as string) || 
    '請根據本週數據：{PlayerA} 完成了 {A_completed} 項任務，{PlayerB} 完成了 {B_completed} 項任務。請以輕鬆、溫馨且鼓勵性的冒險戰報口吻，撰寫一篇 100 字內的每週進度戰報總結，並給予雙方熱血與實用的鼓勵，語系使用台灣繁體中文。'
    
  // 代換變數：支持大括號格式，也支持 Google 試算表預設的純英文詞 (不分大小寫)
  let prompt = promptTemplate
    .replace(/{PlayerA}/g, playerA)
    .replace(/{PlayerB}/g, playerB)
    .replace(/Player A/gi, playerA)
    .replace(/Player B/gi, playerB)
    .replace(/{A_completed}/g, aDone.toString())
    .replace(/{B_completed}/g, bDone.toString())

  // 5. 偵測環境變數中的 Gemini API Key
  const apiKey = process.env.GEMINI_API_KEY || process.env.NUXT_GEMINI_API_KEY
  
  if (!apiKey) {
    // 降級處理：若無 API Key，隨機產出高品質模擬戰報，提示使用者如何啟用
    const mockRecaps = [
      `【每週冒險戰報 🤖】\n本週 ${playerA} 勇往直前完成了 ${aDone} 項日常養成！${playerB} 也默默努力完成了 ${bDone} 項目標！雙方的習慣默契正逐步萌芽。繼續攜手堅持，下一個解鎖的商店約會大餐就在不遠處！\n\n*(提示：您的 Google Sheets 已成功連線！如需啟用真實 AI 戰報，請在 .env 中額外填寫 GEMINI_API_KEY 即可。)*`,
      `【習慣冒險戰報 🤖】\n本週養成總結：${playerA} 完成了 ${aDone} 次挑戰，而 ${playerB} 累積完成了 ${bDone} 次！這是一段溫馨且自律的習慣旅程，感謝雙方在健康上的每一步跨越。下週繼續保持！\n\n*(提示：您的 Google Sheets 已成功連線！如需啟用真實 AI 戰報，請在 .env 中額外填寫 GEMINI_API_KEY 即可。)*`
    ]
    const randomRecap = mockRecaps[Math.floor(Math.random() * mockRecaps.length)]
    
    return { 
      recap: randomRecap, 
      prompt,
      simulated: true 
    }
  }
  
  try {
    // 6. 發送請求給 Gemini 1.5 Flash 服務
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
    const result = await $fetch<any>(geminiUrl, {
      method: 'POST',
      body: {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      }
    })
    
    const recapText = result.candidates?.[0]?.content?.parts?.[0]?.text || '戰報姬去午睡了，生成失敗。'
    return { 
      recap: recapText.trim(), 
      prompt,
      simulated: false
    }
  } catch (err: any) {
    return {
      recap: `【離線戰報降級】\n本週 ${playerA} 完成了 ${aDone} 次挑戰，${playerB} 完成了 ${bDone} 次挑戰！持續堅持，夢想終將解鎖。(AI 呼叫出錯: ${err.message})`,
      prompt,
      error: err.message
    }
  }
})
