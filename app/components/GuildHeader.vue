<template>
  <div>
    <!-- 2.0 新增：精簡版頂部常駐 Slim Header (高質感、不佔版幅) -->
    <div v-if="mode === 'compact'" class="guild-top-bar">
      <div class="top-bar-left">
        <span class="top-bar-guild-icon">🏰</span>
        <span class="top-bar-guild-name">{{ guildName || '日常習慣養成公會' }}</span>
        <span class="top-bar-level-badge">LV. {{ guildLevel }}</span>
      </div>
      
      <div class="top-bar-right" v-if="activePlayer">
        <div class="top-bar-user-pill" :class="activePlayer === 'A' ? 'pill-a' : 'pill-b'">
          <span class="top-bar-avatar">{{ activePlayer === 'A' ? 'A' : 'B' }}</span>
          <span class="top-bar-player-name">{{ activePlayer === 'A' ? playerAName : playerBName }}</span>
          <span class="top-bar-balance">{{ activePlayer === 'A' ? playerABalance : playerBBalance }} XP</span>
        </div>
        <button class="btn-top-bar-switch" @click="$emit('logout')">切換身分</button>
      </div>
    </div>

    <!-- 滿版詳細大看板 (只在「報告」分頁顯示，不再常駐每一頁) -->
    <header v-else class="guild-header game-card">
      <!-- 標題與登入身分列 -->
      <div class="header-main">
        <div class="guild-info">
          <div class="title-wrapper">
            <h1 class="guild-title">{{ guildName || '日常習慣養成公會' }}</h1>
            <span class="guild-subtitle">DAILY HABIT COMPANION GUILD</span>
          </div>
          <div class="guild-level-badge">
            LV. {{ guildLevel }}
          </div>
        </div>
        
        <div class="player-identity" :class="playerClass">
          <span class="pulse-dot"></span>
          <span class="player-label">{{ playerStatusLabel }}</span>
        </div>
      </div>

      <!-- 2.0 新增：雙人發光錢包與默契共鳴狀態區塊 -->
      <div class="players-wallets-grid">
        <!-- 玩家 A 錢包卡片 -->
        <div class="wallet-card card-player-a" :class="{ 'card-active': activePlayer === 'A' }">
          <div class="wallet-player-name">{{ playerAName }}</div>
          <div class="wallet-balance-row">
            <span class="wallet-xp-val text-neon-purple">{{ playerABalance }}</span>
            <span class="wallet-xp-unit">XP 可用</span>
          </div>
          <div class="wallet-contribution-row">
            生涯貢獻: {{ playerAContribution }} XP
          </div>
        </div>

        <!-- 默契共鳴徽章 -->
        <div class="synergy-status-wrapper">
          <div class="synergy-badge" :class="{ 'synergy-active': isSynergyActive }">
            <span class="synergy-icon">⚡</span>
            <span class="synergy-text">{{ isSynergyActive ? '默契共鳴' : '尚未共鳴' }}</span>
          </div>
        </div>

        <!-- 玩家 B 錢包卡片 -->
        <div class="wallet-card card-player-b" :class="{ 'card-active': activePlayer === 'B' }">
          <div class="wallet-player-name">{{ playerBName }}</div>
          <div class="wallet-balance-row">
            <span class="wallet-xp-val text-neon-blue">{{ playerBBalance }}</span>
            <span class="wallet-xp-unit">XP 可用</span>
          </div>
          <div class="wallet-contribution-row">
            生涯貢獻: {{ playerBContribution }} XP
          </div>
        </div>
      </div>

      <!-- 經驗值進度條 -->
      <div class="level-progress-container">
        <div class="progress-labels">
          <span>LV. {{ guildLevel }}</span>
          <span>LV. {{ guildLevel + 1 }}</span>
        </div>
        <div class="progress-bar-bg">
          <div 
            class="progress-bar-fill" 
            :style="{ width: `${levelProgressPercentage}%` }"
          >
            <div class="progress-bar-shimmer"></div>
          </div>
        </div>
        <div class="xp-ratio-centered">
          目前經驗值: {{ xpInCurrentLevel }} / 500 XP <span class="total-xp-secondary">(總積分: {{ totalXp }} XP)</span>
        </div>
      </div>

      <!-- 離線模式警告條 -->
      <div v-if="isOffline" class="offline-warning-banner">
        <svg class="warning-icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <span>目前處於離線展示模式。請參閱 <a href="file:///Users/sherryhsieh/.gemini/antigravity/brain/f5a4da56-c0e6-408f-bd9f-7b8bcd0dafe6/google_sheets_setup.md" target="_blank" class="setup-link">Google Sheets 設定指南</a> 串接您的專屬資料庫以同步進度。</span>
      </div>
    </header>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    guildName: string
    playerAName: string
    playerBName: string
    totalXp: number
    playerABalance: number
    playerBBalance: number
    playerAContribution: number
    playerBContribution: number
    isSynergyActive: boolean
    activePlayer: 'A' | 'B' | null
    isOffline: boolean
    mode?: 'compact' | 'full'
  }>(),
  {
    mode: 'full'
  }
)

const emit = defineEmits<{
  (e: 'logout'): void
}>()

// 每 500 XP 升一級
const guildLevel = computed(() => {
  return Math.floor(props.totalXp / 500) + 1
})

const xpInCurrentLevel = computed(() => {
  return props.totalXp % 500
})

const levelProgressPercentage = computed(() => {
  return (xpInCurrentLevel.value / 500) * 100
})

const playerStatusLabel = computed(() => {
  if (props.activePlayer === 'A') return `當前玩家：${props.playerAName} (控制端)`
  if (props.activePlayer === 'B') return `當前玩家：${props.playerBName} (控制端)`
  return '唯讀觀戰模式 (網址未包含身分參數)'
})

const playerClass = computed(() => {
  if (props.activePlayer === 'A') return 'player-a'
  if (props.activePlayer === 'B') return 'player-b'
  return 'spectator'
})
</script>

<style scoped>
.guild-header {
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
  border-left: 4px solid var(--neon-purple);
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.guild-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.title-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 250px;
}

.guild-title {
  font-family: var(--font-body);
  font-size: 1.2rem; /* 手機版小尺寸，避免擠壓斷行 */
  font-weight: 900;
  letter-spacing: 1px;
  line-height: 1.2;
  background: linear-gradient(to right, #fff, var(--neon-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 15px rgba(0, 180, 216, 0.25);
  word-break: keep-all; /* 防止中文單字斷行 */
}

.guild-subtitle {
  font-family: var(--font-title);
  font-size: 0.55rem;
  letter-spacing: 2px;
  color: var(--text-secondary);
  opacity: 0.8;
  margin-top: 0.15rem;
}

.guild-level-badge {
  font-family: var(--font-title);
  background: var(--neon-purple);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-weight: bold;
  font-size: 0.8rem;
  color: #fff;
  box-shadow: var(--shadow-neon-purple);
  flex-shrink: 0;
}

.player-identity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6c757d;
}

/* 玩家 A 樣式 */
.player-a {
  border-color: var(--neon-purple);
  color: #c8b6ff;
  box-shadow: 0 0 10px rgba(157, 78, 221, 0.15);
}
.player-a .pulse-dot {
  background: var(--neon-purple);
  animation: pulse-dot-anim 1.5s infinite;
}

/* 玩家 B 樣式 */
.player-b {
  border-color: var(--neon-blue);
  color: #90e0ef;
  box-shadow: 0 0 10px rgba(0, 180, 216, 0.15);
}
.player-b .pulse-dot {
  background: var(--neon-blue);
  animation: pulse-dot-anim 1.5s infinite;
}

/* 觀戰模式 */
.spectator {
  color: var(--text-muted);
}

@keyframes pulse-dot-anim {
  0% { transform: scale(0.9); opacity: 0.6; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.6; }
}

/* 雙人發光錢包 */
.players-wallets-grid {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.wallet-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 0.6rem 0.85rem;
  transition: var(--transition-smooth);
  position: relative;
  overflow: hidden;
}

.card-player-a {
  border-left: 3px solid var(--neon-purple);
}
.card-player-a.card-active {
  background: rgba(157, 78, 221, 0.04);
  border-color: var(--neon-purple);
  box-shadow: 0 0 10px rgba(157, 78, 221, 0.12);
}

.card-player-b {
  border-left: 3px solid var(--neon-blue);
}
.card-player-b.card-active {
  background: rgba(0, 180, 216, 0.04);
  border-color: var(--neon-blue);
  box-shadow: 0 0 10px rgba(0, 180, 216, 0.12);
}

.wallet-player-name {
  font-size: 0.75rem;
  font-weight: 900;
  color: #fff;
  margin-bottom: 0.15rem;
}

.wallet-balance-row {
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
  margin-bottom: 0.15rem;
}

.wallet-xp-val {
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: 900;
}

.wallet-xp-unit {
  font-size: 0.6rem;
  color: var(--text-muted);
}

.wallet-contribution-row {
  font-size: 0.55rem;
  color: var(--text-muted);
}

/* 默契共鳴標記 */
.synergy-status-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.synergy-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 30px;
  padding: 0.35rem 0.5rem;
  transition: var(--transition-smooth);
}

.synergy-badge.synergy-active {
  background: rgba(255, 183, 3, 0.08);
  border-color: var(--neon-gold);
  box-shadow: var(--shadow-neon-gold);
  animation: synergy-pulse-anim 2s infinite ease-in-out;
}

.synergy-icon {
  font-size: 0.95rem;
  color: var(--text-muted);
}
.synergy-active .synergy-icon {
  color: var(--neon-gold);
  text-shadow: 0 0 5px var(--neon-gold);
}

.synergy-text {
  font-size: 0.5rem;
  font-weight: bold;
  color: var(--text-muted);
  margin-top: 0.1rem;
}
.synergy-active .synergy-text {
  color: var(--neon-gold);
}

@keyframes synergy-pulse-anim {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* 進度條 */
.level-progress-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.xp-ratio-centered {
  text-align: center;
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 700;
  margin-top: 0.35rem;
  letter-spacing: 0.5px;
}

.total-xp-secondary {
  color: var(--text-muted);
  font-weight: normal;
}

.progress-bar-bg {
  height: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(to right, var(--neon-purple), var(--neon-blue));
  border-radius: 4px;
  position: relative;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 8px rgba(0, 180, 216, 0.4);
}

.progress-bar-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.15) 50%,
    transparent
  );
  animation: shimmer-anim 2s infinite linear;
  background-size: 200% 100%;
}

@keyframes shimmer-anim {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* 離線警告 */
.offline-warning-banner {
  margin-top: 1.25rem;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  background: rgba(255, 77, 109, 0.08);
  border: 1px solid rgba(255, 77, 109, 0.15);
  color: #ff4d6d;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  line-height: 1.4;
}

.warning-icon-svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.setup-link {
  color: #fff;
  text-decoration: underline;
  font-weight: 600;
}

.setup-link:hover {
  color: var(--neon-blue);
}

@media (min-width: 576px) {
  .guild-title {
    font-size: 1.5rem;
  }
  .title-wrapper {
    max-width: 400px;
  }
  .guild-level-badge {
    padding: 0.25rem 0.75rem;
    font-size: 0.9rem;
  }
}

/* ==========================================
   2.0 新增：頂部 Slim 導航列樣式
   ========================================== */
.guild-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.55rem 0.85rem;
  background: rgba(20, 24, 35, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 0.85rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.02);
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.top-bar-guild-icon {
  font-size: 1.05rem;
}

.top-bar-guild-name {
  font-weight: 850;
  font-size: 0.82rem;
  color: #fff;
  letter-spacing: 0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 105px;
}

.top-bar-level-badge {
  font-family: var(--font-title);
  font-size: 0.65rem;
  font-weight: 900;
  background: linear-gradient(135deg, var(--neon-gold), #ff9f1c);
  color: #000;
  padding: 0.05rem 0.35rem;
  border-radius: 5px;
  line-height: 1.2;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.top-bar-user-pill {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.18rem 0.45rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.72rem;
  font-weight: bold;
}

.pill-a {
  border-color: rgba(157, 78, 221, 0.25);
  background: rgba(157, 78, 221, 0.06);
}
.pill-a .top-bar-avatar {
  background: var(--neon-purple);
}
.pill-a .top-bar-balance {
  color: #c8b6ff;
}

.pill-b {
  border-color: rgba(0, 180, 216, 0.25);
  background: rgba(0, 180, 216, 0.06);
}
.pill-b .top-bar-avatar {
  background: var(--neon-blue);
}
.pill-b .top-bar-balance {
  color: #90e0ef;
}

.top-bar-avatar {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  font-size: 0.52rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 900;
  line-height: 1;
}

.top-bar-player-name {
  color: #fff;
  font-size: 0.7rem;
  max-width: 42px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-bar-balance {
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 0.7rem;
}

.btn-top-bar-switch {
  font-size: 0.65rem;
  padding: 0.2rem 0.45rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-top-bar-switch:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.15);
}

@media (max-width: 360px) {
  .top-bar-guild-name {
    max-width: 80px;
  }
  .top-bar-player-name {
    display: none;
  }
}
</style>
