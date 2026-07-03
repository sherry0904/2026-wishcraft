<template>
  <div class="history-panel">
    <!-- 分頁切換鈕 (置於頂部，多於一個分頁時才顯示) -->
    <div v-if="tabs.length > 1" class="panel-header-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab-btn"
        :class="{ 'tab-active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.name }}
      </button>
    </div>

    <div class="panel-body">
      <!-- 分頁 1：點數存摺 (Ledger) -->
      <div v-if="activeTab === 'logs'" class="tab-content">
        <div class="section-title">點數存摺交易明細 (LEDGER STATEMENTS)</div>
        
        <div v-if="sortedLogs.length === 0" class="empty-history">
          目前點數存摺無任何交易明細。
        </div>
        <div v-else class="ledger-container scrollable-content">
          <div 
            v-for="(log, idx) in sortedLogs" 
            :key="idx" 
            class="ledger-row"
            :class="{ 
              'row-gain': !log.IsSkipPass && !log.QuestId.startsWith('redeem_'),
              'row-loss': log.QuestId.startsWith('redeem_'),
              'row-skip': log.IsSkipPass
            }"
          >
            <!-- 上半部：描述與得失點數 -->
            <div class="ledger-row-top">
              <div class="ledger-desc-text">
                <!-- 情況 A：請假 -->
                <span v-if="log.IsSkipPass" class="text-neon-gold">
                  使用了請假券
                </span>
                <!-- 情況 B：點數商店兌換 -->
                <span v-else-if="log.QuestId.startsWith('redeem_')" class="text-white">
                  兌換：<span class="text-neon-gold">{{ getRedemptionName(log.QuestId) }}</span>
                </span>
                <!-- 情況 C：日常任務完成 -->
                <span v-else class="text-white">
                  {{ getQuestName(log.QuestId) }}
                </span>
              </div>
              
              <div class="ledger-amount-col">
                <span v-if="log.QuestId.startsWith('redeem_')" class="amount-val text-loss">
                  {{ log.XP }}
                </span>
                <span v-else class="amount-val text-gain">
                  +{{ log.XP }}
                </span>
              </div>
            </div>
            
            <!-- 下半部：時間與操作人 -->
            <div class="ledger-row-bottom">
              <span class="ledger-time-badge">
                {{ formatLocalDate(log.Date) }} {{ formatLocalTime(log.Timestamp) }}
              </span>
              <span class="player-tag" :class="log.Player === 'A' ? 'tag-a' : 'tag-b'">
                {{ log.Player === 'A' ? playerAName : playerBName }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分頁 2：日週統計 -->
      <div v-if="activeTab === 'weekly'" class="tab-content">
        <div class="section-title">過去七天完成率 (DAILY COMPLETION RATE)</div>
        
        <div v-if="sortedLogs.length === 0" class="empty-history">
          目前尚無數據可統計。
        </div>
        <div v-else class="weekly-stats-list">
          <div 
            v-for="stat in past7DaysStats" 
            :key="stat.date" 
            class="day-stat-card"
            :class="{ 'combo-bg': stat.comboCount > 0 }"
          >
            <div class="stat-date-info">
              <span class="stat-day">{{ formatLocalDate(stat.date) }}</span>
              <span v-if="stat.comboCount > 0" class="stat-combo-badge float-animation">⚡ COMBO {{ getDayMultiplier(stat.comboCount) }}x</span>
            </div>
            <div class="players-progress-row">
              <div class="player-progress-col">
                <span class="player-small-name text-purple">{{ playerAName }}</span>
                <div class="progress-mini-bar">
                  <div class="progress-fill fill-a" :style="{ width: `${stat.pctA}%` }"></div>
                </div>
                <span class="progress-fraction">{{ stat.doneA }}/{{ stat.totalA }}</span>
              </div>
              
              <div class="player-progress-col">
                <span class="player-small-name text-blue">{{ playerBName }}</span>
                <div class="progress-mini-bar">
                  <div class="progress-fill fill-b" :style="{ width: `${stat.pctB}%` }"></div>
                </div>
                <span class="progress-fraction">{{ stat.doneB }}/{{ stat.totalB }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分頁 3：月度分析 -->
      <div v-if="activeTab === 'monthly'" class="tab-content">
        <div class="section-title">月度累計統計 (MONTHLY ACHIEVEMENTS)</div>
        
        <div v-if="sortedLogs.length === 0" class="empty-history">
          目前尚無月度數據可分析。
        </div>
        <div v-else class="monthly-analytics-list">
          <div v-for="stat in monthlyStats" :key="stat.month" class="month-stat-card">
            <div class="month-header">
              <h3 class="month-title">{{ stat.month }} 養成戰報</h3>
              <span class="month-total-xp">累計賺取: <strong class="text-neon-gold">{{ stat.totalXP }} XP</strong></span>
            </div>
            
            <div class="month-stats-grid">
              <div class="grid-item">
                <span class="grid-label">連擊 COMBO 天數</span>
                <span class="grid-value text-neon-gold">{{ stat.comboDays }} 天</span>
              </div>
              <div class="grid-item">
                <span class="grid-label">{{ playerAName }} 完成任務</span>
                <span class="grid-value text-neon-purple">{{ stat.totalQuestsA }} 次</span>
              </div>
              <div class="grid-item">
                <span class="grid-label">{{ playerBName }} 完成任務</span>
                <span class="grid-value text-neon-blue">{{ stat.totalQuestsB }} 次</span>
              </div>
              <div class="grid-item">
                <span class="grid-label">累計請假次數</span>
                <span class="grid-value text-muted">{{ stat.totalSkips }} 次</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  logs: any[]
  quests: any[]
  milestones: any[]
  shopItems: any[]
  playerAName: string
  playerBName: string
  mode?: 'ledger' | 'reports'
  comboCategories?: string[]
}>()

const tabs = computed(() => {
  if (props.mode === 'ledger') {
    return [
      { id: 'logs', name: '點數存摺明細' }
    ]
  }
  if (props.mode === 'reports') {
    return [
      { id: 'weekly', name: '日週完成率' },
      { id: 'monthly', name: '月度統計戰報' }
    ]
  }
  return [
    { id: 'logs', name: '點數存摺明細' },
    { id: 'weekly', name: '日週完成率' },
    { id: 'monthly', name: '月度統計戰報' }
  ]
})

const activeTab = ref(props.mode === 'reports' ? 'weekly' : 'logs')

// 輔助函數：日期時區修正
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

function getActiveCombosForDate(dateStr: string): string[] {
  const categories = props.comboCategories || ['飲水']
  const dayLogs = props.logs.filter(l => parseToLocalDateStr(l.Date) === dateStr)
  const hasSkippedA = dayLogs.some(l => l.Player === 'A' && l.QuestId === 'skip')
  const hasSkippedB = dayLogs.some(l => l.Player === 'B' && l.QuestId === 'skip')

  const completedCatsA = new Set<string>()
  if (hasSkippedA) {
    categories.forEach(cat => completedCatsA.add(cat))
  } else {
    dayLogs.forEach(l => {
      if (l.Player === 'A' && !l.IsSkipPass && !l.QuestId.startsWith('redeem_')) {
        const q = props.quests.find(quest => quest.Id === l.QuestId)
        if (q?.Category) completedCatsA.add(q.Category.trim())
      }
    })
  }

  const completedCatsB = new Set<string>()
  if (hasSkippedB) {
    categories.forEach(cat => completedCatsB.add(cat))
  } else {
    dayLogs.forEach(l => {
      if (l.Player === 'B' && !l.IsSkipPass && !l.QuestId.startsWith('redeem_')) {
        const q = props.quests.find(quest => quest.Id === l.QuestId)
        if (q?.Category) completedCatsB.add(q.Category.trim())
      }
    })
  }

  return categories.filter(cat => completedCatsA.has(cat) && completedCatsB.has(cat))
}

function getDayMultiplier(comboCount: number): number {
  if (comboCount === 0) return 1
  return Math.round(Math.pow(1.2, comboCount) * 100) / 100
}

function formatLocalDate(dateVal: any): string {
  const localStr = parseToLocalDateStr(dateVal)
  if (!localStr) return ''
  const parts = localStr.split('-')
  if (parts.length >= 3) {
    return `${parts[1]}/${parts[2]}`
  }
  return localStr
}

function formatLocalTime(timestamp: string): string {
  if (!timestamp) return ''
  try {
    const d = new Date(timestamp)
    const hrs = String(d.getHours()).padStart(2, '0')
    const mins = String(d.getMinutes()).padStart(2, '0')
    return `${hrs}:${mins}`
  } catch {
    return ''
  }
}

function getQuestName(questId: string): string {
  if (questId === 'skip') return '請假券'
  const q = props.quests.find(x => x.Id === questId)
  return q ? q.Name : questId
}

function getRedemptionName(questId: string): string {
  const tierStr = questId.replace('redeem_tier_', '')
  const tier = Number(tierStr)
  const item = props.shopItems.find(m => m.Tier === tier)
  return item ? item.RewardName : '獎勵解鎖'
}

const sortedLogs = computed(() => {
  return [...props.logs].sort((a, b) => {
    return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
  })
})

const past7DaysStats = computed(() => {
  const stats = []
  const today = new Date()
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    const dayLogs = props.logs.filter(l => parseToLocalDateStr(l.Date) === dateStr)
    const hasSkippedA = dayLogs.some(l => l.Player === 'A' && l.QuestId === 'skip')
    const hasSkippedB = dayLogs.some(l => l.Player === 'B' && l.QuestId === 'skip')
    
    const totalA = props.quests.filter(q => (q.Player === 'A' || q.Player === 'Both') && q.Active).length
    const totalB = props.quests.filter(q => (q.Player === 'B' || q.Player === 'Both') && q.Active).length
    
    let doneA = dayLogs.filter(l => l.Player === 'A' && !l.IsSkipPass && !l.QuestId.startsWith('redeem_')).length
    let doneB = dayLogs.filter(l => l.Player === 'B' && !l.IsSkipPass && !l.QuestId.startsWith('redeem_')).length
    
    if (hasSkippedA) doneA = totalA
    if (hasSkippedB) doneB = totalB
    
    const pctA = totalA > 0 ? (doneA / totalA) * 100 : 0
    const pctB = totalB > 0 ? (doneB / totalB) * 100 : 0
    
    const activeCombos = getActiveCombosForDate(dateStr)
    const comboCount = activeCombos.length
    
    stats.push({
      date: dateStr,
      doneA,
      totalA,
      pctA,
      doneB,
      totalB,
      pctB,
      comboCount
    })
  }
  return stats
})

const monthlyStats = computed(() => {
  const map: Record<string, MonthStat> = {}
  
  const logsByDate: Record<string, any[]> = {}
  props.logs.forEach(log => {
    const dateStr = parseToLocalDateStr(log.Date)
    if (!logsByDate[dateStr]) logsByDate[dateStr] = []
    logsByDate[dateStr].push(log)
  })

  Object.keys(logsByDate).forEach(dateStr => {
    const monthStr = dateStr.substring(0, 7) // YYYY-MM
    if (!map[monthStr]) {
      map[monthStr] = {
        month: monthStr,
        totalXP: 0,
        totalQuestsA: 0,
        totalQuestsB: 0,
        totalSkips: 0,
        comboDays: 0
      }
    }
    
    const dayLogs = logsByDate[dateStr]
    const mStat = map[monthStr]
    
    const hasCombo = getActiveCombosForDate(dateStr).length > 0
    
    if (hasCombo) {
      mStat.comboDays += 1
    }
    
    let dayXp = 0
    const activeCombos = getActiveCombosForDate(dateStr)
    const mult = getDayMultiplier(activeCombos.length)
    dayLogs.forEach(l => {
      if (l.QuestId === 'skip') {
        mStat.totalSkips += 1
      } else if (l.QuestId.startsWith('redeem_')) {
        // 兌換扣點不計入「月度賺取」
      } else {
        if (l.Player === 'A') mStat.totalQuestsA += 1
        if (l.Player === 'B') mStat.totalQuestsB += 1
        dayXp += Number(l.XP || 0)
      }
    })
    
    mStat.totalXP += Math.round(dayXp * mult)
  })
  
  return Object.values(map).sort((a, b) => b.month.localeCompare(a.month))
})
</script>

<style scoped>
.history-panel {
  padding: 0.25rem 0;
}

.panel-header-tabs {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.25);
  padding: 0.35rem;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  margin-bottom: 2rem;
}

.tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.5rem 0.25rem;
  border-radius: 8px;
  cursor: pointer;
  transition: var(--transition-smooth);
  text-align: center;
}

.tab-btn:hover {
  color: #fff;
}

.tab-active {
  background: rgba(0, 180, 216, 0.15);
  color: var(--neon-blue);
  border: 1px solid rgba(0, 180, 216, 0.2);
  text-shadow: 0 0 5px rgba(0, 180, 216, 0.2);
}

.section-title {
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-secondary);
  margin-bottom: 1.25rem;
  letter-spacing: 1px;
}

.empty-history {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
  font-size: 0.85rem;
  border: 1px dashed var(--border-color);
  border-radius: 12px;
}

.scrollable-content {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

/* 點數存摺 Ledger 樣式 */
.ledger-container {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.ledger-row {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  padding: 0.85rem 1rem;
  font-size: 0.8rem;
  transition: var(--transition-smooth);
  gap: 0.5rem;
}

.ledger-row:hover {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.06);
}

.ledger-row-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.ledger-desc-text {
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
  flex: 1;
  padding-right: 0.5rem;
  line-height: 1.4;
}

.ledger-row-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-size: 0.7rem;
}

.ledger-time-badge {
  color: var(--text-muted);
  opacity: 0.75;
}

.player-tag {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  color: #fff;
  white-space: nowrap;
}

.tag-a {
  background: rgba(157, 78, 221, 0.15);
  border: 1px solid rgba(157, 78, 221, 0.35);
  color: #c8b6ff;
  box-shadow: 0 0 5px rgba(157, 78, 221, 0.15);
}

.tag-b {
  background: rgba(0, 180, 216, 0.15);
  border: 1px solid rgba(0, 180, 216, 0.35);
  color: #caf0f8;
  box-shadow: 0 0 5px rgba(0, 180, 216, 0.15);
}

.ledger-amount-col {
  font-family: var(--font-title);
  font-size: 0.95rem;
  font-weight: 800;
  text-align: right;
  white-space: nowrap;
}

.text-gain {
  color: var(--neon-green);
  text-shadow: 0 0 5px rgba(6, 214, 160, 0.2);
}

.text-loss {
  color: #ff4d6d;
  text-shadow: 0 0 5px rgba(255, 77, 109, 0.2);
}

/* 日週統計 */
.weekly-stats-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.day-stat-card {
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 0.85rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.combo-bg {
  background: rgba(0, 180, 216, 0.02);
  border-color: rgba(0, 180, 216, 0.15);
}

.stat-date-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 65px;
  flex-shrink: 0;
}

.stat-day {
  font-family: var(--font-title);
  font-size: 0.9rem;
  font-weight: bold;
  color: #fff;
  font-variant-numeric: tabular-nums;
  letter-spacing: 1px;
}

.stat-combo-badge {
  font-family: var(--font-title);
  font-size: 0.6rem;
  font-weight: 900;
  color: var(--neon-blue);
  background: rgba(0, 180, 216, 0.1);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  border: 1px solid rgba(0, 180, 216, 0.2);
}

.players-progress-row {
  display: flex;
  gap: 1.5rem;
  flex: 0 0 320px; /* 固定寬度，不受左側日期影響 */
  justify-content: flex-end;
}

@media (max-width: 576px) {
  .players-progress-row {
    flex: 1 1 100%;
    margin-top: 0.5rem;
    justify-content: space-between;
  }
}

.player-progress-col {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 120px;
  justify-content: flex-end;
}

.player-small-name {
  font-size: 0.75rem;
  font-weight: bold;
  width: 50px;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress-mini-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  overflow: hidden;
  max-width: 80px;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
}

.fill-a {
  background: var(--neon-purple);
}

.fill-b {
  background: var(--neon-blue);
}

.progress-fraction {
  font-family: var(--font-title);
  font-size: 0.7rem;
  color: var(--text-muted);
  width: 30px;
  text-align: left;
}

/* 月度分析 */
.monthly-analytics-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.month-stat-card {
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
}

.month-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
}

.month-title {
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 800;
  color: #fff;
}

.month-total-xp {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.month-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 1rem;
}

.grid-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background: rgba(0, 0, 0, 0.15);
  padding: 0.6rem 0.85rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.02);
}

.grid-label {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.grid-value {
  font-family: var(--font-title);
  font-size: 0.95rem;
  font-weight: bold;
}

/* RWD 手機版優化：釋放內邊距，防止進度條文字太貼邊 */
@media (max-width: 576px) {
  .day-stat-card {
    padding: 0.65rem 0.75rem !important;
    gap: 0.5rem !important;
  }
  .stat-date-info {
    gap: 0.5rem !important;
  }
  .stat-day {
    font-size: 0.8rem !important;
  }
  .players-progress-row {
    gap: 0.5rem !important;
  }
  .player-progress-col {
    min-width: 90px !important;
    gap: 0.35rem !important;
  }
  .player-small-name {
    width: 32px !important;
    font-size: 0.68rem !important;
  }
  .progress-mini-bar {
    height: 3px !important;
  }
  .progress-fraction {
    font-size: 0.65rem !important;
  }
}
</style>
