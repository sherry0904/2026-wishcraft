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
            <div class="ledger-date-col">
              <span class="ledger-date">{{ formatLocalDate(log.Date) }}</span>
              <span class="ledger-time">{{ formatLocalTime(log.Timestamp) }}</span>
            </div>
            
            <div class="ledger-player-col">
              <span class="player-badge" :class="log.Player === 'A' ? 'badge-a' : 'badge-b'">
                {{ log.Player === 'A' ? playerAName : playerBName }}
              </span>
            </div>

            <div class="ledger-desc-col">
              <!-- 情況 A：請假 -->
              <div v-if="log.IsSkipPass" class="ledger-desc">
                使用了 <span class="text-neon-gold">請假券</span>
              </div>
              <!-- 情況 B：點數商店兌換 -->
              <div v-else-if="log.QuestId.startsWith('redeem_')" class="ledger-desc text-white">
                兌換：<span class="text-neon-gold">{{ getRedemptionName(log.QuestId) }}</span>
              </div>
              <!-- 情況 C：日常任務完成 -->
              <div v-else class="ledger-desc">
                <span>{{ getQuestName(log.QuestId) }}</span>
              </div>
            </div>

            <div class="ledger-amount-col">
              <span v-if="log.IsSkipPass" class="amount-val text-muted">--</span>
              <span v-else-if="log.QuestId.startsWith('redeem_')" class="amount-val text-loss">
                {{ log.XP }}
              </span>
              <span v-else class="amount-val text-gain">
                +{{ log.XP }}
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
            :class="{ 'combo-bg': stat.combo }"
          >
            <div class="stat-date-info">
              <span class="stat-day">{{ formatLocalDate(stat.date) }}</span>
              <span v-if="stat.combo" class="stat-combo-badge float-animation">⚡ COMBO 1.2x</span>
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
    
    const waterCompletedA = dayLogs.some(l => l.Player === 'A' && !l.IsSkipPass && props.quests.find(q => q.Id === l.QuestId)?.Category === '飲水') || hasSkippedA
    const waterCompletedB = dayLogs.some(l => l.Player === 'B' && !l.IsSkipPass && props.quests.find(q => q.Id === l.QuestId)?.Category === '飲水') || hasSkippedB
    const combo = waterCompletedA && waterCompletedB
    
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
    
    const hasSkippedA = dayLogs.some(l => l.Player === 'A' && l.QuestId === 'skip')
    const hasSkippedB = dayLogs.some(l => l.Player === 'B' && l.QuestId === 'skip')
    const waterCompletedA = dayLogs.some(l => l.Player === 'A' && !l.IsSkipPass && props.quests.find(q => q.Id === l.QuestId)?.Category === '飲水') || hasSkippedA
    const waterCompletedB = dayLogs.some(l => l.Player === 'B' && !l.IsSkipPass && props.quests.find(q => q.Id === l.QuestId)?.Category === '飲水') || hasSkippedB
    const hasCombo = waterCompletedA && waterCompletedB
    
    if (hasCombo) {
      mStat.comboDays += 1
    }
    
    let dayXp = 0
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
    
    if (hasCombo) {
      mStat.totalXP += Math.round(dayXp * 1.2)
    } else {
      mStat.totalXP += dayXp
    }
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
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  transition: var(--transition-smooth);
  gap: 0.25rem;
}

.ledger-row:hover {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.06);
}

.ledger-date-col {
  display: flex;
  flex-direction: column;
  min-width: 65px;
  padding-top: 0.15rem;
}

.ledger-date {
  font-family: var(--font-title);
  font-weight: bold;
  color: var(--text-muted);
}

.ledger-time {
  font-family: var(--font-title);
  font-size: 0.65rem;
  color: var(--text-muted);
  opacity: 0.7;
}

.ledger-player-col {
  min-width: 50px;
  margin-left: 0.25rem;
  padding-top: 0.1rem;
}

.player-badge {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  display: inline-block;
  text-align: center;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60px;
}

.badge-a {
  background: var(--neon-purple);
  box-shadow: 0 0 5px rgba(157, 78, 221, 0.3);
}

.badge-b {
  background: var(--neon-blue);
  box-shadow: 0 0 5px rgba(0, 180, 216, 0.3);
}

.ledger-desc-col {
  flex: 1;
  padding: 0 0.5rem;
  color: var(--text-secondary);
  line-height: 1.4;
  word-break: break-word;
}

.ledger-amount-col {
  font-family: var(--font-title);
  font-size: 0.9rem;
  font-weight: 800;
  min-width: 55px;
  text-align: right;
  padding-top: 0.15rem;
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
}

.stat-day {
  font-family: var(--font-title);
  font-size: 0.9rem;
  font-weight: bold;
  color: #fff;
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
  flex: 1;
  justify-content: flex-end;
  max-width: 500px;
}

@media (max-width: 576px) {
  .players-progress-row {
    width: 100%;
    justify-content: space-between;
    max-width: none;
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
