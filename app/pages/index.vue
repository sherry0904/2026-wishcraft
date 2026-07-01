<template>
  <div class="guild-dashboard" :class="{ 'pb-nav': activePlayer }">
    <!-- 讀取中遮罩 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-scanner">
        <div class="scanner-text">CONNECTING TO WISHCRAFT SERVER...</div>
        <div class="scanner-bar"></div>
      </div>
    </div>

    <!-- 情況 A：尚未選擇身分，顯示角色登入選取畫面 -->
    <div v-else-if="!activePlayer" class="character-select-screen">
      <div class="select-header">
        <h1 class="select-logo">WISHCRAFT</h1>
        <p class="select-subtitle">SELECT YOUR ADVENTURER / 選擇您的身分</p>
      </div>

      <div class="characters-grid">
        <!-- 角色 A：萱 -->
        <div class="char-card char-card-a" @click="loginPlayer('A')">
          <div class="char-avatar avatar-large-a">萱</div>
          <h2 class="char-name">{{ playerAName }}</h2>
          <span class="char-role">ADVENTURER A</span>
        </div>

        <!-- 角色 B：至 -->
        <div class="char-card char-card-b" @click="loginPlayer('B')">
          <div class="char-avatar avatar-large-b">至</div>
          <h2 class="char-name">{{ playerBName }}</h2>
          <span class="char-role">ADVENTURER B</span>
        </div>
      </div>
    </div>

    <!-- 情況 B：已選擇身分，顯示主儀表板 -->
    <div v-else class="dashboard-content">
      <!-- 頂部公會資訊 -->
      <GuildHeader 
        :guild-name="guildName"
        :player-a-name="playerAName"
        :player-b-name="playerBName"
        :total-xp="totalXp" 
        :active-player="activePlayer"
        :is-offline="isOffline"
      />

      <!-- 當前登入身分與切換鈕 -->
      <div class="user-bar">
        <div class="user-info-pill">
          <span class="status-indicator"></span>
          <span>冒險者身分：<strong class="text-white">{{ activePlayerName }}</strong></span>
        </div>
        <button class="btn-logout" @click="logoutPlayer">切換身分</button>
      </div>

      <!-- 錯誤/警告提示 -->
      <div v-if="errorMessage" class="error-banner">
        <span class="error-close" @click="errorMessage = ''">✖</span>
        <span class="error-text">🔴 {{ errorMessage }}</span>
      </div>

      <div v-if="warningMessage" class="warning-banner">
        <span class="warning-close" @click="warningMessage = ''">✖</span>
        <span class="warning-text">⚠️ {{ warningMessage }}</span>
      </div>

      <!-- == 分頁呈現內容 == -->
      
      <!-- 1. 任務分頁 -->
      <div v-if="currentNavTab === 'quests'" class="tab-view-content">
        <!-- 中間共鬥面板 -->
        <CoOpPanel 
          :active-player="activePlayer"
          :player-a-name="playerAName"
          :player-b-name="playerBName"
          :player-a-quests-done="playerAQuestsDone"
          :player-a-quests-total="playerAQuestsTotal"
          :player-a-skips-used="playerASkipsUsed"
          :player-a-has-skipped="hasSkippedA"
          :player-b-quests-done="playerBQuestsDone"
          :player-b-quests-total="playerBQuestsTotal"
          :player-b-skips-used="playerBSkipsUsed"
          :player-b-has-skipped="hasSkippedB"
          :is-combo-active="isComboActiveToday"
          :is-offline="isOffline"
          @use-skip="onUseSkip"
        />

        <!-- 任務看板 -->
        <QuestBoard 
          :active-player="activePlayer"
          :player-a-name="playerAName"
          :player-b-name="playerBName"
          :quests="quests"
          :completed-quests-a="completedQuestsAToday"
          :completed-quests-b="completedQuestsBToday"
          :has-skipped-a="hasSkippedA"
          :has-skipped-b="hasSkippedB"
          @toggle-quest="onToggleQuest"
        />
      </div>

      <!-- 2. 商店分頁 -->
      <div v-if="currentNavTab === 'shop'" class="tab-view-content">
        <LootDashboard 
          :total-xp="totalXp"
          :current-balance="currentBalance"
          :milestones="milestones"
          :shop-items="shopItems"
          :is-redeeming="isRedeeming"
          @redeem-reward="onRedeemReward"
        />
      </div>

      <!-- 3. 點數存摺分頁 -->
      <div v-if="currentNavTab === 'ledger'" class="tab-view-content game-card">
        <HistoryPanel 
          :logs="logs"
          :quests="quests"
          :milestones="milestones"
          :shop-items="shopItems"
          :player-a-name="playerAName"
          :player-b-name="playerBName"
        />
      </div>

      <!-- 4. 設定分頁 -->
      <div v-if="currentNavTab === 'settings'" class="tab-view-content">
        <AIConfigPanel 
          :guild-name="guildName"
          :player-a-name="playerAName"
          :player-b-name="playerBName"
          :ai-prompt="aiPrompt"
          :weekly-quota="weeklyQuota"
          :is-offline="isOffline"
          :is-saving="isSavingConfig"
          @save-config="onSaveConfig"
        />
      </div>

      <!-- 底部防滑固定導航列 -->
      <nav class="bottom-nav">
        <button 
          class="nav-item" 
          :class="{ 'nav-active': currentNavTab === 'quests' }" 
          @click="currentNavTab = 'quests'"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          <span>任務</span>
        </button>
        
        <button 
          class="nav-item" 
          :class="{ 'nav-active': currentNavTab === 'shop' }" 
          @click="currentNavTab = 'shop'"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <span>商店</span>
        </button>
        
        <button 
          class="nav-item" 
          :class="{ 'nav-active': currentNavTab === 'ledger' }" 
          @click="currentNavTab = 'ledger'"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          <span>存摺</span>
        </button>
        
        <button 
          class="nav-item" 
          :class="{ 'nav-active': currentNavTab === 'settings' }" 
          @click="currentNavTab = 'settings'"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          <span>設定</span>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from '#app'
import confetti from 'canvas-confetti'
import type { Quest } from '~/components/QuestBoard.vue'
import type { Milestone } from '~/components/LootDashboard.vue'

// 狀態管理
const route = useRoute()
const quests = ref<Quest[]>([])
const milestones = ref<Milestone[]>([])
const shopItems = ref<Milestone[]>([])
const logs = ref<any[]>([])
const configData = ref<Record<string, any>>({})

const isLoading = ref(true)
const isOffline = ref(false)
const isSavingConfig = ref(false)
const isRedeeming = ref(false)
const errorMessage = ref('')
const warningMessage = ref('')

// 分頁選取 ('quests' | 'shop' | 'ledger' | 'settings')
const currentNavTab = ref<'quests' | 'shop' | 'ledger' | 'settings'>('quests')

// 監聽分頁切換，自動將視窗滾動置頂，提供順暢的 App 切換體驗
watch(currentNavTab, () => {
  window.scrollTo(0, 0)
})

// 本地身分變數 (響應式)
const activePlayer = ref<'A' | 'B' | null>(null)

// 系統參數
const guildName = computed(() => configData.value.GuildName || '雙人夢想解鎖板')
const playerAName = computed(() => configData.value.PlayerAName || '萱')
const playerBName = computed(() => configData.value.PlayerBName || '至')
const aiPrompt = computed(() => configData.value.AIPrompt || '')
const weeklyQuota = computed(() => Number(configData.value.WeeklyQuota) || 2)

// 當前登入身分中文姓名
const activePlayerName = computed(() => {
  if (activePlayer.value === 'A') return playerAName.value
  if (activePlayer.value === 'B') return playerBName.value
  return ''
})

// 日期輔助函式：將任何日期轉換為瀏覽器本地的 YYYY-MM-DD 格式，徹底防禦 Google Sheets 的時區偏移
function parseToLocalDateStr(dateVal: any): string {
  if (!dateVal) return ''
  const dateStr = String(dateVal)
  if (dateStr.includes('T')) {
    const d = new Date(dateStr)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  return dateStr.substring(0, 10)
}

function getTodayDateStr(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const todayStr = getTodayDateStr()

// 1. 判定雙方今日是否使用請假券 (Skip Pass)
const hasSkippedA = computed(() => {
  return logs.value.some(l => l.Player === 'A' && l.QuestId === 'skip' && parseToLocalDateStr(l.Date) === todayStr)
})

const hasSkippedB = computed(() => {
  return logs.value.some(l => l.Player === 'B' && l.QuestId === 'skip' && parseToLocalDateStr(l.Date) === todayStr)
})

// 2. 取得雙方今日已完成的任務 ID 列表 (若請假，則視為完成所有任務)
const completedQuestsAToday = computed(() => {
  if (hasSkippedA.value) {
    return quests.value.filter(q => (q.Player === 'A' || q.Player === 'Both') && q.Active).map(q => q.Id)
  }
  return logs.value
    .filter(l => l.Player === 'A' && parseToLocalDateStr(l.Date) === todayStr && !l.IsSkipPass)
    .map(l => l.QuestId)
})

const completedQuestsBToday = computed(() => {
  if (hasSkippedB.value) {
    return quests.value.filter(q => (q.Player === 'B' || q.Player === 'Both') && q.Active).map(q => q.Id)
  }
  return logs.value
    .filter(l => l.Player === 'B' && parseToLocalDateStr(l.Date) === todayStr && !l.IsSkipPass)
    .map(l => l.QuestId)
})

// 3. 計算雙方任務總量與完成數量
const playerAQuestsTotal = computed(() => quests.value.filter(q => (q.Player === 'A' || q.Player === 'Both') && q.Active).length)
const playerBQuestsTotal = computed(() => quests.value.filter(q => (q.Player === 'B' || q.Player === 'Both') && q.Active).length)

const playerAQuestsDone = computed(() => completedQuestsAToday.value.length)
const playerBQuestsDone = computed(() => completedQuestsBToday.value.length)

// 4. 計算本週已使用的請假券次數 (週日開始)
function getSkipsUsedThisWeek(player: 'A' | 'B'): number {
  const today = new Date(todayStr)
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  return logs.value.filter(l => 
    l.Player === player && 
    l.IsSkipPass && 
    new Date(parseToLocalDateStr(l.Date)) >= startOfWeek
  ).length
}

const playerASkipsUsed = computed(() => getSkipsUsedThisWeek('A'))
const playerBSkipsUsed = computed(() => getSkipsUsedThisWeek('B'))

// 5. 判斷今日 Combo 是否啟動 (雙方當天都完成「飲水」類別任務，或有人使用請假券亦可維持)
const isComboActiveToday = computed(() => {
  const aDoneWater = completedQuestsAToday.value.some(id => {
    const q = quests.value.find(quest => quest.Id === id)
    return q?.Category === '飲水'
  }) || hasSkippedA.value

  const bDoneWater = completedQuestsBToday.value.some(id => {
    const q = quests.value.find(quest => quest.Id === id)
    return q?.Category === '飲水'
  }) || hasSkippedB.value

  return aDoneWater && bDoneWater
})

// 6. 動態加總所有歷史完成任務獲得的累計 XP (只計正值，不隨兌換扣除，用來解鎖里程碑與升級)
const totalXp = computed(() => {
  const logsByDate: Record<string, any[]> = {}
  logs.value.forEach(log => {
    if (log.QuestId.startsWith('redeem_')) return // 忽略兌換扣點日誌

    const localDateStr = parseToLocalDateStr(log.Date)
    if (!logsByDate[localDateStr]) {
      logsByDate[localDateStr] = []
    }
    logsByDate[localDateStr].push(log)
  })

  let sum = 0
  Object.entries(logsByDate).forEach(([date, dayLogs]) => {
    let dayXp = 0
    let hasWaterA = false
    let hasWaterB = false

    dayLogs.forEach(log => {
      const q = quests.value.find(quest => quest.Id === log.QuestId)
      const isWater = q ? q.Category === '飲水' : log.QuestId.includes('water')
      const isSkip = log.IsSkipPass || log.QuestId === 'skip'

      if (log.Player === 'A' && (isWater || isSkip)) hasWaterA = true
      if (log.Player === 'B' && (isWater || isSkip)) hasWaterB = true

      dayXp += Number(log.XP) || 0
    })

    if (hasWaterA && hasWaterB) {
      dayXp = dayXp * 1.2
    }

    sum += dayXp
  })

  return Math.round(sum)
})

// 7. 計算當前夢想金庫剩餘可用點數 (包含 Combo 經驗加成，並扣除已兌換花費點數)
const currentBalance = computed(() => {
  const logsByDate: Record<string, any[]> = {}
  logs.value.forEach(log => {
    if (log.QuestId.startsWith('redeem_')) return // 忽略兌換扣點日誌，下方單獨減去

    const localDateStr = parseToLocalDateStr(log.Date)
    if (!logsByDate[localDateStr]) {
      logsByDate[localDateStr] = []
    }
    logsByDate[localDateStr].push(log)
  })

  let earnedXp = 0
  Object.entries(logsByDate).forEach(([date, dayLogs]) => {
    let dayXp = 0
    let hasWaterA = false
    let hasWaterB = false

    dayLogs.forEach(log => {
      const q = quests.value.find(quest => quest.Id === log.QuestId)
      const isWater = q ? q.Category === '飲水' : log.QuestId.includes('water')
      const isSkip = log.IsSkipPass || log.QuestId === 'skip'

      if (log.Player === 'A' && (isWater || isSkip)) hasWaterA = true
      if (log.Player === 'B' && (isWater || isSkip)) hasWaterB = true

      dayXp += Number(log.XP) || 0
    })

    if (hasWaterA && hasWaterB) {
      dayXp = dayXp * 1.2
    }

    earnedXp += dayXp
  })

  // 累加所有的兌換扣點數（通常為負數，例如 -300）
  const spentXp = logs.value
    .filter(log => log.QuestId.startsWith('redeem_'))
    .reduce((acc, log) => acc + (Number(log.XP) || 0), 0)

  return Math.max(Math.round(earnedXp) + spentXp, 0)
})


// 8. 監聽 XP 變化，若突破里程碑則噴發彩帶
let lastXpVal = 0
function checkMilestoneUnlock(newVal: number, oldVal: number) {
  if (oldVal === 0) return // 首次加載不觸發
  
  milestones.value.forEach(ms => {
    if (newVal >= ms.XPThreshold && oldVal < ms.XPThreshold) {
      triggerConfetti()
    }
  })
}

function triggerConfetti() {
  confetti({
    particleCount: 150,
    spread: 80,
    origin: { y: 0.6 },
    colors: ['#9d4edd', '#00b4d8', '#ffb703', '#06d6a0']
  })
}

// 9. 載入資料庫資料
async function fetchAllData() {
  try {
    const data = await $fetch<any>('/api/guild-data')
    quests.value = data.quests || []
    milestones.value = data.milestones || []
    shopItems.value = data.shopItems || []
    logs.value = data.logs || []
    configData.value = data.config || {}
    isOffline.value = !!data.offline
    
    if (data.warning) {
      warningMessage.value = data.warning
    }
    if (data.error) {
      errorMessage.value = data.error
    }

    // 記錄上次 XP 值，用以偵測是否新解鎖里程碑
    const currentTotal = totalXp.value
    if (lastXpVal !== 0 && currentTotal > lastXpVal) {
      checkMilestoneUnlock(currentTotal, lastXpVal)
    }
    lastXpVal = currentTotal

  } catch (err: any) {
    errorMessage.value = '無法連接伺服器 API，請確認後端是否正常運作。'
    isOffline.value = true
  } finally {
    isLoading.value = false
  }
}

// 10. 勾選與取消任務事件
async function onToggleQuest(payload: { questId: string; completed: boolean; xp: number }) {
  if (!activePlayer.value) return

  // 1. 前端 UI 立即反應 (樂觀更新)
  const tempLog = {
    Timestamp: new Date().toISOString(),
    Date: todayStr,
    Player: activePlayer.value,
    QuestId: payload.questId,
    XP: payload.xp,
    IsSkipPass: false
  }

  const oldLogs = [...logs.value]

  if (payload.completed) {
    logs.value.push(tempLog)
  } else {
    const idx = logs.value.findIndex(l => 
      parseToLocalDateStr(l.Date) === todayStr && 
      l.Player === activePlayer.value && 
      l.QuestId === payload.questId && 
      !l.IsSkipPass
    )
    if (idx !== -1) logs.value.splice(idx, 1)
  }

  // 檢查是否升級或觸發里程碑解鎖
  checkMilestoneUnlock(totalXp.value, lastXpVal)
  lastXpVal = totalXp.value

  // 2. 向後端同步
  try {
    const res = await $fetch<any>('/api/sync-quest', {
      method: 'POST',
      body: {
        player: activePlayer.value,
        questId: payload.questId,
        date: todayStr,
        completed: payload.completed,
        xp: payload.xp
      }
    })
    
    if (res.warning) {
      warningMessage.value = res.warning
    }
  } catch (err: any) {
    // 同步失敗，回滾狀態
    logs.value = oldLogs
    lastXpVal = totalXp.value
    errorMessage.value = err.data?.message || '同步任務失敗，已回滾變更。'
  }
}

// 11. 使用請假券事件
async function onUseSkip(player: 'A' | 'B') {
  if (activePlayer.value !== player) return

  // 1. 前端樂觀更新
  const tempLog = {
    Timestamp: new Date().toISOString(),
    Date: todayStr,
    Player: player,
    QuestId: 'skip',
    XP: 0,
    IsSkipPass: true
  }

  const oldLogs = [...logs.value]
  logs.value.push(tempLog)
  
  // 請假可能也會維持 Combo 並可能越過里程碑
  checkMilestoneUnlock(totalXp.value, lastXpVal)
  lastXpVal = totalXp.value

  // 2. 向後端同步
  try {
    const res = await $fetch<any>('/api/use-skip', {
      method: 'POST',
      body: {
        player: player,
        date: todayStr
      }
    })

    if (res.warning) {
      warningMessage.value = res.warning
    }
  } catch (err: any) {
    logs.value = oldLogs
    lastXpVal = totalXp.value
    errorMessage.value = err.data?.message || '使用請假券失敗，請重試。'
  }
}

// 12. 儲存公會設定與 AI 提示詞
async function onSaveConfig(payload: { guildName: string; playerAName: string; playerBName: string; aiPrompt: string; weeklyQuota: number }) {
  isSavingConfig.value = true
  
  // 本地更新
  configData.value.GuildName = payload.guildName
  configData.value.PlayerAName = payload.playerAName
  configData.value.PlayerBName = payload.playerBName
  configData.value.AIPrompt = payload.aiPrompt
  configData.value.WeeklyQuota = payload.weeklyQuota

  try {
    const res = await $fetch<any>('/api/save-config', {
      method: 'POST',
      body: {
        guildName: payload.guildName,
        playerAName: payload.playerAName,
        playerBName: payload.playerBName,
        aiPrompt: payload.aiPrompt,
        weeklyQuota: payload.weeklyQuota
      }
    })
    
    if (res.warning) {
      warningMessage.value = res.warning
    }
    await fetchAllData()
  } catch (err: any) {
    errorMessage.value = err.data?.message || '儲存設定失敗，請重試。'
  } finally {
    isSavingConfig.value = false
  }
}

// 13. 夢想商店扣點兌換獎勵
async function onRedeemReward(milestone: any) {
  if (isRedeeming.value) return
  isRedeeming.value = true

  const oldLogs = [...logs.value]
  const tempLog = {
    Timestamp: new Date().toISOString(),
    Date: todayStr,
    Player: activePlayer.value || 'A',
    QuestId: `redeem_tier_${milestone.Tier}`,
    XP: -milestone.XPThreshold,
    IsSkipPass: false
  }

  // 本地樂觀更新
  logs.value.push(tempLog)

  try {
    const res = await $fetch<any>('/api/sync-quest', {
      method: 'POST',
      body: {
        player: activePlayer.value || 'A',
        questId: `redeem_tier_${milestone.Tier}`,
        date: todayStr,
        completed: true,
        xp: -milestone.XPThreshold
      }
    })

    if (res.warning) {
      warningMessage.value = res.warning
    }
    
    // 成功兌換時噴灑滿版彩帶慶祝！
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    })
    
    await fetchAllData()
  } catch (err: any) {
    logs.value = oldLogs
    errorMessage.value = err.data?.message || '兌換失敗，請重試。'
  } finally {
    isRedeeming.value = false
  }
}

// 14. 登入與登出身分
function loginPlayer(player: 'A' | 'B') {
  activePlayer.value = player
  localStorage.setItem('wishcraft_player', player)
}

function logoutPlayer() {
  activePlayer.value = null
  localStorage.removeItem('wishcraft_player')
}

onMounted(() => {
  // 1. 優先判斷網址 query 參數
  const p = route.query.player
  if (p === 'A' || p === 'B') {
    activePlayer.value = p
    localStorage.setItem('wishcraft_player', p)
  } else {
    // 2. 其次從本地 localStorage 讀取
    const saved = localStorage.getItem('wishcraft_player')
    if (saved === 'A' || saved === 'B') {
      activePlayer.value = saved as 'A' | 'B'
    }
  }
  
  fetchAllData()
  // 每 30 秒自動輪詢最新資料，保持雙人同步！
  setInterval(fetchAllData, 30000)
})
</script>

<style scoped>
.guild-dashboard {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.pb-nav {
  padding-bottom: 85px; /* 留出底部導航列的空間 */
}

/* 讀取動畫 */
.loading-overlay {
  height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-scanner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.scanner-text {
  font-family: var(--font-title);
  font-size: 1.1rem;
  letter-spacing: 2px;
  color: var(--neon-blue);
  text-shadow: 0 0 10px rgba(0, 180, 216, 0.4);
}

.scanner-bar {
  width: 250px;
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;
  border-radius: 2px;
}

.scanner-bar::after {
  content: '';
  position: absolute;
  left: -100px;
  top: 0;
  width: 100px;
  height: 100%;
  background: linear-gradient(90deg, transparent, var(--neon-blue), transparent);
  animation: scanning 1.5s infinite linear;
}

@keyframes scanning {
  0% { left: -100px; }
  100% { left: 250px; }
}

/* 角色登入選擇畫面 */
.character-select-screen {
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem 1rem;
  animation: fadeIn 0.4s ease-out;
}

.select-header {
  text-align: center;
  margin-bottom: 3.5rem;
}

.select-logo {
  font-family: var(--font-body);
  font-size: 2.2rem;
  font-weight: 900;
  letter-spacing: 6px;
  background: linear-gradient(135deg, var(--neon-purple), var(--neon-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 20px rgba(0, 180, 216, 0.2);
}

.select-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
  letter-spacing: 2px;
  margin-top: 0.6rem;
  font-weight: bold;
}

.characters-grid {
  display: flex;
  gap: 2rem;
  width: 100%;
  max-width: 600px;
  justify-content: center;
}

@media (max-width: 576px) {
  .characters-grid {
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }
}

.char-card {
  flex: 1;
  width: 100%;
  max-width: 240px;
  background: rgba(20, 24, 35, 0.45);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 2.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.char-card-a {
  border-color: rgba(157, 78, 221, 0.15);
}

.char-card-a:hover {
  border-color: var(--neon-purple);
  box-shadow: var(--shadow-neon-purple);
  transform: translateY(-6px);
}

.char-card-b {
  border-color: rgba(0, 180, 216, 0.15);
}

.char-card-b:hover {
  border-color: var(--neon-blue);
  box-shadow: var(--shadow-neon-blue);
  transform: translateY(-6px);
}

.char-avatar {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.7rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 1.5rem;
}

.avatar-large-a {
  background: var(--neon-purple);
  box-shadow: 0 0 15px rgba(157, 78, 221, 0.4);
}

.avatar-large-b {
  background: var(--neon-blue);
  box-shadow: 0 0 15px rgba(0, 180, 216, 0.4);
}

.char-name {
  font-family: var(--font-body);
  font-size: 1.25rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 0.4rem;
}

.char-role {
  font-size: 0.7rem;
  color: var(--text-muted);
  letter-spacing: 1px;
}

/* 登入身分工具列 */
.user-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid var(--border-color);
  padding: 0.5rem 1rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.user-info-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-indicator {
  width: 6px;
  height: 6px;
  background-color: var(--neon-green);
  border-radius: 50%;
  box-shadow: var(--shadow-neon-green);
}

.btn-logout {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-logout:hover {
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* 錯誤與警告橫幅 */
.error-banner, .warning-banner {
  padding: 0.85rem 1.25rem;
  border-radius: 12px;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  position: relative;
  animation: slide-in 0.3s ease-out;
}

.error-banner {
  background: rgba(255, 77, 109, 0.15);
  border: 1px solid rgba(255, 77, 109, 0.3);
  color: #ff4d6d;
}

.warning-banner {
  background: rgba(255, 183, 3, 0.1);
  border: 1px solid rgba(255, 183, 3, 0.3);
  color: var(--neon-gold);
}

.error-close, .warning-close {
  position: absolute;
  right: 1.25rem;
  cursor: pointer;
  font-size: 0.8rem;
  opacity: 0.7;
  transition: var(--transition-smooth);
}

.error-close:hover, .warning-close:hover {
  opacity: 1;
}

.error-text, .warning-text {
  margin-right: 2rem;
  line-height: 1.4;
}

@keyframes slide-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 底部固定導航列 */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(11, 12, 16, 0.85);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-around;
  padding: 0.6rem 0 0.8rem 0; /* 留出 iOS 安全觸控距離 */
  z-index: 100;
  box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.5);
}

.nav-item {
  background: transparent;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--text-muted);
  font-family: var(--font-body);
  font-size: 0.7rem;
  font-weight: 800;
  cursor: pointer;
  transition: var(--transition-smooth);
  gap: 0.25rem;
  flex: 1;
  -webkit-tap-highlight-color: transparent;
}

.nav-icon {
  width: 20px;
  height: 20px;
  opacity: 0.55;
  color: var(--text-muted);
  transition: var(--transition-smooth);
}

.nav-item:hover {
  color: #fff;
}

.nav-item:hover .nav-icon {
  opacity: 1;
  color: #fff;
}

.nav-active {
  color: var(--neon-blue);
  text-shadow: 0 0 8px rgba(0, 180, 216, 0.2);
}

.nav-active .nav-icon {
  opacity: 1;
  color: var(--neon-blue);
  filter: drop-shadow(0 0 4px rgba(0, 180, 216, 0.4));
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
