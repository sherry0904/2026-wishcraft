<template>
  <div>
    <!-- 2.0 新增：精簡版頂部常駐 Slim Header (高質感、不佔版幅、固定於最上方) -->
    <div v-if="mode === 'compact'" class="guild-top-bar">
      <div class="top-bar-left">
        <span class="top-bar-guild-name">{{ guildName || '日常習慣養成公會' }}</span>
        <span class="top-bar-level-badge font-title">LV. {{ guildLevel }}</span>
      </div>
      
      <div class="top-bar-right" v-if="activePlayer">
        <span v-if="isSynergyActive" class="top-bar-synergy-glow" title="今日默契共鳴達成">⚡</span>
        <div class="top-bar-user-pill" :class="activePlayer === 'A' ? 'pill-a' : 'pill-b'">
          <span class="top-bar-avatar">{{ activePlayer === 'A' ? (playerAName || 'A').charAt(0) : (playerBName || 'B').charAt(0) }}</span>
          <span class="top-bar-player-name">{{ activePlayer === 'A' ? playerAName : playerBName }}</span>
          <span class="top-bar-balance">
            <span class="xp-number">{{ formatXp(activePlayer === 'A' ? playerABalance : playerBBalance) }}</span>
            <span class="xp-label">XP</span>
          </span>
        </div>
        <button class="btn-top-bar-switch" @click="$emit('switchPlayer')">切換</button>
      </div>
    </div>

    <!-- 滿版詳細大看板 (只在「報告」分頁顯示，不再常駐每一頁) -->
    <header v-else class="guild-header game-card">
      <!-- 標題與登入身分列 -->
      <div class="header-main">
        <div class="guild-info">
          <div class="title-wrapper">
            <h1 class="guild-title">公會成長總覽</h1>
            <span class="guild-subtitle">PROGRESS REPORT</span>
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

      <!-- 雙人發光錢包 -->
      <div class="players-wallets-grid">
        <!-- 玩家 A 錢包卡片 -->
        <div class="wallet-card card-player-a" :class="{ 'card-active': activePlayer === 'A' }">
          <div class="wallet-player-name">{{ playerAName }}</div>
          <div class="wallet-xp-num text-neon-purple">{{ formatXp(playerABalance) }}</div>
          <div class="wallet-xp-caption">XP 可用</div>
          <div class="wallet-contribution-row">
            <span class="contribution-label">生涯貢獻</span>
            <span class="contribution-value">{{ formatXp(playerAContribution) }} XP</span>
          </div>
        </div>

        <!-- 玩家 B 錢包卡片 -->
        <div class="wallet-card card-player-b" :class="{ 'card-active': activePlayer === 'B' }">
          <div class="wallet-player-name">{{ playerBName }}</div>
          <div class="wallet-xp-num text-neon-blue">{{ formatXp(playerBBalance) }}</div>
          <div class="wallet-xp-caption">XP 可用</div>
          <div class="wallet-contribution-row">
            <span class="contribution-label">生涯貢獻</span>
            <span class="contribution-value">{{ formatXp(playerBContribution) }} XP</span>
          </div>
        </div>
      </div>

      <!-- 默契共鳴橫幅：僅當日雙方都有打卡時顯示 -->
      <div v-if="isSynergyActive" class="synergy-banner">
        <span class="synergy-banner-icon">⚡</span>
        <span class="synergy-banner-text">今日默契共鳴達成！雙方均已完成任務</span>
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
          目前經驗值: {{ formatXp(xpInCurrentLevel) }} / {{ formatXp(totalXpNeededInCurrentLevel) }} XP <span class="total-xp-secondary">(總積分: {{ formatXp(totalXp) }} XP)</span>
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

      <!-- 2.0 移入：里程碑解鎖總進度條 -->
      <div class="milestones-timeline-section">
        <div class="milestone-section-title">公會養成里程碑 (永久累積成就)</div>
        
        <div class="milestones-timeline-container">
          <div class="milestones-scroll-wrapper">
            <div class="milestones-scroll-content">
              <div class="timeline-line">
                <div class="timeline-fill" :style="{ width: `${totalTimelinePercentage}%` }"></div>
              </div>
              
              <div class="milestones-list">
                <div 
                  v-for="ms in displayMilestones" 
                  :key="ms.Tier"
                  class="milestone-node"
                  :class="{ 
                    'milestone-unlocked': totalXp >= ms.XPThreshold,
                    'milestone-next': nextMilestone && nextMilestone.Tier === ms.Tier
                  }"
                >
                  <div class="milestone-chest">
                    <!-- 旗幟 (起點) -->
                    <svg 
                      v-if="ms.Tier === 0" 
                      class="lock-icon icon-flag"
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      stroke-width="2.5" 
                      stroke-linecap="round" 
                      stroke-linejoin="round"
                    >
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                      <line x1="4" y1="22" x2="4" y2="15"></line>
                    </svg>
                    <!-- 已解鎖 -->
                    <svg 
                      v-else-if="totalXp >= ms.XPThreshold" 
                      class="lock-icon icon-unlocked" 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      stroke-width="2.5" 
                      stroke-linecap="round" 
                      stroke-linejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                    </svg>
                    <!-- 未解鎖 -->
                    <svg 
                      v-else 
                      class="lock-icon icon-locked" 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      stroke-width="2.5" 
                      stroke-linecap="round" 
                      stroke-linejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <div class="milestone-info">
                    <span class="milestone-xp">{{ formatXp(ms.XPThreshold) }} XP</span>
                    <span class="milestone-name" :title="ms.RewardName">{{ ms.RewardName }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface Milestone {
  Tier: number
  XPThreshold: number
  RewardName: string
  Description: string
  Unlocked: boolean
}

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
    milestones?: Milestone[]
  }>(),
  {
    mode: 'full',
    milestones: () => []
  }
)

const emit = defineEmits<{
  (e: 'logout'): void
  (e: 'switchPlayer'): void
}>()

// 確定下一個未解鎖的里程碑
const nextMilestone = computed(() => {
  return props.milestones
    .filter(ms => props.totalXp < ms.XPThreshold)
    .sort((a, b) => a.XPThreshold - b.XPThreshold)[0] || null
})

// 在里程碑最前頭插入一個「0 XP 冒險開始」的起始點
const displayMilestones = computed(() => {
  const startNode: Milestone = {
    Tier: 0,
    XPThreshold: 0,
    RewardName: '養成起點',
    Description: '攜手開始日常養成與福利解鎖！',
    Unlocked: true
  }
  const sorted = [...(props.milestones || [])].sort((a, b) => a.XPThreshold - b.XPThreshold)
  return [startNode, ...sorted]
})

// 「段落插值法」計算進度條百分比
const totalTimelinePercentage = computed(() => {
  const list = displayMilestones.value
  const n = list.length
  if (n <= 1) return 0
  
  const totalXpVal = props.totalXp
  
  let segmentIndex = 0
  for (let i = 0; i < n; i++) {
    if (totalXpVal >= list[i].XPThreshold) {
      segmentIndex = i
    } else {
      break
    }
  }
  
  if (segmentIndex === n - 1) {
    return 100
  }
  
  const x0 = list[segmentIndex].XPThreshold
  const x1 = list[segmentIndex + 1].XPThreshold
  const y0 = (segmentIndex / (n - 1)) * 100
  const y1 = ((segmentIndex + 1) / (n - 1)) * 100
  
  const ratio = (totalXpVal - x0) / (x1 - x0)
  const pct = y0 + ratio * (y1 - y0)
  
  return Math.min(Math.max(pct, 0), 100)
})

// 根據里程碑動態計算等級與升級所需經驗值
const sortedMilestones = computed(() => {
  return [...(props.milestones || [])].sort((a, b) => a.XPThreshold - b.XPThreshold)
})

const guildLevel = computed(() => {
  if (sortedMilestones.value.length === 0) {
    return Math.floor(props.totalXp / 500) + 1
  }
  
  let currentLevel = 0
  for (let i = 0; i < sortedMilestones.value.length; i++) {
    if (props.totalXp >= sortedMilestones.value[i].XPThreshold) {
      currentLevel = sortedMilestones.value[i].Tier
    } else {
      break
    }
  }
  return currentLevel
})

// 當前等級對應的 XP 起點與升級目標
const currentLevelMinXp = computed(() => {
  if (sortedMilestones.value.length === 0) {
    return Math.floor(props.totalXp / 500) * 500
  }
  
  const level = guildLevel.value
  if (level === 0) return 0
  
  const currentMs = sortedMilestones.value.find(ms => ms.Tier === level)
  return currentMs ? currentMs.XPThreshold : 0
})

const nextLevelMaxXp = computed(() => {
  if (sortedMilestones.value.length === 0) {
    return (Math.floor(props.totalXp / 500) + 1) * 500
  }
  
  const level = guildLevel.value
  const nextMs = sortedMilestones.value.find(ms => ms.Tier === level + 1)
  return nextMs ? nextMs.XPThreshold : (sortedMilestones.value[sortedMilestones.value.length - 1]?.XPThreshold || 1000)
})

// 當前等級內已獲得的 XP 以及升級總共需要的 XP
const xpInCurrentLevel = computed(() => {
  return Math.max(0, props.totalXp - currentLevelMinXp.value)
})

const totalXpNeededInCurrentLevel = computed(() => {
  return Math.max(1, nextLevelMaxXp.value - currentLevelMinXp.value)
})

const levelProgressPercentage = computed(() => {
  const pct = (xpInCurrentLevel.value / totalXpNeededInCurrentLevel.value) * 100
  return Math.min(Math.max(pct, 0), 100)
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

function formatXp(value: number): string {
  return new Intl.NumberFormat('zh-TW').format(Math.max(0, Math.round(Number(value) || 0)))
}
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

.wallet-xp-num {
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: 900;
  letter-spacing: 2px;
  line-height: 1;
  white-space: nowrap;
  margin-bottom: 0.1rem;
}

.wallet-xp-caption {
  font-size: 0.6rem;
  color: var(--text-muted);
  letter-spacing: 2px;
  white-space: nowrap;
  margin-bottom: 0.15rem;
}

.wallet-contribution-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: 0.3rem;
  padding-top: 0.28rem;
  gap: 0.25rem;
}

.contribution-label {
  font-size: 0.6rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.contribution-value {
  font-size: 0.6rem;
  font-family: var(--font-title);
  color: var(--text-secondary);
  letter-spacing: 0.5px;
  white-space: nowrap;
}

/* 默契共鳴橫幅 */
.synergy-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: rgba(255, 183, 3, 0.06);
  border: 1px solid rgba(255, 183, 3, 0.2);
  border-radius: 8px;
  padding: 0.4rem 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.7rem;
  animation: synergy-pulse-anim 2s infinite ease-in-out;
}

.synergy-banner-icon {
  color: var(--neon-gold);
  text-shadow: 0 0 6px rgba(255, 183, 3, 0.6);
  font-size: 0.85rem;
}

.synergy-banner-text {
  color: var(--neon-gold);
  letter-spacing: 0.3px;
}

/* 頂部常駐列共鳴指示燈 */
.top-bar-synergy-glow {
  font-size: 0.8rem;
  color: var(--neon-gold);
  text-shadow: 0 0 6px rgba(255, 183, 3, 0.7);
  animation: synergy-pulse-anim 2s infinite ease-in-out;
  flex-shrink: 0;
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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 1000;
  border-radius: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.65rem 1rem;
  background: rgba(11, 12, 16, 0.95); /* 與 body 背景融合 */
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  box-sizing: border-box;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0; /* 容許縮減 */
}

.top-bar-guild-name {
  font-weight: 850;
  font-size: 0.85rem;
  color: #fff;
  letter-spacing: 0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px; /* 放寬長度，防止隨便變 ... */
  min-width: 0;
}

.top-bar-level-badge {
  font-family: var(--font-title);
  font-size: 0.65rem;
  font-weight: 900;
  background: linear-gradient(135deg, var(--neon-gold), #ff9f1c);
  color: #000;
  padding: 0.08rem 0.3rem;
  border-radius: 4px;
  line-height: 1.1;
  flex-shrink: 0;
  white-space: nowrap;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-shrink: 0;
}

.top-bar-user-pill {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.5rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.72rem;
  font-weight: bold;
  white-space: nowrap;
  flex-shrink: 0; /* 防止收縮擠壓 */
}

.pill-a {
  border-color: rgba(157, 78, 221, 0.3);
  background: rgba(157, 78, 221, 0.08);
}
.pill-a .top-bar-avatar {
  background: var(--neon-purple);
}
.pill-a .top-bar-balance {
  color: #c8b6ff;
}

.pill-b {
  border-color: rgba(0, 180, 216, 0.3);
  background: rgba(0, 180, 216, 0.08);
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
  flex-shrink: 0;
}

.top-bar-player-name {
  color: #fff;
  font-size: 0.7rem;
  max-width: 45px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-bar-balance {
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 0.7rem;
  white-space: nowrap; /* 確保點數 XP 絕不斷行 */
  display: inline-flex;
  align-items: baseline;
  gap: 0.38rem;
  font-variant-numeric: tabular-nums;
}

.xp-number {
  letter-spacing: 0.55px;
}

.xp-label {
  letter-spacing: 2px;
}

.btn-top-bar-switch {
  font-size: 0.7rem;
  padding: 0.2rem 0.45rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap; /* 確保按鈕文字絕不斷行 */
  flex-shrink: 0;
  transition: var(--transition-smooth);
}

.btn-top-bar-switch:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.15);
}

@media (max-width: 375px) {
  .top-bar-guild-name {
    max-width: 90px;
  }
}

@media (max-width: 320px) {
  .top-bar-guild-name {
    display: none;
  }
}

/* 2.0 移入：里程碑養成進度條 */
.milestones-timeline-section {
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 1.25rem 1.25rem;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.milestone-section-title {
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
  text-align: left;
}

.milestones-timeline-container {
  position: relative;
  margin: 0.5rem 0;
}

.milestones-scroll-wrapper {
  overflow-x: auto;
  padding-bottom: 0.8rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.milestones-scroll-content {
  position: relative;
  min-width: max-content;
  width: 100%;
  padding: 1rem 0;
}

.timeline-line {
  position: absolute;
  top: 1.95rem; 
  left: 3.1rem; 
  right: 3.1rem; 
  height: 2px;
  background: rgba(255, 255, 255, 0.06);
  z-index: 1;
}

.timeline-fill {
  height: 100%;
  background: linear-gradient(to right, var(--neon-purple), var(--neon-gold));
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-neon-gold);
}

.milestones-list {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  position: relative;
  z-index: 2;
}

.milestone-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-width: 100px;
}

.milestone-chest {
  width: 30px;
  height: 30px;
  background: #141822;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
  transition: var(--transition-smooth);
}

.lock-icon {
  width: 13px;
  height: 13px;
  stroke: rgba(255, 255, 255, 0.3);
  transition: var(--transition-smooth);
}

.icon-flag {
  stroke: var(--text-muted);
}

.milestone-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.milestone-xp {
  font-family: var(--font-title);
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
}

.milestone-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  max-width: 90px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.milestone-unlocked .milestone-chest {
  border-color: var(--neon-gold);
  background: rgba(255, 183, 3, 0.08);
  box-shadow: var(--shadow-neon-gold);
}

.milestone-unlocked .lock-icon {
  stroke: var(--neon-gold);
}

.milestone-unlocked .icon-flag {
  stroke: var(--neon-gold);
}

.milestone-unlocked .milestone-xp {
  color: var(--neon-gold);
}

.milestone-unlocked .milestone-name {
  color: #fff;
}
</style>
