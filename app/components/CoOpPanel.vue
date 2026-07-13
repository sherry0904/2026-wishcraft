<template>
  <div class="coop-panel">
    <!-- 玩家 A 卡片 -->
    <div 
      class="player-card game-card" 
      :class="{ 
        'active-glow': activePlayer === 'A',
        'compact-card': activePlayer !== 'A',
        'is-offline-card': isOffline 
      }"
    >
      <div class="player-header">
        <div class="avatar-container avatar-a">{{ (playerAName || 'A').charAt(0) }}</div>
        <div class="player-meta">
          <div class="player-title-group">
            <h3 class="player-name">{{ playerAName || '玩家 A' }}</h3>
          </div>
          <span class="quest-count">今日進度: {{ playerAQuestsDone }} / {{ playerAQuestsTotal }}</span>
        </div>
      </div>

      <!-- 進度條 -->
      <div class="mini-progress">
        <div 
          class="mini-bar-fill fill-a" 
          :style="{ width: `${playerAProgressPercentage}%` }"
        ></div>
      </div>

      <!-- 請假券狀態 -->
      <div class="skip-pass-section">
        <div class="quota-label">
          <span>本週請假券</span>
          <span class="quota-count">剩餘 {{ weeklyQuota - playerASkipsUsed }} 次</span>
        </div>
        <div class="skip-status">
          <span v-if="playerAHasSkipped" class="badge-skipped">
            <svg class="check-icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            今日已請假
          </span>
          <button 
            v-else
            class="btn-skip"
            :disabled="!canUseSkip('A')"
            @click="openSkipModal('A')"
          >
            使用請假券
          </button>
        </div>
      </div>
    </div>

    <!-- 中間的 Combo 與狀態連線 -->
    <div class="coop-status-center">
      <!-- 連線裝飾 -->
      <div class="coop-connector">
        <div class="connector-line" :class="{ 'line-active': isComboActive }"></div>
      </div>

      <div class="combo-badges-list" :style="{ justifyContent: allComboCats.length > 1 ? 'flex-start' : 'center' }">
        <!-- 如果無 active combos，顯示所有類別為未啟動 -->
        <template v-if="!activeCombos || activeCombos.length === 0">
          <div 
            v-for="cat in allComboCats" 
            :key="cat"
            class="combo-badge combo-badge-item"
          >
            <div class="combo-icon">
              <svg class="combo-icon-svg float-animation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polyline>
              </svg>
            </div>
            <div class="combo-text">
              <div class="combo-title">{{ cat }} COMBO</div>
              <div class="combo-mult">未啟動</div>
            </div>
          </div>
        </template>

        <!-- 如果有啟動的 combo，顯示所有類別（啟動的亮起，未啟動的灰暗） -->
        <template v-else>
          <div 
            v-for="cat in allComboCats" 
            :key="cat"
            class="combo-badge combo-badge-item"
            :class="{ 'combo-active': activeCombos?.includes(cat) }"
          >
            <div class="combo-icon">
              <svg class="combo-icon-svg float-animation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polyline>
              </svg>
            </div>
            <div class="combo-text">
              <div class="combo-title">{{ cat }} COMBO</div>
              <div class="combo-mult">{{ activeCombos?.includes(cat) ? '1.2x 經驗加成' : '未啟動' }}</div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 玩家 B 卡片 -->
    <div 
      class="player-card game-card" 
      :class="{ 
        'active-glow': activePlayer === 'B',
        'compact-card': activePlayer !== 'B',
        'is-offline-card': isOffline 
      }"
    >
      <div class="player-header">
        <div class="avatar-container avatar-b">{{ (playerBName || 'B').charAt(0) }}</div>
        <div class="player-meta">
          <div class="player-title-group">
            <h3 class="player-name">{{ playerBName || '玩家 B' }}</h3>
          </div>
          <span class="quest-count">今日進度: {{ playerBQuestsDone }} / {{ playerBQuestsTotal }}</span>
        </div>
      </div>

      <!-- 進度條 -->
      <div class="mini-progress">
        <div 
          class="mini-bar-fill fill-b" 
          :style="{ width: `${playerBProgressPercentage}%` }"
        ></div>
      </div>

      <!-- 請假券狀態 -->
      <div class="skip-pass-section">
        <div class="quota-label">
          <span>本週請假券</span>
          <span class="quota-count">剩餘 {{ weeklyQuota - playerBSkipsUsed }} 次</span>
        </div>
        <div class="skip-status">
          <span v-if="playerBHasSkipped" class="badge-skipped">
            <svg class="check-icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            今日已請假
          </span>
          <button 
            v-else
            class="btn-skip"
            :disabled="!canUseSkip('B')"
            @click="openSkipModal('B')"
          >
            使用請假券
          </button>
        </div>
      </div>
    </div>

    <!-- 請假券確認彈窗 -->
    <ClientOnly>
      <Teleport to="body">
        <div v-if="showSkipModal" class="modal-overlay skip-modal-overlay">
          <div class="modal-card skip-modal-card">
            <div class="skip-modal-icon">🛋️</div>
            <h3 class="modal-title skip-modal-title">確認使用請假券？</h3>
            <p class="modal-text skip-modal-text">
              使用請假券後，系統將自動將今天所有任務視為完成，讓你優雅休息一天。
            </p>
            <p class="skip-modal-warning">
              ⚠️此操作一旦確認，無法撤回。
            </p>
            <div class="modal-actions skip-modal-actions">
              <button class="btn-cancel skip-btn-cancel" @click="showSkipModal = false">再想想</button>
              <button class="btn-confirm-redeem skip-btn-confirm" @click="confirmSkip">好，我要請假</button>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  activePlayer: 'A' | 'B' | null
  playerAName: string
  playerBName: string
  weeklyQuota: number
  // 玩家 A 數據
  playerAQuestsDone: number
  playerAQuestsTotal: number
  playerASkipsUsed: number
  playerAHasSkipped: boolean
  // 玩家 B 數據
  playerBQuestsDone: number
  playerBQuestsTotal: number
  playerBSkipsUsed: number
  playerBHasSkipped: boolean
  // Combo 與離線狀態
  isComboActive: boolean
  comboCategory?: string
  allComboCategories?: string[]
  activeCombos?: string[]
  isOffline: boolean
  isReadOnly?: boolean
}>()

const emit = defineEmits<{
  (e: 'useSkip', player: 'A' | 'B'): void
}>()

const showSkipModal = ref(false)
const playerToSkip = ref<'A' | 'B' | null>(null)

function openSkipModal(player: 'A' | 'B') {
  playerToSkip.value = player
  showSkipModal.value = true
}

function confirmSkip() {
  if (playerToSkip.value) {
    emit('useSkip', playerToSkip.value)
  }
  showSkipModal.value = false
}

// 所有 combo 類別（來自 prop 或 fallback）
const allComboCats = computed(() => {
  if (props.allComboCategories && props.allComboCategories.length > 0) {
    return props.allComboCategories
  }
  return [props.comboCategory || '飲水']
})

const playerAProgressPercentage = computed(() => {
  if (props.playerAQuestsTotal === 0) return 0
  return (props.playerAQuestsDone / props.playerAQuestsTotal) * 100
})

const playerBProgressPercentage = computed(() => {
  if (props.playerBQuestsTotal === 0) return 0
  return (props.playerBQuestsDone / props.playerBQuestsTotal) * 100
})

// 判斷當前玩家是否可以使用請假券
function canUseSkip(player: 'A' | 'B'): boolean {
  if (props.isReadOnly) return false
  if (props.activePlayer !== player) return false
  if (player === 'A' && props.playerAHasSkipped) return false
  if (player === 'B' && props.playerBHasSkipped) return false
  if (player === 'A' && props.playerASkipsUsed >= props.weeklyQuota) return false
  if (player === 'B' && props.playerBSkipsUsed >= props.weeklyQuota) return false
  
  return true
}
</script>

<style scoped>
/* Modal Styles (duplicated from LootDashboard for standalone use) */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-card {
  width: 90%;
  max-width: 400px;
  background: #141822;
  border-top: 3px solid var(--neon-gold);
  padding: 1.75rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  border-radius: 16px;
}

.modal-title {
  font-family: var(--font-body);
  font-size: 1.15rem;
  font-weight: 900;
  margin: 0 0 1rem 0;
}

.modal-text {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-cancel {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.btn-confirm-redeem {
  background: linear-gradient(135deg, #ffb703, #fb8500);
  border: none;
  color: #0b0c10;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-confirm-redeem:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 183, 3, 0.3);
}

/* Skip Modal Overrides */
.skip-modal-card {
  text-align: center;
  padding: 2.5rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: #141822;
}

.skip-modal-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.skip-modal-title {
  color: #fff;
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.skip-modal-text {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.skip-modal-warning {
  font-size: 0.9rem;
  color: #e63946;
  margin-bottom: 2rem;
  font-weight: bold;
}

.skip-modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.skip-modal-actions > button {
  flex: 1;
  padding: 0.8rem;
  font-size: 1rem;
  border-radius: 12px;
}

.skip-btn-cancel {
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
}

.skip-btn-cancel:hover {
  background: rgba(255, 255, 255, 0.05);
}

.skip-btn-confirm {
  background: rgba(230, 57, 70, 0.15);
  border: 1px solid rgba(230, 57, 70, 0.3);
  color: #ff6b6b;
  box-shadow: none;
}

.skip-btn-confirm:hover {
  background: rgba(230, 57, 70, 0.25);
  box-shadow: 0 4px 12px rgba(230, 57, 70, 0.2);
}

.coop-panel {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .coop-panel {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .coop-status-center {
    margin: 0.75rem 0;
  }
  .coop-connector {
    display: none;
  }
}

.player-card {
  position: relative;
  border-top: 2px solid transparent;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

@media (max-width: 768px) {
  .player-card {
    order: 3; /* 預設放下面 */
  }
  .player-card.active-glow {
    order: 1; /* 啟動的放上面 */
  }
  .coop-status-center {
    order: 2; /* Combo 放中間 */
  }
}

.player-card.compact-card {
  padding: 0.75rem 1rem;
}
.player-card.compact-card .player-header {
  margin-bottom: 0.6rem;
  gap: 0.75rem;
}
.player-card.compact-card .avatar-container {
  width: 32px;
  height: 32px;
  font-size: 1rem;
}
.player-card.compact-card .player-name {
  font-size: 0.85rem;
}
.player-card.compact-card .player-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
}
.player-card.compact-card .quest-count {
  display: inline-block;
  font-size: 0.65rem;
  margin-top: 0;
}
.player-card.compact-card .mini-progress {
  margin-bottom: 0.6rem;
  height: 3px;
}
.player-card.compact-card .skip-pass-section {
  padding: 0.35rem 0.5rem;
}
.player-card.compact-card .quota-label {
  flex-direction: row;
  align-items: center;
  gap: 0.4rem;
}
.player-card.compact-card .quota-label span:first-child {
  font-size: 0.65rem;
}
.player-card.compact-card .btn-skip {
  padding: 0.2rem 0.4rem;
  font-size: 0.65rem;
}

.player-card.active-glow {
  animation: card-pulse 3s infinite ease-in-out;
}

.player-card.active-glow.player-card:nth-of-type(1) {
  border-top-color: var(--neon-purple);
  box-shadow: 0 0 15px rgba(157, 78, 221, 0.15);
}

.player-card.active-glow.player-card:nth-of-type(3) {
  border-top-color: var(--neon-blue);
  box-shadow: 0 0 15px rgba(0, 180, 216, 0.15);
}

@keyframes card-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.01); }
  100% { transform: scale(1); }
}

.player-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.avatar-container {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-title);
  font-weight: 900;
  font-size: 1.3rem;
  color: #fff;
}

.avatar-a {
  background: linear-gradient(135deg, var(--neon-purple), #5a189a);
  box-shadow: var(--shadow-neon-purple);
}

.avatar-b {
  background: linear-gradient(135deg, var(--neon-blue), #0077b6);
  box-shadow: var(--shadow-neon-blue);
}

.player-title-group {
  display: flex;
  flex-direction: column;
}

.player-name {
  font-family: var(--font-body);
  font-size: 1.05rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.5px;
}

.player-subtitle {
  font-family: var(--font-title);
  font-size: 0.6rem;
  color: var(--text-muted);
  letter-spacing: 1.5px;
  margin-top: 0.05rem;
}

.quest-count {
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.2rem;
  display: inline-block;
}

.mini-progress {
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 1.25rem;
}

.mini-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}

.fill-a {
  background: var(--neon-purple);
}

.fill-b {
  background: var(--neon-blue);
}

.skip-pass-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.quota-label {
  display: flex;
  flex-direction: column;
  font-family: var(--font-body);
  font-size: 0.7rem;
  color: var(--text-muted);
  gap: 0.15rem;
}

.quota-count {
  font-weight: 700;
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.btn-skip {
  background: rgba(255, 77, 109, 0.12);
  border: 1px solid rgba(255, 77, 109, 0.25);
  color: #ff4d6d;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-skip:hover:not(:disabled) {
  background: var(--neon-red);
  color: #fff;
  box-shadow: 0 0 10px rgba(255, 77, 109, 0.3);
}

.btn-skip:disabled {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  cursor: not-allowed;
}

.badge-skipped {
  font-family: var(--font-body);
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--neon-green);
  background: rgba(6, 214, 160, 0.08);
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  border: 1px solid rgba(6, 214, 160, 0.2);
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.check-icon-svg {
  width: 10px;
  height: 10px;
  stroke: var(--neon-green);
}

/* 中間的 Combo */
.coop-status-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  min-width: 140px;
}

.combo-badges-list {
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
  padding: 8px 4px;
  z-index: 2;
}

.combo-badges-list::-webkit-scrollbar {
  display: none; /* Chrome/Safari/Opera */
}

.combo-badge-item {
  flex-shrink: 0;
}

.combo-badge {
  background: rgba(20, 24, 35, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 2;
  transition: var(--transition-smooth);
}

.combo-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: var(--transition-smooth);
}

.combo-icon-svg {
  width: 18px;
  height: 18px;
  stroke: var(--text-muted);
}

.combo-text {
  display: flex;
  flex-direction: column;
}

.combo-title {
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.combo-mult {
  font-family: var(--font-title);
  font-size: 0.65rem;
  color: var(--text-muted);
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-top: 0.1rem;
}

/* 啟動時的 Combo 樣式 */
.combo-active {
  border-color: var(--neon-gold);
  box-shadow: var(--shadow-neon-gold);
  transform: scale(1.05);
}

.combo-active .combo-icon-svg {
  stroke: var(--neon-gold);
  filter: drop-shadow(0 0 5px rgba(255, 183, 3, 0.8));
}

.combo-active .combo-title {
  color: #fff;
}

.combo-active .combo-mult {
  color: var(--neon-gold);
  font-weight: 800;
  text-shadow: 0 0 8px rgba(255, 183, 3, 0.4);
}

/* 連線裝飾 */
.coop-connector {
  position: absolute;
  width: 150%;
  height: 2px;
  z-index: 1;
  pointer-events: none;
}

.connector-line {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  transition: var(--transition-smooth);
}

.connector-line.line-active {
  background: linear-gradient(to right, var(--neon-purple), var(--neon-gold), var(--neon-blue));
  box-shadow: 0 0 8px rgba(255, 183, 3, 0.5);
}
</style>
