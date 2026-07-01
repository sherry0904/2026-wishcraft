<template>
  <div class="coop-panel">
    <!-- 玩家 A 卡片 -->
    <div 
      class="player-card game-card" 
      :class="{ 
        'active-glow': activePlayer === 'A',
        'is-offline-card': isOffline 
      }"
    >
      <div class="player-header">
        <div class="avatar-container avatar-a">A</div>
        <div class="player-meta">
          <div class="player-title-group">
            <h3 class="player-name">{{ playerAName || '玩家 A' }}</h3>
            <span class="player-subtitle">PARTNER A</span>
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
          <span class="quota-count">剩餘 {{ 2 - playerASkipsUsed }} 次</span>
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
            @click="$emit('useSkip', 'A')"
          >
            使用請假券
          </button>
        </div>
      </div>
    </div>

    <!-- 中間的 Combo 與狀態連線 -->
    <div class="coop-status-center">
      <div 
        class="combo-badge" 
        :class="{ 'combo-active': isComboActive }"
      >
        <div class="combo-icon">
          <svg class="combo-icon-svg float-animation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polyline>
          </svg>
        </div>
        <div class="combo-text">
          <div class="combo-title">飲水 COMBO</div>
          <div class="combo-mult">{{ isComboActive ? '1.2x 經驗加成' : '未啟動' }}</div>
        </div>
      </div>
      <div class="coop-connector">
        <div class="connector-line" :class="{ 'line-active': isComboActive }"></div>
      </div>
    </div>

    <!-- 玩家 B 卡片 -->
    <div 
      class="player-card game-card" 
      :class="{ 
        'active-glow': activePlayer === 'B',
        'is-offline-card': isOffline 
      }"
    >
      <div class="player-header">
        <div class="avatar-container avatar-b">B</div>
        <div class="player-meta">
          <div class="player-title-group">
            <h3 class="player-name">{{ playerBName || '玩家 B' }}</h3>
            <span class="player-subtitle">PARTNER B</span>
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
          <span class="quota-count">剩餘 {{ 2 - playerBSkipsUsed }} 次</span>
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
            @click="$emit('useSkip', 'B')"
          >
            使用請假券
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  activePlayer: 'A' | 'B' | null
  playerAName: string
  playerBName: string
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
  isOffline: boolean
}>()

defineEmits<{
  (e: 'useSkip', player: 'A' | 'B'): void
}>()

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
  if (props.activePlayer !== player) return false
  if (player === 'A' && props.playerAHasSkipped) return false
  if (player === 'B' && props.playerBHasSkipped) return false
  if (player === 'A' && props.playerASkipsUsed >= 2) return false
  if (player === 'B' && props.playerBSkipsUsed >= 2) return false
  
  return true
}
</script>

<style scoped>
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
    grid-row: 1;
    margin: 0.5rem 0;
  }
  .coop-connector {
    display: none;
  }
}

.player-card {
  position: relative;
  border-top: 2px solid transparent;
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
