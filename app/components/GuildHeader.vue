<template>
  <header class="guild-header game-card">
    <div class="header-main">
      <div class="guild-info">
        <div class="title-wrapper">
          <h1 class="guild-title">{{ guildName || '日常習慣共鬥公會' }}</h1>
          <span class="guild-subtitle">DAILY HABIT CO-OP GUILD</span>
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
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  guildName: string
  playerAName: string
  playerBName: string
  totalXp: number
  activePlayer: 'A' | 'B' | null
  isOffline: boolean
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
</style>
