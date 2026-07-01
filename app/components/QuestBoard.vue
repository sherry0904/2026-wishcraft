<template>
  <div class="quest-board game-card">
    <div class="board-header">
      <div class="title-wrapper">
        <h2 class="board-title">今日養成日常</h2>
        <span class="board-subtitle">DAILY HABITS</span>
      </div>
      <div v-if="hasSkipped" class="skip-active-badge">
        今日請假免責已生效
      </div>
    </div>

    <div class="board-columns">
      <!-- 我的任務欄位 -->
      <div class="quest-column my-quests">
        <h3 class="column-title">
          <div class="column-title-group">
            <span class="column-main-title">{{ myColumnTitle }}</span>
            <span class="column-sub-title">MY HABITS <span v-if="!activePlayer">(唯讀觀戰)</span></span>
          </div>
        </h3>
        
        <div v-if="myQuests.length === 0" class="empty-quests">
          目前無可用養成項目。
        </div>

        <div v-else class="quest-list">
          <div 
            v-for="quest in myQuests" 
            :key="quest.Id"
            class="quest-item"
            :class="[
              `category-${getCategoryKey(quest.Category)}`,
              { 
                'quest-completed': isQuestCompleted(quest.Id),
                'quest-disabled': !activePlayer || hasSkipped,
                'micro-active-item': isMicroMode[quest.Id] && !isQuestCompleted(quest.Id)
              }
            ]"
          >
            <!-- 左側打勾區 -->
            <label class="quest-checkbox-label">
              <input 
                type="checkbox" 
                class="quest-checkbox-input"
                :checked="isQuestCompleted(quest.Id) || hasSkipped"
                :disabled="!activePlayer || hasSkipped"
                @change="handleToggle(quest.Id, ($event.target as HTMLInputElement).checked, quest.XP)"
              />
              <span class="custom-checkbox"></span>
              
              <div class="quest-info">
                <span class="quest-name">{{ quest.Name }}</span>
                <span class="quest-desc">{{ quest.Description }}</span>
              </div>
            </label>

            <!-- 右側行為區：包含微習慣減壓切換開關與點數標籤 -->
            <div class="quest-actions-right">
              <button 
                v-if="!isQuestCompleted(quest.Id) && !hasSkipped && activePlayer"
                class="btn-micro-toggle"
                :class="{ 'micro-active': isMicroMode[quest.Id] }"
                title="切換微習慣減壓模式 (獲得點數減半)"
                @click="toggleMicroMode(quest.Id)"
              >
                🧘 <span class="micro-btn-text">減壓</span>
              </button>
              
              <div class="quest-xp-badge" :class="{ 'xp-slashed': isMicroOrSlashed(quest.Id, quest.XP) }">
                +{{ getDisplayXP(quest.Id, quest.XP) }} XP
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 夥伴的任務欄位 (唯讀) -->
      <div class="quest-column partner-quests">
        <h3 class="column-title">
          <div class="column-title-group">
            <span class="column-main-title">{{ partnerColumnTitle }}</span>
            <span class="column-sub-title">COMPANION HABITS ({{ partnerName }} - 唯讀)</span>
          </div>
        </h3>

        <div v-if="partnerQuests.length === 0" class="empty-quests">
          目前無可用養成項目。
        </div>

        <div v-else class="quest-list">
          <div 
            v-for="quest in partnerQuests" 
            :key="quest.Id"
            class="quest-item partner-item"
            :class="[
              `category-${getCategoryKey(quest.Category)}`,
              { 'quest-completed': isPartnerQuestCompleted(quest.Id) || partnerHasSkipped }
            ]"
          >
            <div class="quest-checkbox-label">
              <input 
                type="checkbox" 
                class="quest-checkbox-input"
                :checked="isPartnerQuestCompleted(quest.Id) || partnerHasSkipped"
                disabled
              />
              <span class="custom-checkbox partner-checkbox"></span>
              
              <div class="quest-info">
                <span class="quest-name">{{ quest.Name }}</span>
                <span class="quest-desc">{{ quest.Description }}</span>
              </div>
            </div>

            <!-- 夥伴右側點數標籤 (自動依據夥伴打卡紀錄顯示折半或足額點數) -->
            <div class="quest-actions-right">
              <span v-if="isPartnerMicro(quest.Id, quest.XP) && (isPartnerQuestCompleted(quest.Id) && !partnerHasSkipped)" class="partner-micro-tag">🧘 減壓</span>
              <div 
                class="quest-xp-badge partner-xp" 
                :class="{ 'xp-slashed': isPartnerMicro(quest.Id, quest.XP) && (isPartnerQuestCompleted(quest.Id) && !partnerHasSkipped) }"
              >
                +{{ getPartnerDisplayXP(quest.Id, quest.XP) }} XP
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 唯讀模式警告 -->
    <div v-if="!activePlayer" class="spectator-alert">
      💡 提示：您目前處於唯讀觀戰模式，無法勾選任務。若要記錄您的日常養成，請點擊選角畫面登入身分。
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

export interface Quest {
  Id: string
  Player: 'A' | 'B' | 'Both'
  Category: string
  Name: string
  Description: string
  XP: number
  Icon: string
  Active: boolean
}

const props = defineProps<{
  activePlayer: 'A' | 'B' | null
  playerAName: string
  playerBName: string
  quests: Quest[]
  completedQuestsA: string[]
  completedQuestsB: string[]
  hasSkippedA: boolean
  hasSkippedB: boolean
  logs: any[]
}>()

const emit = defineEmits<{
  (e: 'toggleQuest', payload: { questId: string; completed: boolean; xp: number }): void
}>()

// 紀錄每個任務是否開啟微習慣（減壓）模式的響應式狀態
const isMicroMode = ref<Record<string, boolean>>({})

// 夥伴名稱
const partnerName = computed(() => {
  if (props.activePlayer === 'A') return props.playerBName || '夥伴'
  if (props.activePlayer === 'B') return props.playerAName || '夥伴'
  return '未設定'
})

const myColumnTitle = computed(() => {
  if (props.activePlayer === 'A' || props.activePlayer === 'B') return '我的日常習慣'
  return `${props.playerAName || '玩家 A'} 的日常習慣`
})

const partnerColumnTitle = computed(() => {
  if (props.activePlayer === 'A') return `${props.playerBName || '夥伴'} 的日常習慣`
  if (props.activePlayer === 'B') return `${props.playerAName || '夥伴'} 的日常習慣`
  return `${props.playerBName || '夥伴'} 的日常習慣`
})

// 當前玩家是否請假
const hasSkipped = computed(() => {
  if (props.activePlayer === 'A') return props.hasSkippedA
  if (props.activePlayer === 'B') return props.hasSkippedB
  return false
})

// 夥伴是否請假
const partnerHasSkipped = computed(() => {
  if (props.activePlayer === 'A') return props.hasSkippedB
  if (props.activePlayer === 'B') return props.hasSkippedA
  return false
})

// 分流任務列表
const myQuests = computed(() => {
  if (!props.activePlayer) {
    return props.quests.filter(q => q.Player === 'A' && q.Active)
  }
  return props.quests.filter(q => (q.Player === props.activePlayer || q.Player === 'Both') && q.Active)
})

const partnerQuests = computed(() => {
  if (!props.activePlayer) {
    return props.quests.filter(q => q.Player === 'B' && q.Active)
  }
  const partnerId = props.activePlayer === 'A' ? 'B' : 'A'
  return props.quests.filter(q => (q.Player === partnerId || q.Player === 'Both') && q.Active)
})

// 轉換 Category 成樣式 key
function getCategoryKey(category: string): string {
  if (category === '飲水') return 'water'
  if (category === '進食') return 'food'
  if (category === '運動') return 'move'
  if (category === '精神') return 'mind'
  if (category === '家務') return 'chore'
  if (category === '學習') return 'study'
  return 'default'
}

// 日期解析輔助
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

// 檢查特定任務是否已完成
function isQuestCompleted(questId: string): boolean {
  if (props.activePlayer === 'A') return props.completedQuestsA.includes(questId)
  if (props.activePlayer === 'B') return props.completedQuestsB.includes(questId)
  return props.completedQuestsA.includes(questId)
}

function isPartnerQuestCompleted(questId: string): boolean {
  if (props.activePlayer === 'A') return props.completedQuestsB.includes(questId)
  if (props.activePlayer === 'B') return props.completedQuestsA.includes(questId)
  return props.completedQuestsB.includes(questId)
}

// 獲取已完成任務在 database 紀錄中的真實獲得點數
function getCompletedQuestXP(questId: string, player: 'A' | 'B'): number | null {
  const todayStr = getTodayDateStr()
  const log = props.logs.find(l => 
    l.Player === player &&
    l.QuestId === questId && 
    parseToLocalDateStr(l.Date) === todayStr && 
    !l.IsSkipPass
  )
  return log ? Number(log.XP) : null
}

// 前端顯示的 XP
function getDisplayXP(questId: string, originalXp: number): number {
  const me = props.activePlayer || 'A'
  const earned = getCompletedQuestXP(questId, me)
  if (earned !== null) return earned
  
  return isMicroMode.value[questId] ? Math.max(1, Math.round(originalXp / 2)) : originalXp
}

function isMicroOrSlashed(questId: string, originalXp: number): boolean {
  const me = props.activePlayer || 'A'
  const earned = getCompletedQuestXP(questId, me)
  if (earned !== null) return earned < originalXp
  return !!isMicroMode.value[questId]
}

// 夥伴前端顯示的 XP
function getPartnerDisplayXP(questId: string, originalXp: number): number {
  const partner = props.activePlayer === 'A' ? 'B' : 'A'
  const earned = getCompletedQuestXP(questId, partner)
  if (earned !== null) return earned
  return originalXp
}

function isPartnerMicro(questId: string, originalXp: number): boolean {
  const partner = props.activePlayer === 'A' ? 'B' : 'A'
  const earned = getCompletedQuestXP(questId, partner)
  return earned !== null && earned < originalXp
}

function toggleMicroMode(questId: string) {
  isMicroMode.value[questId] = !isMicroMode.value[questId]
}

// 觸發切換
function handleToggle(questId: string, completed: boolean, originalXp: number) {
  // 如果開啟了微習慣減壓，傳出折半的 XP 點數
  const finalXp = isMicroMode.value[questId] ? Math.max(1, Math.round(originalXp / 2)) : originalXp
  emit('toggleQuest', { questId, completed, xp: finalXp })
}
</script>

<style scoped>
.quest-board {
  margin-bottom: 2rem;
  border-top: 3px solid var(--neon-blue);
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.board-title {
  font-family: var(--font-body);
  font-size: 1.25rem;
  font-weight: 900;
  color: #fff;
  letter-spacing: 1px;
}

.board-subtitle {
  font-family: var(--font-title);
  font-size: 0.65rem;
  letter-spacing: 3px;
  color: var(--text-secondary);
  opacity: 0.8;
  margin-top: 0.15rem;
}

.skip-active-badge {
  background: rgba(255, 183, 3, 0.1);
  border: 1px solid var(--neon-gold);
  color: var(--neon-gold);
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  box-shadow: var(--shadow-neon-gold);
}

.board-columns {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .board-columns {
    grid-template-columns: 1fr 1fr;
  }
}

.quest-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.column-title {
  margin-bottom: 0.5rem;
}

.column-title-group {
  display: flex;
  flex-direction: column;
}

.column-main-title {
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 800;
  color: #fff;
}

.column-sub-title {
  font-family: var(--font-title);
  font-size: 0.6rem;
  color: var(--text-muted);
  letter-spacing: 1px;
  margin-top: 0.1rem;
}

.quest-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

/* 任務卡片基礎樣式 */
.quest-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 0.85rem 1rem;
  transition: var(--transition-smooth);
  gap: 0.75rem;
}

.quest-item:hover {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.06);
}

.quest-checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  cursor: pointer;
  flex-grow: 1;
}

.quest-checkbox-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.custom-checkbox {
  width: 18px;
  height: 18px;
  background: rgba(0, 0, 0, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  display: inline-block;
  flex-shrink: 0;
  margin-top: 0.15rem;
  position: relative;
  transition: var(--transition-smooth);
}

.quest-checkbox-label:hover .custom-checkbox {
  border-color: var(--neon-purple);
}

.quest-checkbox-input:checked ~ .custom-checkbox {
  background: var(--neon-purple);
  border-color: var(--neon-purple);
  box-shadow: var(--shadow-neon-purple);
}

.partner-checkbox {
  border-color: rgba(0, 180, 216, 0.2);
}

.quest-checkbox-input:checked ~ .partner-checkbox {
  background: var(--neon-blue);
  border-color: var(--neon-blue);
  box-shadow: var(--shadow-neon-blue);
}

.custom-checkbox::after {
  content: "";
  position: absolute;
  display: none;
  left: 5px;
  top: 1px;
  width: 5px;
  height: 9px;
  border: solid #0b0c10;
  border-width: 0 2.5px 2.5px 0;
  transform: rotate(45deg);
}

.quest-checkbox-input:checked ~ .custom-checkbox::after {
  display: block;
}

.quest-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.quest-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  transition: var(--transition-smooth);
}

.quest-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  transition: var(--transition-smooth);
}

/* 右側行為與點數標章 */
.quest-actions-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.quest-xp-badge {
  font-family: var(--font-title);
  font-size: 0.7rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  flex-shrink: 0;
  transition: var(--transition-smooth);
}

.quest-completed .quest-xp-badge {
  background: rgba(6, 214, 160, 0.08);
  border-color: rgba(6, 214, 160, 0.25);
  color: var(--neon-green);
  box-shadow: 0 0 5px rgba(6, 214, 160, 0.1);
}

.partner-xp {
  color: var(--neon-blue);
  border-color: rgba(0, 180, 216, 0.15);
}

.quest-completed .partner-xp {
  background: rgba(0, 180, 216, 0.08);
  border-color: rgba(0, 180, 216, 0.25);
  color: var(--neon-blue);
  box-shadow: 0 0 5px rgba(0, 180, 216, 0.1);
}

/* 🧘 減壓微習慣按鈕 */
.btn-micro-toggle {
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.15rem;
  transition: var(--transition-smooth);
}

.btn-micro-toggle:hover {
  background: rgba(255, 183, 3, 0.05);
  border-color: rgba(255, 183, 3, 0.2);
  color: var(--neon-gold);
}

.btn-micro-toggle.micro-active {
  background: rgba(255, 183, 3, 0.1);
  border-color: var(--neon-gold);
  color: var(--neon-gold);
  box-shadow: var(--shadow-neon-gold);
}

.micro-btn-text {
  font-size: 0.6rem;
}

.partner-micro-tag {
  background: rgba(255, 183, 3, 0.05);
  border: 1px solid rgba(255, 183, 3, 0.2);
  color: var(--neon-gold);
  font-size: 0.6rem;
  font-weight: 700;
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
}

/* 減壓點數斜槓化樣式 */
.xp-slashed {
  color: var(--neon-gold) !important;
  border-color: rgba(255, 183, 3, 0.3) !important;
  background: rgba(255, 183, 3, 0.04) !important;
}

.micro-active-item {
  border-color: rgba(255, 183, 3, 0.12);
  background: rgba(255, 183, 3, 0.015);
}

/* 完成狀態樣式 */
.quest-completed .quest-name {
  text-decoration: line-through;
  color: var(--text-muted);
}

.quest-completed .quest-desc {
  color: rgba(255, 255, 255, 0.15);
}

.quest-disabled {
  opacity: 0.6;
}

/* 依照類別顯示邊線發光 */
.category-water { border-left: 3px solid #00b4d8; }
.category-food { border-left: 3px solid #e76f51; }
.category-move { border-left: 3px solid #2a9d8f; }
.category-mind { border-left: 3px solid #a2d2ff; }
.category-chore { border-left: 3px solid #e9c46a; }
.category-study { border-left: 3px solid #b5e2fa; }

.empty-quests {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
  background: rgba(255, 255, 255, 0.01);
  border: 1px dashed var(--border-color);
  border-radius: 12px;
}

.spectator-alert {
  margin-top: 1.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  color: var(--text-muted);
  font-size: 0.75rem;
  line-height: 1.5;
}
</style>
