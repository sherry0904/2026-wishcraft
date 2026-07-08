<template>
  <div class="guild-dashboard" :class="{ 'pb-nav': activePlayer }">
    <!-- 2.0 新增：高質感全域 Toast 提示 -->
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" class="toast-item" :class="`toast-${toast.type}`">
        <span class="toast-icon">{{ toast.icon }}</span>
        <span class="toast-msg">{{ toast.message }}</span>
      </div>
    </div>

    <!-- 讀取中遮罩 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-scanner">
        <div class="scanner-text">CONNECTING TO WISHCRAFT SERVER...</div>
        <div class="scanner-bar"></div>
      </div>
    </div>

    <!-- 離線錯誤畫面 -->
    <div v-else-if="isOffline" class="offline-error-screen">
      <div class="error-container">
        <svg class="error-icon float-animation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <h1 class="error-title">系統連線失敗</h1>
        <p class="error-desc">無法與伺服器取得聯繫。為確保您的任務進度能正確保存，系統已暫停操作。<br>請檢查網路連線或是後端系統設定。</p>
        <button class="btn-retry" @click="retryConnection">重新連線</button>
      </div>
    </div>

    <!-- 情況 A：尚未選擇身分，顯示角色登入選取畫面 -->
    <div v-else-if="!activePlayer" class="character-select-screen">
      <div class="select-header">
        <h1 class="select-logo">WISHCRAFT</h1>
        <p class="select-subtitle">選擇您的身分</p>
      </div>

      <div class="characters-grid">
        <!-- 角色 A：萱 -->
        <div class="char-card char-card-a" @click="loginPlayer('A')">
          <div class="char-avatar avatar-large-a">{{ (playerAName || 'A').charAt(0) }}</div>
          <h2 class="char-name">{{ playerAName }}</h2>
          <span class="char-role">ADVENTURER A</span>
        </div>

        <!-- 角色 B：至 -->
        <div class="char-card char-card-b" @click="loginPlayer('B')">
          <div class="char-avatar avatar-large-b">{{ (playerBName || 'B').charAt(0) }}</div>
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
        <!-- 日期導航切換與雙人已獲得點數看板 -->
        <div class="today-summary-bar">
          <div class="summary-bar-top">
            <div class="date-navigator">
              <button 
                class="btn-date-nav" 
                :disabled="isSelectedDateLimit"
                @click="changeSelectedDate(-1)"
                title="前一天"
              >
                ◀
              </button>
              <span class="date-text">
                {{ formattedSelectedDate }}
                <span class="date-offset-badge" :class="{ 'badge-readonly': isReadOnly }">
                  {{ dateOffsetLabel }}
                </span>
                <span v-if="isReadOnly" class="lock-icon" title="已超過 3 天編輯期限，僅供檢視">🔒</span>
              </span>
              <button 
                class="btn-date-nav" 
                :disabled="isSelectedDateToday"
                @click="changeSelectedDate(1)"
                title="後一天"
              >
                ▶
              </button>
            </div>
          </div>

          <div class="summary-bar-bottom">
            <div class="daily-points-display">
              <span class="daily-points-label">日得點</span>
              <div class="daily-points-values">
                <div class="point-item">
                  <span class="point-avatar avatar-small-a">{{ (playerAName || 'A').charAt(0) }}</span>
                  <span class="point-num text-neon-purple">+{{ xpEarnedTodayA }}</span>
                </div>
                <div class="point-item">
                  <span class="point-avatar avatar-small-b">{{ (playerBName || 'B').charAt(0) }}</span>
                  <span class="point-num text-neon-blue">+{{ xpEarnedTodayB }}</span>
                </div>
              </div>
              <span v-if="isComboActiveToday" class="mini-combo-badge">⚡ COMBO {{ getDayMultiplier(activeCombosToday.length) }}x</span>
            </div>
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
          :all-combo-categories="comboCategories"
          :active-combos="activeCombosToday"
          :is-offline="isOffline"
          :is-read-only="isReadOnly"
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
          :is-read-only="isReadOnly"
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
          :combo-categories="comboCategories"
          mode="ledger"
        />
      </div>

      <!-- 3.5 養成報告分頁 (2.0 新增) -->
      <div v-if="currentNavTab === 'reports'" class="tab-view-content">

        <!-- 🔥 連勝天數卡 -->
        <div class="streak-card game-card">
          <div class="streak-card-header">
            <span class="streak-card-title">🔥 養成連勝</span>
            <span class="streak-card-subtitle font-title">DAILY STREAK</span>
          </div>
          <div class="streak-players-row">
            <!-- 玩家 A -->
            <div class="streak-player-block">
              <div class="streak-player-name">{{ playerAName }}</div>
              <div class="streak-count" :class="playerAStreak >= 7 ? 'streak-legendary' : playerAStreak >= 3 ? 'streak-hot' : 'streak-cold'">
                {{ playerAStreak }}
              </div>
              <div class="streak-unit">連續天數</div>
              <div class="streak-flames">
                <span v-for="n in Math.min(playerAStreak, 7)" :key="n">🔥</span>
                <span v-if="playerAStreak === 0" class="streak-cold-txt">尚未開始</span>
              </div>
            </div>

            <!-- 分隔 -->
            <div class="streak-vs">VS</div>

            <!-- 玩家 B -->
            <div class="streak-player-block">
              <div class="streak-player-name">{{ playerBName }}</div>
              <div class="streak-count" :class="playerBStreak >= 7 ? 'streak-legendary' : playerBStreak >= 3 ? 'streak-hot' : 'streak-cold'">
                {{ playerBStreak }}
              </div>
              <div class="streak-unit">連續天數</div>
              <div class="streak-flames">
                <span v-for="n in Math.min(playerBStreak, 7)" :key="n">🔥</span>
                <span v-if="playerBStreak === 0" class="streak-cold-txt">尚未開始</span>
              </div>
            </div>
          </div>

          <!-- 激勵語句 -->
          <div class="streak-motivation">
            <span v-if="playerAStreak >= 7 || playerBStreak >= 7">🏆 超過 7 天連勝！傳說等級的習慣養成！</span>
            <span v-else-if="playerAStreak >= 3 || playerBStreak >= 3">💪 連勝中，別讓火焰熄滅！</span>
            <span v-else-if="playerAStreak === 0 && playerBStreak === 0">今天完成第一個任務，點燃你們的連勝火焰 🔥</span>
            <span v-else>加油！每天的堅持都在累積能量 ⚡</span>
          </div>
        </div>

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
          :milestones="milestones"
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
        <PushNotificationToggle />
        
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
        <div v-if="isDevMode" class="debug-sandbox-card game-card">
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
              {{ activeDebugAction === 'clear_all' ? '⚡ 正在清除...' : '🧹 一鍵清空所有歷史紀錄' }}
            </button>
          </div>
        </div>

        <div class="app-version-footer" @click="handleVersionClick">
          WishCraft v1.0.0
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
import { ref, computed, onMounted, watch, provide } from 'vue'
import { useRoute } from '#app'

// 2.0 新增：高質感全域 Toast 提示訊息系統
export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'loading' | 'info'
  icon?: string
}

const toasts = ref<Toast[]>([])

function showToast(message: string, type: 'success' | 'error' | 'warning' | 'loading' | 'info' = 'success', duration = 3000) {
  const id = Math.random().toString(36).substring(2, 9)
  let icon = '🔔'
  if (type === 'success') icon = '✅'
  else if (type === 'error') icon = '❌'
  else if (type === 'warning') icon = '⚠️'
  else if (type === 'loading') icon = '⏳'
  else if (type === 'info') icon = '💡'
  
  const toast: Toast = { id, message, type, icon }
  toasts.value.push(toast)
  
  if (type !== 'loading' && duration > 0) {
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }
  return id
}

function removeToast(id: string) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

provide('showToast', showToast)
provide('removeToast', removeToast)
import confetti from 'canvas-confetti'
import type { Quest } from '~/components/QuestBoard.vue'
import type { Milestone } from '~/components/LootDashboard.vue'

// 狀態管理
const route = useRoute()
const apiFetch = useAuthAwareFetch()
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
const isAddingHistory = ref(false)
const activeDebugAction = ref<string | null>(null)

// 開發者模式與連擊隱藏開關
const isDevMode = ref(false)
const versionClickCount = ref(0)
let versionClickTimeout: ReturnType<typeof setTimeout> | null = null

function handleVersionClick() {
  versionClickCount.value++
  if (versionClickCount.value === 5) {
    isDevMode.value = true
    showToast('已開啟開發者沙箱模式！', 'success')
  }
  if (versionClickTimeout) clearTimeout(versionClickTimeout)
  versionClickTimeout = setTimeout(() => {
    versionClickCount.value = 0
  }, 2000)
}

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
const comboCategories = computed(() => {
  const raw = configData.value.ComboCategory
  if (!raw || typeof raw !== 'string') return ['飲水']
  
  return raw
    .split(/[，,]/)
    .map(c => {
      let cleaned = c.replace(/\s*[\uff08\uff09\(\)].*$/, '').trim()
      if (cleaned === '飲水' && quests.value.some(q => q.Category === '補水')) {
        return '補水'
      }
      return cleaned
    })
    .filter(Boolean)
})
const comboCategory = computed(() => comboCategories.value[0] || '飲水')
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
const selectedDateOffset = ref(0) // 0: 今天, -1: 昨天, -2: 前天, -3 到 -6: 更早日期

const selectedDateStr = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + selectedDateOffset.value)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

const isReadOnly = computed(() => {
  // 只允許 3 天內編輯：今天(0)、昨天(-1)、前天(-2)，超過則唯讀鎖定
  return selectedDateOffset.value < -2
})

function changeSelectedDate(delta: number) {
  const nextOffset = selectedDateOffset.value + delta
  // 限制往前最多查閱 7 天（即 offset 在 0 到 -6 之間）
  if (nextOffset <= 0 && nextOffset >= -6) {
    selectedDateOffset.value = nextOffset
  }
}

const isSelectedDateToday = computed(() => selectedDateOffset.value === 0)
const isSelectedDateLimit = computed(() => selectedDateOffset.value === -6)

const dateOffsetLabel = computed(() => {
  if (selectedDateOffset.value === 0) return '今天'
  if (selectedDateOffset.value === -1) return '昨天'
  if (selectedDateOffset.value === -2) return '前天'
  return `${Math.abs(selectedDateOffset.value)} 天前`
})

// 1. 判定雙方在選定日期是否使用請假券 (Skip Pass)
const hasSkippedA = computed(() => {
  return logs.value.some(l => l.Player === 'A' && l.QuestId === 'skip' && parseToLocalDateStr(l.Date) === selectedDateStr.value)
})

const hasSkippedB = computed(() => {
  return logs.value.some(l => l.Player === 'B' && l.QuestId === 'skip' && parseToLocalDateStr(l.Date) === selectedDateStr.value)
})

// 2. 取得雙方在選定日期已完成的任務 ID 列表 (若請假，則視為完成所有任務)
const completedQuestsAToday = computed(() => {
  if (hasSkippedA.value) {
    return quests.value.filter(q => (q.Player === 'A' || q.Player === 'Both') && q.Active).map(q => q.Id)
  }
  return logs.value
    .filter(l => l.Player === 'A' && parseToLocalDateStr(l.Date) === selectedDateStr.value && !l.IsSkipPass && quests.value.some(q => q.Id === l.QuestId))
    .map(l => l.QuestId)
})

const completedQuestsBToday = computed(() => {
  if (hasSkippedB.value) {
    return quests.value.filter(q => (q.Player === 'B' || q.Player === 'Both') && q.Active).map(q => q.Id)
  }
  return logs.value
    .filter(l => l.Player === 'B' && parseToLocalDateStr(l.Date) === selectedDateStr.value && !l.IsSkipPass && quests.value.some(q => q.Id === l.QuestId))
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

// 5. 判斷特定日期各類別 Combo 是否啟動
function getActiveCombosForDate(dateStr: string): string[] {
  const dayLogs = logs.value.filter(l => parseToLocalDateStr(l.Date) === dateStr)
  const hasSkippedA = dayLogs.some(l => l.Player === 'A' && l.QuestId === 'skip')
  const hasSkippedB = dayLogs.some(l => l.Player === 'B' && l.QuestId === 'skip')

  const completedCatsA = new Set<string>()
  if (hasSkippedA) {
    comboCategories.value.forEach(cat => completedCatsA.add(cat))
  } else {
    dayLogs.forEach(l => {
      if (l.Player === 'A' && !l.IsSkipPass && !l.QuestId.startsWith('redeem_')) {
        const q = quests.value.find(quest => quest.Id === l.QuestId)
        if (q?.Category) completedCatsA.add(q.Category.trim())
      }
    })
  }

  const completedCatsB = new Set<string>()
  if (hasSkippedB) {
    comboCategories.value.forEach(cat => completedCatsB.add(cat))
  } else {
    dayLogs.forEach(l => {
      if (l.Player === 'B' && !l.IsSkipPass && !l.QuestId.startsWith('redeem_')) {
        const q = quests.value.find(quest => quest.Id === l.QuestId)
        if (q?.Category) completedCatsB.add(q.Category.trim())
      }
    })
  }

  return comboCategories.value.filter(cat => completedCatsA.has(cat) && completedCatsB.has(cat))
}

const activeCombosToday = computed(() => {
  return getActiveCombosForDate(selectedDateStr.value)
})

const isComboActiveToday = computed(() => activeCombosToday.value.length > 0)

const formattedSelectedDate = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + selectedDateOffset.value)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const date = d.getDate()
  const dayNames = ['日', '一', '二', '三', '四', '五', '六']
  const dayName = dayNames[d.getDay()]
  return `${year}/${month}/${date} (${dayName})`
})

const getDayMultiplier = (comboCount: number): number => {
  if (comboCount === 0) return 1
  return Math.round(Math.pow(1.2, comboCount) * 100) / 100
}

const xpEarnedTodayA = computed(() => {
  let sum = 0
  completedQuestsAToday.value.forEach(id => {
    const q = quests.value.find(quest => quest.Id === id)
    if (q) sum += q.XP
  })
  const mult = getDayMultiplier(activeCombosToday.value.length)
  return Math.round(sum * mult)
})

const xpEarnedTodayB = computed(() => {
  let sum = 0
  completedQuestsBToday.value.forEach(id => {
    const q = quests.value.find(quest => quest.Id === id)
    if (q) sum += q.XP
  })
  const mult = getDayMultiplier(activeCombosToday.value.length)
  return Math.round(sum * mult)
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
    const activeCombos = getActiveCombosForDate(date)
    const mult = getDayMultiplier(activeCombos.length)

    dayLogs.forEach(log => {
      dayXp += Number(log.XP) || 0
    })

    sum += dayXp * mult
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
    const activeCombos = getActiveCombosForDate(date)
    const mult = getDayMultiplier(activeCombos.length)

    dayLogs.forEach(log => {
      if (log.Player === 'A') {
        aDayXp += Number(log.XP) || 0
      } else if (log.Player === 'B') {
        bDayXp += Number(log.XP) || 0
      }
    })

    aEarned += aDayXp * mult
    bEarned += bDayXp * mult
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

// 偵測今天是否有 combo 觸發 (默契共鳴 = 至少一個類別 combo 達成)
const isSynergyActive = computed(() => isComboActiveToday.value)


// 連勝天數計算 (包含使用請假券的天數)
function calcStreak(player: 'A' | 'B'): number {
  const getDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const today = new Date()
  const todayStr = getDateStr(today)

  const hasActivity = (dateStr: string) =>
    logs.value.some(
      l =>
        parseToLocalDateStr(l.Date) === dateStr &&
        l.Player === player &&
        !l.QuestId.startsWith('redeem_')
    )

  // 今天有打卡就從今天算起，否則從昨天開始往回數（今天尚未打卡不中斷連勝）
  const startOffset = hasActivity(todayStr) ? 0 : 1
  let streak = 0
  for (let i = startOffset; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    if (hasActivity(getDateStr(d))) {
      streak++
    } else {
      break
    }
  }
  return streak
}

const playerAStreak = computed(() => calcStreak('A'))
const playerBStreak = computed(() => calcStreak('B'))

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

// 追蹤同步中的請求數，避免樂觀更新被 fetchAllData 覆蓋導致畫面閃爍
const pendingSyncCount = ref(0)

// 防止 fetchAllData 重複並發（setInterval + 手動呼叫可能同時觸發）
let isFetchingData = false

// 序列化 GAS 請求的 Promise chain，防止並發寫入 Sheets 造成 500 衝突
let syncChain: Promise<void> = Promise.resolve()

// 9. 載入資料庫資料
async function fetchAllData(isAutoRefresh = false) {
  if (pendingSyncCount.value > 0) return // 如果有正在同步的請求，先不更新資料以保護樂觀 UI
  if (isFetchingData) return // 防止並發：已有一個 fetchAllData 在飛行中，跳過
  isFetchingData = true

  try {
    const data = await apiFetch<any>('/api/guild-data')
    
    // 如果在等待 API 回傳的期間，使用者點擊了任務（pendingSyncCount > 0），
    // 就必須放棄這次取得的舊資料，以免覆蓋樂觀更新的結果。
    if (pendingSyncCount.value > 0) return
    
    quests.value = data.quests || []
    milestones.value = data.milestones || []
    shopItems.value = data.shopItems || []
    gifts.value = data.gifts || []
    
    const fetchedLogs = data.logs || []
    // 預先計算請假券應得的滿分點數，讓全站 (包含點數存摺與總分) 都能正確加上
    fetchedLogs.forEach((log: any) => {
      if ((log.QuestId === 'skip' || log.IsSkipPass) && (!log.XP || Number(log.XP) === 0)) {
        const playerQuests = quests.value.filter(q => (q.Player === log.Player || q.Player === 'Both') && q.Active)
        log.XP = playerQuests.reduce((sum, q) => sum + q.XP, 0)
      }
    })
    logs.value = fetchedLogs
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
    if (err?.statusCode === 401) return // onResponseError 已處理重導向，此處靜默跳過
    if (!isAutoRefresh) {
      errorMessage.value = '無法連接伺服器 API，請確認後端是否正常運作。'
      isOffline.value = true
    } else {
      console.warn('Auto refresh failed, ignoring to prevent locking UI.', err)
    }
  } finally {
    isLoading.value = false
    isFetchingData = false
  }
}

function retryConnection() {
  isLoading.value = true
  isOffline.value = false
  errorMessage.value = ''
  fetchAllData()
}

// 10. 勾選與取消任務事件
async function onToggleQuest(payload: { questId: string; completed: boolean; xp: number }) {
  if (!activePlayer.value) return

  // 尋找任務名稱
  const quest = quests.value.find(q => q.Id === payload.questId)
  const questName = quest ? quest.Name : '任務'

  // 在進 queue 前截取快照，防止 queue 延遲執行時讀到已改變的 reactive 值
  const playerSnapshot = activePlayer.value
  const dateSnapshot = selectedDateStr.value

  // 1. 前端 UI 立即反應 (樂觀更新)
  const tempLog = {
    Timestamp: new Date().toISOString(),
    Date: dateSnapshot,
    Player: playerSnapshot,
    QuestId: payload.questId,
    XP: payload.xp,
    IsSkipPass: false
  }

  const oldLogs = [...logs.value]

  if (payload.completed) {
    logs.value.push(tempLog)
    showToast(`成功完成【${questName}】！獲得 +${payload.xp} XP ⭐`, 'success')
  } else {
    // 移除所有符合的紀錄，以防有重複的髒資料
    logs.value = logs.value.filter(l => 
      !(parseToLocalDateStr(l.Date) === dateSnapshot && 
        l.Player === playerSnapshot && 
        l.QuestId === payload.questId && 
        !l.IsSkipPass)
    )
    showToast(`已取消【${questName}】的打卡 ↩️`, 'info')
  }

  // 檢查是否升級或觸發里程碑解鎖
  checkMilestoneUnlock(totalXp.value, lastXpVal)
  lastXpVal = totalXp.value

  // 2. 向後端同步（串行排隊，防止並發寫入 GAS/Sheets 造成 500）
  // 使用截取的快照值，不依賴 queue 執行時的 reactive 狀態
  pendingSyncCount.value++
  syncChain = syncChain.then(async () => {
    try {
      const res = await apiFetch<any>('/api/sync-quest', {
        method: 'POST',
        body: {
          player: playerSnapshot,
          questId: payload.questId,
          date: dateSnapshot,
          completed: payload.completed,
          xp: payload.xp
        }
      })
      
      if (res.warning) {
        warningMessage.value = res.warning
        showToast(res.warning, 'warning')
      }
    } catch (err: any) {
      // 同步失敗，回滾到此次操作前的狀態
      logs.value = oldLogs
      lastXpVal = totalXp.value
      errorMessage.value = err.data?.message || '同步任務失敗，已回滾變更。'
      showToast(errorMessage.value, 'error')
    } finally {
      pendingSyncCount.value--
      // 所有請求完成後才做一次 fetchAllData，以伺服器為最終依據
      // （pendingSyncCount 歸零代表 queue 已清空）
      if (pendingSyncCount.value === 0) {
        try {
          await fetchAllData()
        } catch {
          // fetchAllData 失敗不影響 chain，靜默處理
        }
      }
    }
  }).catch(() => {
    // 防止 chain rejection 向後傳播，導致後續排隊的請求被全部丟棄
    // 下一個 .then() 仍會正常執行
  })
}


// 11. 使用請假券事件
async function onUseSkip(player: 'A' | 'B') {
  if (activePlayer.value !== player) return

  const toastId = showToast('正在登錄請假券...', 'loading', 0)

  // 1. 前端樂觀更新
  const playerQuests = quests.value.filter(q => (q.Player === player || q.Player === 'Both') && q.Active)
  const fullXp = playerQuests.reduce((sum, q) => sum + q.XP, 0)

  const tempLog = {
    Timestamp: new Date().toISOString(),
    Date: selectedDateStr.value,
    Player: player,
    QuestId: 'skip',
    XP: fullXp,
    IsSkipPass: true
  }

  const oldLogs = [...logs.value]
  logs.value.push(tempLog)
  
  // 請假可能也會維持 Combo 並可能越過里程碑
  checkMilestoneUnlock(totalXp.value, lastXpVal)
  lastXpVal = totalXp.value

  // 2. 向後端同步
  try {
    const res = await apiFetch<any>('/api/use-skip', {
      method: 'POST',
      body: {
        player: player,
        date: selectedDateStr.value
      }
    })

    removeToast(toastId)
    showToast('已成功使用請假券！今天可以好好休息囉～ 🛋️', 'success')

    if (res.warning) {
      warningMessage.value = res.warning
    }
  } catch (err: any) {
    logs.value = oldLogs
    lastXpVal = totalXp.value
    removeToast(toastId)
    errorMessage.value = err.data?.message || '使用請假券失敗，請重試。'
    showToast(errorMessage.value, 'error')
  }
}

// 12. 儲存公會設定與 AI 提示詞
async function onSaveConfig(payload: { guildName: string; playerAName: string; playerBName: string; aiPrompt: string; weeklyQuota: number }) {
  isSavingConfig.value = true
  const toastId = showToast('正在儲存並同步公會設定...', 'loading', 0)
  
  // 本地更新
  configData.value.GuildName = payload.guildName
  configData.value.PlayerAName = payload.playerAName
  configData.value.PlayerBName = payload.playerBName
  configData.value.AIPrompt = payload.aiPrompt
  configData.value.WeeklyQuota = payload.weeklyQuota

  try {
    const res = await apiFetch<any>('/api/save-config', {
      method: 'POST',
      body: {
        guildName: payload.guildName,
        playerAName: payload.playerAName,
        playerBName: payload.playerBName,
        aiPrompt: payload.aiPrompt,
        weeklyQuota: payload.weeklyQuota
      }
    })
    
    removeToast(toastId)
    showToast('公會設定已成功儲存並同步至 Google Sheets！', 'success')
    
    if (res.warning) {
      warningMessage.value = res.warning
    }
    await fetchAllData()
  } catch (err: any) {
    removeToast(toastId)
    errorMessage.value = err.data?.message || '儲存設定失敗，請重試。'
    showToast(errorMessage.value, 'error')
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
    
    const combo = getActiveCombosForDate(dateStr).length > 0
    
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
    await apiFetch<any>('/api/sync-quest', {
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
    await apiFetch<any>('/api/send-gift', {
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
  activeDebugAction.value = 'clear_all'
  
  // 1. 樂觀更新：在 0ms 內清空前端數值，讓所有點數和歷史在眼前瞬間消失，體驗乾淨俐落！
  const oldLogs = [...logs.value]
  const oldGifts = [...gifts.value]
  logs.value = []
  gifts.value = []
  
  try {
    // 2. 進行後端與試算表清空 (在線上模式下會實時清空 Google Sheets 工作表)
    const res = await apiFetch<any>('/api/reset-db', {
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
  setInterval(() => fetchAllData(true), 30000)
})
</script>

<style scoped>
/* ========== 🔥 連勝天數卡 ========== */
.streak-card {
  margin-bottom: 1rem;
  border-top: 3px solid #ff6b35;
}

.streak-card-header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.streak-card-title {
  font-size: 1rem;
  font-weight: 900;
  color: #fff;
  letter-spacing: 1px;
}

.streak-card-subtitle {
  font-size: 0.6rem;
  letter-spacing: 3px;
  color: var(--text-secondary);
  opacity: 0.8;
}

.streak-players-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.streak-player-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  flex: 1;
}

.streak-player-name {
  font-size: 0.7rem;
  font-weight: 900;
  color: var(--text-secondary);
  letter-spacing: 1px;
}

.streak-count {
  font-family: var(--font-title);
  font-size: 2.8rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 2px;
}

.streak-hot {
  color: #ff6b35;
  text-shadow: 0 0 20px rgba(255, 107, 53, 0.5);
}

.streak-legendary {
  color: var(--neon-gold);
  text-shadow: 0 0 20px rgba(255, 183, 3, 0.6);
  animation: streak-glow 1.5s infinite ease-in-out;
}

.streak-cold {
  color: var(--text-muted);
}

@keyframes streak-glow {
  0%, 100% { text-shadow: 0 0 15px rgba(255, 183, 3, 0.4); }
  50% { text-shadow: 0 0 30px rgba(255, 183, 3, 0.8); }
}

.streak-unit {
  font-size: 0.6rem;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.streak-flames {
  font-size: 0.85rem;
  min-height: 1.2rem;
  letter-spacing: 1px;
}

.streak-cold-txt {
  font-size: 0.6rem;
  color: var(--text-muted);
}

.streak-vs {
  font-family: var(--font-title);
  font-size: 0.65rem;
  color: var(--text-muted);
  letter-spacing: 2px;
  flex-shrink: 0;
}

.streak-motivation {
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-secondary);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 0.75rem;
  line-height: 1.5;
}

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
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem; /* 您可以修改這裡的數值，例如調成 3rem 會更寬鬆 */
}

.summary-bar-top {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.summary-bar-bottom {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.today-date-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 日期導航器樣式 */
.date-navigator {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.btn-date-nav {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  transition: var(--transition-smooth);
}

.btn-date-nav:hover:not(:disabled) {
  background: var(--neon-purple);
  border-color: var(--neon-purple);
  box-shadow: 0 0 8px rgba(157, 78, 221, 0.4);
}

.btn-date-nav:disabled {
  background: rgba(255, 255, 255, 0.01);
  border-color: rgba(255, 255, 255, 0.03);
  color: var(--text-muted);
  cursor: not-allowed;
}

.date-offset-badge {
  font-size: 0.7rem;
  background: rgba(6, 214, 160, 0.15);
  color: var(--neon-green);
  border: 1px solid rgba(6, 214, 160, 0.3);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  margin-left: 0.35rem;
  font-weight: 700;
  vertical-align: middle;
}

.date-offset-badge.badge-readonly {
  background: rgba(255, 183, 3, 0.1);
  color: var(--neon-gold);
  border-color: rgba(255, 183, 3, 0.25);
}

.lock-icon {
  font-size: 0.85rem;
  margin-left: 0.35rem;
  vertical-align: middle;
  opacity: 0.8;
}

.calendar-icon {
  font-size: 1.15rem;
}


.date-text {
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font-family: var(--font-body);
  font-size: 1.25rem;
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.5px;
}

.daily-points-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  width: 100%;
  flex-wrap: wrap;
}

.daily-points-label {
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: 1px;
  white-space: nowrap;
}

.daily-points-values {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.point-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.point-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: 900;
  color: #fff;
}

.avatar-small-a {
  background: linear-gradient(135deg, var(--neon-purple), #5a189a);
}

.avatar-small-b {
  background: linear-gradient(135deg, var(--neon-blue), #0077b6);
}

.point-num {
  font-family: var(--font-title);
  font-size: 1.4rem;
  font-weight: 900;
}

.mini-combo-badge {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--neon-gold);
  background: rgba(255, 183, 3, 0.1);
  border: 1px solid rgba(255, 183, 3, 0.2);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
}

@media (max-width: 768px) {
  .today-summary-bar {
    gap: 1.5rem; /* 在手機版稍微收斂一點，但還是保持寬鬆 */
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
  font-size: 1.1rem;
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

/* ==========================================================================
   2.0 新增：全域 Toast 樣式
   ========================================================================== */
.toast-container {
  position: fixed;
  top: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  pointer-events: none;
  width: 90%;
  max-width: 380px;
}

.toast-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.8rem 1.2rem;
  border-radius: 12px;
  background: rgba(18, 22, 32, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  font-size: 0.85rem;
  font-weight: 500;
  color: #fff;
  pointer-events: auto;
  animation: toast-slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  max-width: 100%;
  word-break: break-word;
}

.toast-success {
  border-color: rgba(6, 214, 160, 0.4);
  box-shadow: 0 4px 15px rgba(6, 214, 160, 0.15);
}

.toast-error {
  border-color: rgba(255, 77, 109, 0.4);
  box-shadow: 0 4px 15px rgba(255, 77, 109, 0.15);
}

.toast-warning {
  border-color: rgba(255, 183, 3, 0.4);
  box-shadow: 0 4px 15px rgba(255, 183, 3, 0.15);
}

.toast-loading {
  border-color: rgba(157, 78, 221, 0.4);
  box-shadow: 0 4px 15px rgba(157, 78, 221, 0.15);
}

.toast-info {
  border-color: rgba(0, 180, 216, 0.4);
  box-shadow: 0 4px 15px rgba(0, 180, 216, 0.15);
}

.toast-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.toast-msg {
  flex-grow: 1;
}

@keyframes toast-slide-in {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 離線錯誤畫面 */
.offline-error-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(10, 10, 15, 0.95);
  backdrop-filter: blur(10px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-container {
  background: rgba(255, 77, 109, 0.05);
  border: 1px solid rgba(255, 77, 109, 0.2);
  border-radius: 20px;
  padding: 3rem 2rem;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 0 40px rgba(255, 77, 109, 0.1);
}

.error-icon {
  width: 60px;
  height: 60px;
  stroke: var(--neon-red);
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 0 10px rgba(255, 77, 109, 0.5));
}

.error-title {
  font-family: var(--font-title);
  font-size: 1.8rem;
  color: var(--neon-red);
  margin-bottom: 1rem;
  letter-spacing: 2px;
}

.error-desc {
  font-family: var(--font-body);
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.btn-retry {
  background: linear-gradient(135deg, var(--neon-red), #c9184a);
  color: #fff;
  border: none;
  padding: 1rem 2.5rem;
  border-radius: 12px;
  font-family: var(--font-title);
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-neon-red);
  transition: var(--transition-smooth);
}

.btn-retry:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(255, 77, 109, 0.6);
}

.app-version-footer {
  text-align: center;
  margin-top: 3rem;
  margin-bottom: 2rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.2);
  letter-spacing: 2px;
  font-family: var(--font-title);
  user-select: none;
  cursor: pointer;
  transition: color 0.3s ease;
}

.app-version-footer:active {
  color: rgba(255, 255, 255, 0.5);
}
</style>
