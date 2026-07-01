<template>
  <div class="quest-board game-card">
    <div class="board-header">
      <div class="title-wrapper">
        <h2 class="board-title">今日日常任務</h2>
        <span class="board-subtitle">DAILY QUESTS</span>
      </div>
      <div v-if="hasSkipped" class="skip-active-badge">
        請假免責已生效
      </div>
    </div>

    <div class="board-columns">
      <!-- 我的任務欄位 -->
      <div class="quest-column my-quests">
        <h3 class="column-title">
          <div class="column-title-group">
            <span class="column-main-title">{{ myColumnTitle }}</span>
            <span class="column-sub-title">MY QUESTS <span v-if="!activePlayer">(READ-ONLY)</span></span>
          </div>
        </h3>
        
        <div v-if="myQuests.length === 0" class="empty-quests">
          目前無可用任務。請至 Google Sheets 新增任務。
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
                'quest-disabled': !activePlayer || hasSkipped 
              }
            ]"
          >
            <label class="quest-checkbox-label">
              <input 
                type="checkbox" 
                class="quest-checkbox-input"
                :checked="isQuestCompleted(quest.Id) || hasSkipped"
                :disabled="!activePlayer || hasSkipped"
                @change="onToggleQuest(quest.Id, ($event.target as HTMLInputElement).checked, quest.XP)"
              />
              <span class="custom-checkbox"></span>
              
              <div class="quest-info">
                <span class="quest-name">{{ quest.Name }}</span>
                <span class="quest-desc">{{ quest.Description }}</span>
              </div>
            </label>
            <div class="quest-xp-badge">
              +{{ quest.XP }} XP
            </div>
          </div>
        </div>
      </div>

      <!-- 夥伴的任務欄位 -->
      <div class="quest-column partner-quests">
        <h3 class="column-title">
          <div class="column-title-group">
            <span class="column-main-title">{{ partnerColumnTitle }}</span>
            <span class="column-sub-title">PARTNER QUESTS ({{ partnerName }} - READ-ONLY)</span>
          </div>
        </h3>

        <div v-if="partnerQuests.length === 0" class="empty-quests">
          目前無可用任務。
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
            <div class="quest-xp-badge partner-xp">
              +{{ quest.XP }} XP
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 唯讀模式警告 -->
    <div v-if="!activePlayer" class="spectator-alert">
      💡 提示：您目前處於唯讀觀戰模式，無法勾選任務。若要記錄您的習慣，請點擊您的個人專屬網址（例如在網址後方加上 <code>?player=A</code> 或 <code>?player=B</code>）。
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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
}>()

const emit = defineEmits<{
  (e: 'toggleQuest', payload: { questId: string; completed: boolean; xp: number }): void
}>()

// 夥伴名稱
const partnerName = computed(() => {
  if (props.activePlayer === 'A') return props.playerBName || '玩家 B'
  if (props.activePlayer === 'B') return props.playerAName || '玩家 A'
  return '未設定'
})

const myColumnTitle = computed(() => {
  if (props.activePlayer === 'A' || props.activePlayer === 'B') return '我的日常任務'
  return `${props.playerAName || '玩家 A'} 的日常任務`
})

const partnerColumnTitle = computed(() => {
  if (props.activePlayer === 'A') return `${props.playerBName || '玩家 B'} 的日常任務`
  if (props.activePlayer === 'B') return `${props.playerAName || '玩家 A'} 的日常任務`
  return `${props.playerBName || '玩家 B'} 的日常任務`
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

// 觸發切換
function onToggleQuest(questId: string, completed: boolean, xp: number) {
  emit('toggleQuest', { questId, completed, xp })
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
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}

.title-wrapper {
  display: flex;
  flex-direction: column;
}

.board-title {
  font-family: var(--font-body);
  font-size: 1.3rem;
  font-weight: 900;
  letter-spacing: 2px;
  color: #fff;
  text-shadow: 0 0 10px rgba(0, 180, 216, 0.25);
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
  background: rgba(6, 214, 160, 0.12);
  border: 1px solid rgba(6, 214, 160, 0.3);
  color: var(--neon-green);
  font-family: var(--font-body);
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 0.4rem 1rem;
  border-radius: 8px;
  font-size: 0.75rem;
  box-shadow: var(--shadow-neon-green);
  animation: skip-bounce 2s infinite ease-in-out;
}

@keyframes skip-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.board-columns {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 2rem;
}

@media (max-width: 992px) {
  .board-columns {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

.column-title {
  margin-bottom: 1.25rem;
}

.column-title-group {
  display: flex;
  flex-direction: column;
}

.column-main-title {
  font-family: var(--font-body);
  font-size: 1.05rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.5px;
}

.column-sub-title {
  font-family: var(--font-title);
  font-size: 0.6rem;
  color: var(--text-muted);
  letter-spacing: 2px;
  margin-top: 0.1rem;
}

.spectator-label, .partner-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: normal;
}

.quest-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.quest-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-left: 4px solid var(--border-color);
  border-radius: 12px;
  padding: 0.9rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: var(--transition-smooth);
  cursor: pointer;
}

.category-water { border-left-color: var(--neon-blue); }
.category-food { border-left-color: var(--neon-gold); }
.category-move { border-left-color: #00f5d4; }
.category-mind { border-left-color: var(--neon-purple); }
.category-chore { border-left-color: #ff4d6d; }
.category-study { border-left-color: #f15bb5; }
.category-default { border-left-color: rgba(255,255,255,0.2); }

.quest-item:hover:not(.quest-disabled) {
  background: var(--bg-card-hover);
  transform: translateX(4px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.quest-disabled {
  cursor: not-allowed;
}

.partner-item {
  cursor: default;
  opacity: 0.8;
}
.partner-item:hover {
  transform: none;
  box-shadow: none;
}

.quest-checkbox-label {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  cursor: inherit;
  user-select: none;
}

.quest-checkbox-input {
  position: absolute;
  opacity: 0;
  cursor: inherit;
  height: 0;
  width: 0;
}

.custom-checkbox {
  position: relative;
  height: 20px;
  width: 20px;
  background-color: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 5px;
  transition: var(--transition-smooth);
  flex-shrink: 0;
}

.quest-checkbox-label:hover .custom-checkbox {
  border-color: var(--neon-purple);
}

.quest-checkbox-input:checked ~ .custom-checkbox {
  background-color: var(--neon-green);
  border-color: var(--neon-green);
  box-shadow: var(--shadow-neon-green);
}

.partner-checkbox.custom-checkbox {
  border-radius: 50%;
}
.quest-checkbox-input:checked ~ .partner-checkbox {
  background-color: var(--neon-blue);
  border-color: var(--neon-blue);
  box-shadow: var(--shadow-neon-blue);
}

.custom-checkbox:after {
  content: "";
  position: absolute;
  display: none;
  left: 6px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.quest-checkbox-input:checked ~ .custom-checkbox:after {
  display: block;
}

.quest-completed .quest-name {
  text-decoration: line-through;
  color: var(--text-muted);
}
.quest-completed .quest-desc {
  color: rgba(255, 255, 255, 0.15);
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

.quest-xp-badge {
  font-family: var(--font-title);
  font-size: 0.7rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  flex-shrink: 0;
}

.quest-completed .quest-xp-badge {
  background: rgba(6, 214, 160, 0.08);
  border-color: rgba(6, 214, 160, 0.2);
  color: var(--neon-green);
}

.partner-xp {
  color: var(--neon-blue);
}

.quest-completed .partner-xp {
  background: rgba(0, 180, 216, 0.08);
  border-color: rgba(0, 180, 216, 0.2);
  color: var(--neon-blue);
}

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
  background: rgba(255, 183, 3, 0.06);
  border: 1px solid rgba(255, 183, 3, 0.15);
  color: var(--neon-gold);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.75rem;
  line-height: 1.4;
}

.spectator-alert code {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  color: #fff;
}
</style>
