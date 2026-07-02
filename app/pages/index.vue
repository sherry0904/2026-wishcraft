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

      <!-- 如果先前有登入紀錄，允許快速返回儀表板，避免選錯無法返回 -->
      <div v-if="lastSavedPlayer" class="return-dashboard-wrapper">
        <button class="btn-return-dashboard" @click="loginPlayer(lastSavedPlayer)">
          返回儀表板 ➜ (繼續以 {{ lastSavedPlayer === 'A' ? playerAName : playerBName }} 冒險)
        </button>
      </div>
    </div>

    <!-- 情況 B：已選擇身分，顯示主儀表板 -->
    <div v-else class="dashboard-content">
      <!-- 2.0 精簡版頂部常駐導航 (大幅節省手機首屏空間) -->
      <GuildHeader 
        :guild-name="guildName"
        :player-a-name="playerAName"
        :player-b-name="playerBName"
        :total-xp="totalXp" 
        :player-a-balance="playerABalance"
        :player-b-balance="playerBBalance"
        :player-a-contribution="playerAContribution"
        :player-b-contribution="playerBContribution"
        :is-synergy-active="isSynergyActive"
        :active-player="activePlayer"
        :is-offline="isOffline"
        mode="compact"
        @switchPlayer="togglePlayer"
      />

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
        <!-- 今日日期與雙人已獲得點數看板 -->
        <div class="today-summary-bar game-card">
          <div class="today-date-info">
            <span class="calendar-icon">📅</span>
            <span class="date-text">{{ formattedTodayDate }}</span>
          </div>
          <div class="today-points-info">
            <span class="xp-pill pill-a">{{ playerAName }}今日已得: +{{ xpEarnedTodayA }} XP</span>
            <span class="xp-pill pill-b">{{ playerBName }}今日已得: +{{ xpEarnedTodayB }} XP</span>
            <span v-if="isComboActiveToday" class="combo-bonus-glow">⚡ COMBO 1.2x</span>
          </div>
        </div>

        <!-- 中間狀態面板 -->
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
          :combo-category="comboCategory"
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
          :logs="logs"
          @toggle-quest="onToggleQuest"
        />
      </div>

      <!-- 2. 商店分頁 -->
      <div v-if="currentNavTab === 'shop'" class="tab-view-content">
        <LootDashboard 
          :total-xp="totalXp"
          :active-player="activePlayer"
          :player-a-balance="playerABalance"
          :player-b-balance="playerBBalance"
          :player-a-name="playerAName"
          :player-b-name="playerBName"
          :milestones="milestones"
          :shop-items="shopItems"
          :gifts="gifts"
          :is-redeeming="isRedeeming"
          @refresh-data="fetchAllData"
        />
      </div>

      <!-- 3. 點數存摺分頁 (僅顯示點數收支明細，去掉日週月報告) -->
      <div v-if="currentNavTab === 'ledger'" class="tab-view-content game-card">
        <HistoryPanel 
          :logs="logs"
          :quests="quests"
          :milestones="milestones"
          :shop-items="shopItems"
          :player-a-name="playerAName"
          :player-b-name="playerBName"
          mode="ledger"
        />
      </div>

      <!-- 3.5 養成報告分頁 (2.0 新增) -->
      <div v-if="currentNavTab === 'reports'" class="tab-view-content">
        <!-- 滿版公會詳細進度大看板 (從首頁移到此處，置於報告最頂端) -->
        <GuildHeader 
          :guild-name="guildName"
          :player-a-name="playerAName"
          :player-b-name="playerBName"
          :total-xp="totalXp" 
          :player-a-balance="playerABalance"
          :player-b-balance="playerBBalance"
          :player-a-contribution="playerAContribution"
          :player-b-contribution="playerBContribution"
          :is-synergy-active="isSynergyActive"
          :active-player="activePlayer"
          :is-offline="isOffline"
          mode="full"
          style="margin-bottom: 1rem;"
        />

        <!-- 過去 7 天養成足跡 (從任務頁面移至此處，置於大看板下方) -->
        <div class="streaks-footprints-card game-card" style="margin-bottom: 1rem;">
          <div class="streaks-header">
            <span class="streaks-title">🗓️ 過去 7 天養成足跡</span>
            <span class="streaks-subtitle font-title">PAST 7 DAYS STREAKS</span>
          </div>
          
          <div class="streaks-dots-container">
            <div 
              v-for="day in past7DaysStats" 
              :key="day.date" 
              class="streak-dot-wrapper"
              :title="`${day.date} 完成：${playerAName} ${day.doneA}/${day.totalA}，${playerBName} ${day.doneB}/${day.totalB}`"
            >
              <div 
                class="streak-dot"
                :class="{ 
                  'dot-perfect': day.pctA === 100 && day.pctB === 100,
                  'dot-combo-active': day.combo,
                  'dot-partial': (day.pctA > 0 || day.pctB > 0) && !(day.pctA === 100 && day.pctB === 100),
                  'dot-empty': day.pctA === 0 && day.pctB === 0 
                }"
              >
                <!-- 完美日（雙方皆 100% 完成）顯示金星 -->
                <span v-if="day.pctA === 100 && day.pctB === 100" class="dot-perfect-symbol">⭐</span>
                <span v-else-if="day.pctA === 0 && day.pctB === 0" class="dot-empty-txt">⚪</span>
                
                <!-- 非完美日，只要有進度，均如實顯示雙方進度比例條 -->
                <div v-if="!(day.pctA === 100 && day.pctB === 100) && (day.pctA > 0 || day.pctB > 0)" class="partial-bars">
                  <div class="partial-bar bar-a" :style="{ height: `${day.pctA}%` }"></div>
                  <div class="partial-bar bar-b" :style="{ height: `${day.pctB}%` }"></div>
                </div>

                <!-- Combo（喝水共鳴）小型右上掛飾，不影響進度條顯示 -->
                <span v-if="day.combo && !(day.pctA === 100 && day.pctB === 100)" class="dot-mini-lightning">⚡</span>
              </div>
              <span class="streak-day-label">{{ formatLocalDate(day.date) }}</span>
            </div>
          </div>
        </div>

        <HistoryPanel 
          :logs="logs"
          :quests="quests"
          :milestones="milestones"
          :shop-items="shopItems"
          :player-a-name="playerAName"
          :player-b-name="playerBName"
          mode="reports"
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

        <!-- 2.0 新增：⚙️ 測試模擬沙箱 (TEST SANDBOX) -->
        <div class="debug-sandbox-card game-card">
          <h3 class="debug-title text-neon-gold">⚙️ 測試模擬沙箱 (TEST SANDBOX)</h3>
          <p class="debug-desc">此區塊提供一鍵模擬加分、卡片生成，方便您在日常尚未完成時快速體驗商店兌換、寫卡片送禮與扭蛋盲盒功能。</p>
          
          <div v-if="!activePlayer" class="debug-alert">
            💡 請先在上方登入一個玩家身分 (萱或至)，才能進行模擬點數測試。
          </div>
          <div v-else class="debug-actions-grid">
            <button 
              class="btn-debug" 
              :disabled="activeDebugAction !== null" 
              @click="debugAddXP(100, 'xp100')"
            >
              {{ activeDebugAction === 'xp100' ? '⚡ 正在加點...' : '💰 獲得 +100 XP (測試扭蛋)' }}
            </button>
            <button 
              class="btn-debug" 
              :disabled="activeDebugAction !== null" 
              @click="debugAddXP(500, 'xp500')"
            >
              {{ activeDebugAction === 'xp500' ? '⚡ 正在加點...' : '👑 獲得 +500 XP (快速升級)' }}
            </button>
            <button 
              class="btn-debug btn-debug-accent" 
              :disabled="activeDebugAction !== null" 
              @click="debugCreateTestGift"
            >
              {{ activeDebugAction === 'gift' ? '⚡ 正在接收...' : '🎁 收到測試卡片' }}
            </button>
            <button 
              class="btn-debug btn-debug-danger" 
              :disabled="activeDebugAction !== null" 
              @click="debugClearAllLogs"
            >
              {{ activeDebugAction === 'clear' ? '🧹 正在清空試算表與數據...' : '🧹 一鍵清空所有歷史紀錄' }}
            </button>
          </div>
        </div>
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
          :class="{ 'nav-active': currentNavTab === 'reports' }" 
          @click="currentNavTab = 'reports'"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span>報告</span>
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
const gifts = ref<any[]>([])
const logs = ref<any[]>([])
const configData = ref<Record<string, any>>({})

const isLoading = ref(true)
const isOffline = ref(false)
const isSavingConfig = ref(false)
const isRedeeming = ref(false)
const errorMessage = ref('')
const warningMessage = ref('')
const activeDebugAction = ref<'xp100' | 'xp500' | 'gift' | 'clear' | null>(null)

// 分頁選取 ('quests' | 'shop' | 'ledger' | 'reports' | 'settings')
const currentNavTab = ref<'quests' | 'shop' | 'ledger' | 'reports' | 'settings'>('quests')

// 監聽分頁切換，自動將視窗滾動置頂，提供順暢的 App 切換體驗
watch(currentNavTab, () => {
  window.scrollTo(0, 0)
})

// 本地身分變數 (響應式)
const activePlayer = ref<'A' | 'B' | null>(null)
const lastSavedPlayer = ref<'A' | 'B' | null>(null)

// 系統參數
const guildName = computed(() => configData.value.GuildName || '雙人夢想解鎖板')
const playerAName = computed(() => configData.value.PlayerAName || '萱')
const playerBName = computed(() => configData.value.PlayerBName || '至')
const comboCategory = computed(() => configData.value.ComboCategory || '飲水')
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
    .filter(l => l.Player === 'A' && parseToLocalDateStr(l.Date) === todayStr && !l.IsSkipPass && quests.value.some(q => q.Id === l.QuestId))
    .map(l => l.QuestId)
})

const completedQuestsBToday = computed(() => {
  if (hasSkippedB.value) {
    return quests.value.filter(q => (q.Player === 'B' || q.Player === 'Both') && q.Active).map(q => q.Id)
  }
  return logs.value
    .filter(l => l.Player === 'B' && parseToLocalDateStr(l.Date) === todayStr && !l.IsSkipPass && quests.value.some(q => q.Id === l.QuestId))
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
  const aDoneCombo = completedQuestsAToday.value.some(id => {
    const q = quests.value.find(quest => quest.Id === id)
    return q?.Category === comboCategory.value
  }) || hasSkippedA.value

  const bDoneCombo = completedQuestsBToday.value.some(id => {
    const q = quests.value.find(quest => quest.Id === id)
    return q?.Category === comboCategory.value
  }) || hasSkippedB.value

  return aDoneCombo && bDoneCombo
})

const formattedTodayDate = computed(() => {
  const d = new Date()
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const date = d.getDate()
  const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const dayName = dayNames[d.getDay()]
  return `${year} 年 ${month} 月 ${date} 日 ${dayName}`
})

const xpEarnedTodayA = computed(() => {
  let sum = 0
  completedQuestsAToday.value.forEach(id => {
    const q = quests.value.find(quest => quest.Id === id)
    if (q) sum += q.XP
  })
  if (isComboActiveToday.value) {
    sum = Math.round(sum * 1.2)
  }
  return sum
})

const xpEarnedTodayB = computed(() => {
  let sum = 0
  completedQuestsBToday.value.forEach(id => {
    const q = quests.value.find(quest => quest.Id === id)
    if (q) sum += q.XP
  })
  if (isComboActiveToday.value) {
    sum = Math.round(sum * 1.2)
  }
  return sum
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
    let hasComboA = false
    let hasComboB = false

    dayLogs.forEach(log => {
      const q = quests.value.find(quest => quest.Id === log.QuestId)
      const isComboTarget = q ? q.Category === comboCategory.value : (log.QuestId.includes('water') || log.QuestId.includes(comboCategory.value.toLowerCase()))
      const isSkip = log.IsSkipPass || log.QuestId === 'skip'

      if (log.Player === 'A' && (isComboTarget || isSkip)) hasComboA = true
      if (log.Player === 'B' && (isComboTarget || isSkip)) hasComboB = true

      dayXp += Number(log.XP) || 0
    })

    if (hasComboA && hasComboB) {
      dayXp = dayXp * 1.2
    }

    sum += dayXp
  })

  return Math.round(sum)
})

// 7. 計算雙方各自的餘額與累計貢獻
const playerStats = computed(() => {
  const logsByDate: Record<string, any[]> = {}
  logs.value.forEach(log => {
    if (log.QuestId.startsWith('redeem_')) return
    const localDateStr = parseToLocalDateStr(log.Date)
    if (!logsByDate[localDateStr]) {
      logsByDate[localDateStr] = []
    }
    logsByDate[localDateStr].push(log)
  })

  let aEarned = 0
  let bEarned = 0

  Object.entries(logsByDate).forEach(([date, dayLogs]) => {
    let aDayXp = 0
    let bDayXp = 0
    let hasComboA = false
    let hasComboB = false

    dayLogs.forEach(log => {
      const q = quests.value.find(quest => quest.Id === log.QuestId)
      const isComboTarget = q ? q.Category === comboCategory.value : (log.QuestId.includes('water') || log.QuestId.includes(comboCategory.value.toLowerCase()))
      const isSkip = log.IsSkipPass || log.QuestId === 'skip'

      if (log.Player === 'A' && (isComboTarget || isSkip)) hasComboA = true
      if (log.Player === 'B' && (isComboTarget || isSkip)) hasComboB = true

      if (log.Player === 'A') {
        aDayXp += Number(log.XP) || 0
      } else if (log.Player === 'B') {
        bDayXp += Number(log.XP) || 0
      }
    })

    if (hasComboA && hasComboB) {
      aDayXp = aDayXp * 1.2
      bDayXp = bDayXp * 1.2
    }

    aEarned += aDayXp
    bEarned += bDayXp
  })

  // 累加所有的兌換扣點數（通常為負數）
  const aSpent = logs.value
    .filter(log => log.Player === 'A' && log.QuestId.startsWith('redeem_'))
    .reduce((acc, log) => acc + (Number(log.XP) || 0), 0)

  const bSpent = logs.value
    .filter(log => log.Player === 'B' && log.QuestId.startsWith('redeem_'))
    .reduce((acc, log) => acc + (Number(log.XP) || 0), 0)

  const aContribution = Math.round(aEarned)
  const bContribution = Math.round(bEarned)
  const aBalance = Math.max(aContribution + aSpent, 0)
  const bBalance = Math.max(bContribution + bSpent, 0)

  return {
    aContribution,
    bContribution,
    aBalance,
    bBalance
  }
})

const playerABalance = computed(() => playerStats.value.aBalance)
const playerBBalance = computed(() => playerStats.value.bBalance)
const playerAContribution = computed(() => playerStats.value.aContribution)
const playerBContribution = computed(() => playerStats.value.bContribution)

const currentBalance = computed(() => {
  if (activePlayer.value === 'A') return playerABalance.value
  if (activePlayer.value === 'B') return playerBBalance.value
  return 0
})

// 偵測今天是否雙方都有打卡完成 (啟動默契共鳴)
const isSynergyActive = computed(() => {
  const todayStr = getTodayDateStr()
  
  const aDone = logs.value.some(l => 
    l.Player === 'A' && 
    parseToLocalDateStr(l.Date) === todayStr && 
    !l.IsSkipPass && 
    !l.QuestId.startsWith('redeem_')
  )
  
  const bDone = logs.value.some(l => 
    l.Player === 'B' && 
    parseToLocalDateStr(l.Date) === todayStr && 
    !l.IsSkipPass && 
    !l.QuestId.startsWith('redeem_')
  )
  
  return aDone && bDone
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
    gifts.value = data.gifts || []
    logs.value = data.logs || []
    configData.value = data.config || {}
    isOffline.value = !!data.offline
    
    if (data.warning) {
      warningMessage.value = data.warning
    }
    if (data.error) {
      errorMessage.value = data.error
    }

    // 記錄上次 XP 值，用於打卡解鎖判定
    lastXpVal = totalXp.value

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

// 2.0 新增：自定義計算過去七天進度與足跡
const past7DaysStats = computed(() => {
  const stats = []
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    const dayLogs = logs.value.filter(l => parseToLocalDateStr(l.Date) === dateStr)
    const hasSkippedA = dayLogs.some(l => l.Player === 'A' && l.QuestId === 'skip')
    const hasSkippedB = dayLogs.some(l => l.Player === 'B' && l.QuestId === 'skip')
    
    const totalA = quests.value.filter(q => (q.Player === 'A' || q.Player === 'Both') && q.Active).length
    const totalB = quests.value.filter(q => (q.Player === 'B' || q.Player === 'Both') && q.Active).length
    
    let doneA = dayLogs.filter(l => l.Player === 'A' && !l.IsSkipPass && !l.QuestId.startsWith('redeem_')).length
    let doneB = dayLogs.filter(l => l.Player === 'B' && !l.IsSkipPass && !l.QuestId.startsWith('redeem_')).length
    
    if (hasSkippedA) doneA = totalA
    if (hasSkippedB) doneB = totalB
    
    const pctA = totalA > 0 ? (doneA / totalA) * 100 : 0
    const pctB = totalB > 0 ? (doneB / totalB) * 100 : 0
    
    const comboCompletedA = dayLogs.some(l => l.Player === 'A' && !l.IsSkipPass && quests.value.find(q => q.Id === l.QuestId)?.Category === comboCategory.value) || hasSkippedA
    const comboCompletedB = dayLogs.some(l => l.Player === 'B' && !l.IsSkipPass && quests.value.find(q => q.Id === l.QuestId)?.Category === comboCategory.value) || hasSkippedB
    const combo = comboCompletedA && comboCompletedB
    
    stats.push({
      date: dateStr,
      doneA,
      totalA,
      pctA,
      doneB,
      totalB,
      pctB,
      combo
    })
  }
  return stats
})

function formatLocalDate(dateVal: any): string {
  const localStr = parseToLocalDateStr(dateVal)
  if (!localStr) return ''
  const parts = localStr.split('-')
  if (parts.length >= 3) {
    return `${parts[1]}/${parts[2]}`
  }
  return localStr
}

// 2.0 新增：⚙️ 測試沙箱工具功能 (導入樂觀更新技術以提供 0ms 極致無延遲體驗，並配合 activeDebugAction 鎖定防範 Race Condition)
async function debugAddXP(amount: number, actionKey: 'xp100' | 'xp500') {
  if (!activePlayer.value || activeDebugAction.value) return
  activeDebugAction.value = actionKey
  
  // 1. 樂觀更新：立刻在前端暫存寫入一筆臨時日誌，讓點數和圓點數值在 0 毫秒內同步反應！
  const tempId = 'debug_xp_temp_' + Date.now()
  logs.value.push({
    Timestamp: new Date().toISOString(),
    Date: todayStr,
    Player: activePlayer.value,
    QuestId: tempId,
    XP: amount,
    IsSkipPass: false
  })
  
  triggerConfetti()
  
  try {
    // 2. 背景默默向後端發送寫入請求 (約需要 2 秒連動 Sheets)
    await $fetch<any>('/api/sync-quest', {
      method: 'POST',
      body: {
        player: activePlayer.value,
        questId: 'debug_xp_' + Date.now(),
        date: todayStr,
        completed: true,
        xp: amount
      }
    })
    // 3. 成功後重新載入並覆蓋，確保資料最終一致性
    await fetchAllData()
  } catch (err: any) {
    // 4. 若失敗則回滾
    logs.value = logs.value.filter(l => l.QuestId !== tempId)
    alert(`Debug 加點失敗: ${err.message}`)
  } finally {
    activeDebugAction.value = null
  }
}

async function debugCreateTestGift() {
  if (!activePlayer.value || activeDebugAction.value) return
  activeDebugAction.value = 'gift'
  
  const buyer = activePlayer.value
  const partner = buyer === 'A' ? 'B' : 'A'
  const tempGiftId = 'debug_gift_temp_' + Date.now()
  
  // 1. 樂觀更新：在 0ms 內在您的卡盒裡直接顯示未使用的卡片！
  gifts.value.push({
    Id: tempGiftId,
    Sender: partner,
    Receiver: buyer,
    RewardName: '☕ 測試愛心咖啡卡',
    Message: '這是一張由開發沙箱產生的測試卡片！點選使用看看吧！',
    Timestamp: new Date().toISOString(),
    Used: false,
    AttachedXp: 0
  })
  
  triggerConfetti()
  
  try {
    // 2. 背景發送
    await $fetch<any>('/api/send-gift', {
      method: 'POST',
      body: {
        sender: partner,
        receiver: buyer,
        rewardName: '☕ 測試愛心咖啡卡',
        message: '這是一張由開發沙箱產生的測試卡片！點選使用看看吧！',
        xp: 0,
        tier: 99,
        attachedXp: 0
      }
    })
    await fetchAllData()
  } catch (err: any) {
    // 3. 失敗則回滾
    gifts.value = gifts.value.filter(g => g.Id !== tempGiftId)
    alert(`Debug 生成禮物卡失敗: ${err.message}`)
  } finally {
    activeDebugAction.value = null
  }
}

async function debugClearAllLogs() {
  if (activeDebugAction.value) return
  if (!confirm('⚠️ 確定要清空所有交易、打卡與請假歷史紀錄嗎？清空後錢包會歸零重置。')) return
  activeDebugAction.value = 'clear'
  
  // 1. 樂觀更新：在 0ms 內清空前端數值，讓所有點數和歷史在眼前瞬間消失，體驗乾淨俐落！
  const oldLogs = [...logs.value]
  const oldGifts = [...gifts.value]
  logs.value = []
  gifts.value = []
  
  try {
    // 2. 進行後端與試算表清空 (在線上模式下會實時清空 Google Sheets 工作表)
    const res = await $fetch<any>('/api/reset-db', {
      method: 'POST'
    })
    
    if (res.error) {
      // 失敗回滾
      logs.value = oldLogs
      gifts.value = oldGifts
      alert(res.error)
      return
    }
    
    // 3. 資料重新載入對齊
    await fetchAllData()
    // 4. 時序正確：確認後端也清除乾淨後，最後才跳出提示
    alert('🧹 本地模擬資料庫與雲端 Google Sheets (若為線上) 已成功重置歸零！')
  } catch (err: any) {
    // 失敗回滾
    logs.value = oldLogs
    gifts.value = oldGifts
    alert(`Debug 重置資料庫失敗: ${err.message}`)
  } finally {
    activeDebugAction.value = null
  }
}



// 14. 登入與登出身分
function loginPlayer(player: 'A' | 'B') {
  activePlayer.value = player
  lastSavedPlayer.value = player
  localStorage.setItem('wishcraft_player', player)
}

function logoutPlayer() {
  activePlayer.value = null
  localStorage.removeItem('wishcraft_player')
}

// 0ms 原地切換身分，不返回歡迎頁，大幅優化切換體驗
function togglePlayer() {
  if (activePlayer.value === 'A') {
    loginPlayer('B')
  } else if (activePlayer.value === 'B') {
    loginPlayer('A')
  }
}

onMounted(() => {
  // 1. 優先判斷網址 query 參數
  const p = route.query.player
  if (p === 'A' || p === 'B') {
    activePlayer.value = p
    lastSavedPlayer.value = p
    localStorage.setItem('wishcraft_player', p)
  } else {
    // 2. 其次從本地 localStorage 讀取
    const saved = localStorage.getItem('wishcraft_player')
    if (saved === 'A' || saved === 'B') {
      activePlayer.value = saved as 'A' | 'B'
      lastSavedPlayer.value = saved as 'A' | 'B'
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

.dashboard-content {
  padding-top: 65px; /* 留出頂部固定 Slim Header 的空間，防止重疊 */
}

/* 今日得點與日期狀態列 */
.today-summary-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1.25rem;
  margin-bottom: 1.25rem;
  background: rgba(20, 24, 35, 0.5);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.today-date-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.calendar-icon {
  font-size: 1.15rem;
}

.date-text {
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
}

.today-points-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.xp-pill {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  white-space: nowrap;
}

.xp-pill.pill-a {
  background: rgba(157, 78, 221, 0.12);
  border: 1px solid rgba(157, 78, 221, 0.25);
  color: #c8b6ff;
}

.xp-pill.pill-b {
  background: rgba(0, 180, 216, 0.12);
  border: 1px solid rgba(0, 180, 216, 0.25);
  color: #caf0f8;
}

.combo-bonus-glow {
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--neon-gold);
  background: rgba(255, 183, 3, 0.12);
  border: 1px solid rgba(255, 183, 3, 0.3);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  animation: gold-pulse 2s infinite ease-in-out;
}

@keyframes gold-pulse {
  0% { box-shadow: 0 0 5px rgba(255, 183, 3, 0.2); }
  50% { box-shadow: 0 0 12px rgba(255, 183, 3, 0.5); }
  100% { box-shadow: 0 0 5px rgba(255, 183, 3, 0.2); }
}

@media (max-width: 768px) {
  .today-summary-bar {
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
    padding: 0.75rem 1rem;
  }
  .today-points-info {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
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

/* 🗓️ 過去 7 天養成足跡樣式 */
.streaks-footprints-card {
  margin-bottom: 1.5rem;
  padding: 1rem 1.25rem;
  border-top: 2px solid var(--neon-gold);
}

.streaks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.85rem;
}

.streaks-title {
  font-size: 0.85rem;
  font-weight: 800;
  color: #fff;
}

.streaks-subtitle {
  font-size: 0.55rem;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.streaks-dots-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.streak-dot-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  flex: 1;
}

.streak-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  /* 允許右上角小閃電溢出顯示 */
  overflow: visible;
  transition: var(--transition-smooth);
}

.dot-empty-txt {
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.1);
}

.streak-day-label {
  font-family: var(--font-title);
  font-size: 0.65rem;
  color: var(--text-muted);
  font-weight: bold;
}

/* 完美日（雙方皆 100% 完成）樣式 */
.dot-perfect {
  background: linear-gradient(135deg, rgba(255, 183, 3, 0.22), rgba(255, 92, 141, 0.22)) !important;
  border-color: var(--neon-gold) !important;
  box-shadow: 0 0 10px rgba(255, 183, 3, 0.4), inset 0 0 5px rgba(255, 183, 3, 0.2) !important;
  animation: synergy-pulse-anim 3s infinite ease-in-out;
}

.dot-perfect-symbol {
  font-size: 0.85rem;
  filter: drop-shadow(0 0 3px var(--neon-gold));
  line-height: 1;
}

/* Combo 啟動時的金色微光邊緣 */
.dot-combo-active {
  border-color: rgba(255, 183, 3, 0.6) !important;
  box-shadow: 0 0 6px rgba(255, 183, 3, 0.25);
}

/* 右上角迷你小閃電掛飾 */
.dot-mini-lightning {
  position: absolute;
  top: -5px;
  right: -5px;
  font-size: 0.55rem;
  filter: drop-shadow(0 0 2px rgba(255, 183, 3, 0.9));
  z-index: 10;
  line-height: 1;
}

/* RWD 手機版養成足跡縮小，防止右側破圖裁切 */
@media (max-width: 480px) {
  .streaks-footprints-card {
    padding: 0.75rem 0.5rem;
    margin-bottom: 1rem;
  }
  .streaks-dots-container {
    gap: 0.2rem;
  }
  .streak-dot {
    width: 22px;
    height: 22px;
  }
  .dot-perfect-symbol {
    font-size: 0.65rem;
  }
  .dot-mini-lightning {
    top: -4px;
    right: -4px;
    font-size: 0.45rem;
  }
  .dot-empty-txt {
    font-size: 0.45rem;
  }
  .streak-day-label {
    font-size: 0.52rem;
    letter-spacing: -0.5px;
  }
}

.dot-lightning {
  font-size: 0.8rem;
  color: var(--neon-gold);
  text-shadow: 0 0 5px var(--neon-gold);
  font-weight: 900;
}

/* 部分完成: 萱與至的進度條左右上升 */
.partial-bars {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  /* 獨立圓形裁切，不干擾父層的小閃電定位 */
  border-radius: 50%;
  overflow: hidden;
}

.partial-bar {
  flex: 1;
  align-self: flex-end;
  transition: height 0.6s ease;
  opacity: 0.6;
}

.bar-a {
  background: var(--neon-purple);
}

.bar-b {
  background: var(--neon-blue);
}

@keyframes synergy-pulse-anim {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* ⚙️ 測試沙箱樣式 */
.debug-sandbox-card {
  margin-top: 1.5rem;
  border-top: 2px solid var(--neon-purple);
}

.debug-title {
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 900;
  margin-bottom: 0.5rem;
}

.debug-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin-bottom: 1.25rem;
}

.debug-alert {
  padding: 0.75rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: center;
}

.debug-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.btn-debug {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  border-radius: 8px;
  padding: 0.6rem;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-smooth);
  text-align: center;
}

.btn-debug:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.btn-debug-accent {
  border-color: rgba(157, 78, 221, 0.3);
  color: #c8b6ff;
}

.btn-debug-accent:hover {
  background: rgba(157, 78, 221, 0.08);
  border-color: var(--neon-purple);
  color: #fff;
}

.btn-debug-danger {
  border-color: rgba(255, 77, 109, 0.3);
  color: #ff4d6d;
}

.btn-debug-danger:hover {
  background: rgba(255, 77, 109, 0.08);
  border-color: #ff4d6d;
  color: #fff;
}

/* 返回儀表板按鈕樣式 */
.return-dashboard-wrapper {
  margin-top: 2.2rem;
  display: flex;
  justify-content: center;
  animation: fadeIn 0.5s ease-in-out;
}

.btn-return-dashboard {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.6rem 1.25rem;
  border-radius: 20px;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-return-dashboard:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--neon-gold);
  color: #fff;
  box-shadow: 0 0 8px rgba(255, 183, 3, 0.15);
}
</style>
