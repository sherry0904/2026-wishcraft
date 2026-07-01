<template>
  <div class="loot-dashboard game-card">
    <!-- 面板標題 -->
    <div class="dashboard-header">
      <div class="title-wrapper">
        <h2 class="dashboard-title">戰利品與夢想商店</h2>
        <span class="board-subtitle">DREAM SHOP & MILESTONES</span>
      </div>
      
      <!-- 夢想金庫可用餘額顯示 -->
      <div class="treasury-card">
        <div class="treasury-label">可用夢想點數</div>
        <div class="treasury-value text-neon-gold">{{ currentBalance }} <span class="xp-unit">XP</span></div>
      </div>
    </div>

    <!-- 1. 里程碑解鎖總進度條 -->
    <div class="milestones-timeline-section">
      <div class="section-title">公會養成里程碑 (永久等級解鎖)</div>
      
      <div class="milestones-timeline-container">
        <!-- 滾動包裝容器，使進度條與寶箱節點一起滾動，不再錯位 -->
        <div class="milestones-scroll-wrapper">
          <div class="milestones-scroll-content">
            <!-- 進度條線與發光填充 (基於段落插值百分比) -->
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
                <!-- 寶箱節點圖示 -->
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
                <!-- 節點文字資訊 -->
                <div class="milestone-info">
                  <span class="milestone-xp">{{ ms.XPThreshold }} XP</span>
                  <span class="milestone-name" :title="ms.RewardName">{{ ms.RewardName }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. 夢想商店商品櫥窗 -->
    <div class="shop-section">
      <div class="section-title">夢想點數商店</div>
      
      <div class="shop-grid">
        <div 
          v-for="item in shopItems" 
          :key="item.Tier" 
          class="shop-item-card"
          :class="{
            'item-locked': totalXp < item.XPThreshold,
            'item-redeemable': totalXp >= item.XPThreshold && currentBalance >= item.XPThreshold,
            'item-insufficient': totalXp >= item.XPThreshold && currentBalance < item.XPThreshold
          }"
        >
          <!-- 商品標籤 -->
          <div class="item-badge">
            <span v-if="totalXp < item.XPThreshold" class="badge-status badge-locked-txt">未解鎖</span>
            <span v-else-if="currentBalance >= item.XPThreshold" class="badge-status badge-ready-txt">可兌換</span>
            <span v-else class="badge-status badge-saving-txt">儲蓄中</span>
          </div>

          <div class="item-header">
            <h4 class="item-name">{{ item.RewardName }}</h4>
            <div class="item-cost">{{ item.XPThreshold }} <span class="cost-unit">XP</span></div>
          </div>
          
          <p class="item-desc">{{ item.Description }}</p>

          <div class="item-actions">
            <!-- 情況 A：公會等級尚未解鎖 -->
            <button 
              v-if="totalXp < item.XPThreshold" 
              class="btn-shop btn-locked" 
              disabled
            >
              鎖定中 (需總額達 {{ item.XPThreshold }} XP)
            </button>
            
            <!-- 情況 B：點數不足 -->
            <button 
              v-else-if="currentBalance < item.XPThreshold" 
              class="btn-shop btn-insufficient" 
              disabled
            >
              餘額不足 (還差 {{ item.XPThreshold - currentBalance }} XP)
            </button>
            
            <!-- 情況 C：可兌換 -->
            <button 
              v-else 
              class="btn-shop btn-redeem"
              :disabled="isRedeeming"
              @click="confirmRedeem(item)"
            >
              扣點兌換
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 兌換確認彈窗 Modal -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-card game-card">
        <h3 class="modal-title text-neon-gold">確認兌換獎勵</h3>
        <p class="modal-text">
          確定要扣除 <strong class="text-neon-gold">{{ selectedReward?.XPThreshold }} XP</strong> 金庫點數，
          兌換 <strong class="text-white">【{{ selectedReward?.RewardName }}】</strong> 嗎？
        </p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showModal = false">取消</button>
          <button class="btn-confirm-redeem" @click="executeRedeem">確認扣點</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

export interface Milestone {
  Tier: number
  XPThreshold: number
  RewardName: string
  Description: string
  Unlocked: boolean
}

const props = defineProps<{
  totalXp: number
  currentBalance: number
  milestones: Milestone[]
  shopItems: Milestone[]
  isRedeeming: boolean
}>()

const emit = defineEmits<{
  (e: 'redeemReward', payload: Milestone): void
}>()

const showModal = ref(false)
const selectedReward = ref<Milestone | null>(null)

// 確定下一個未解鎖的里程碑
const nextMilestone = computed(() => {
  return props.milestones
    .filter(ms => props.totalXp < ms.XPThreshold)
    .sort((a, b) => a.XPThreshold - b.XPThreshold)[0] || null
})

// 在里程碑最前頭插入一個「0 XP 冒險開始」的虛擬起始點，便於進行精準的進度比例計算
const displayMilestones = computed(() => {
  const startNode: Milestone = {
    Tier: 0,
    XPThreshold: 0,
    RewardName: '冒險開始',
    Description: '開啟養成養成與解鎖之旅！',
    Unlocked: true
  }
  return [startNode, ...props.milestones]
})

// 「段落插值法」計算進度條百分比
// 使進度填充恰好對齊寶箱的視覺位置，而非完全採大數線性比例（避免 240/20000 造成橘線完全不長的問題）
const totalTimelinePercentage = computed(() => {
  const list = displayMilestones.value
  const n = list.length
  if (n <= 1) return 0
  
  const totalXpVal = props.totalXp
  
  // 找出目前所屬的區間 (Segment Index)
  let segmentIndex = 0
  for (let i = 0; i < n; i++) {
    if (totalXpVal >= list[i].XPThreshold) {
      segmentIndex = i
    } else {
      break
    }
  }
  
  // 若已經超越最後一個里程碑，滿格
  if (segmentIndex === n - 1) {
    return 100
  }
  
  // 進行區段間的線性插值
  const x0 = list[segmentIndex].XPThreshold
  const x1 = list[segmentIndex + 1].XPThreshold
  
  // 計算在畫面上對應的等分百分比點位
  const y0 = (segmentIndex / (n - 1)) * 100
  const y1 = ((segmentIndex + 1) / (n - 1)) * 100
  
  const ratio = (totalXpVal - x0) / (x1 - x0)
  const pct = y0 + ratio * (y1 - y0)
  
  return Math.min(Math.max(pct, 0), 100)
})

function confirmRedeem(reward: Milestone) {
  selectedReward.value = reward
  showModal.value = true
}

function executeRedeem() {
  if (selectedReward.value) {
    emit('redeemReward', selectedReward.value)
  }
  showModal.value = false
}
</script>

<style scoped>
.loot-dashboard {
  margin-bottom: 2rem;
  border-top: 3px solid var(--neon-gold);
}

.dashboard-header {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.title-wrapper {
  display: flex;
  flex-direction: column;
}

.dashboard-title {
  font-family: var(--font-body);
  font-size: 1.3rem;
  font-weight: 900;
  letter-spacing: 2px;
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 183, 3, 0.25);
}

.board-subtitle {
  font-family: var(--font-title);
  font-size: 0.65rem;
  letter-spacing: 3px;
  color: var(--text-secondary);
  opacity: 0.8;
  margin-top: 0.15rem;
}

/* 夢想金庫卡片 */
.treasury-card {
  background: rgba(255, 183, 3, 0.08);
  border: 1px solid var(--neon-gold);
  box-shadow: var(--shadow-neon-gold);
  border-radius: 10px;
  padding: 0.5rem 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.treasury-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-weight: bold;
}

.treasury-value {
  font-family: var(--font-title);
  font-size: 1.3rem;
  font-weight: 900;
}

.xp-unit {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.section-title {
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  letter-spacing: 1px;
}

/* 時間軸進度條區塊 */
.milestones-timeline-section {
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 1.25rem 1.25rem;
  margin-bottom: 2rem;
}

.milestones-timeline-container {
  position: relative;
  margin: 0.5rem 0;
}

/* 橫向滾動外框 */
.milestones-scroll-wrapper {
  overflow-x: auto;
  padding-bottom: 0.8rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

/* 橫向滾動主容器：決定線條與寶箱的長度基準 */
.milestones-scroll-content {
  position: relative;
  min-width: max-content;
  width: 100%;
  padding: 1rem 0;
}

/* 進度條背景軌道：現在使用 absolute 與節點對齊 */
.timeline-line {
  position: absolute;
  top: 1.95rem; /* 剛好處於寶箱 30px 高度的一半 */
  left: 3.1rem; /* 剛好處於第一個節點(冒險開始)的中心處 */
  right: 3.1rem; /* 剛好處於最後一個節點的中心處 */
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

/* 夢想商店商品櫥窗 */
.shop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
}

.shop-item-card {
  position: relative;
  background: rgba(20, 24, 35, 0.4);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 160px;
  transition: var(--transition-smooth);
}

.shop-item-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.item-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
}

.badge-status {
  font-size: 0.6rem;
  font-weight: 800;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.badge-locked-txt {
  background: rgba(0, 0, 0, 0.3);
  color: var(--text-muted);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.badge-saving-txt {
  background: rgba(255, 183, 3, 0.05);
  color: var(--neon-gold);
  border: 1px solid rgba(255, 183, 3, 0.15);
}

.badge-ready-txt {
  background: rgba(6, 214, 160, 0.08);
  color: var(--neon-green);
  border: 1px solid rgba(6, 214, 160, 0.25);
  box-shadow: 0 0 5px rgba(6, 214, 160, 0.1);
}

.item-header {
  margin-bottom: 0.5rem;
  padding-right: 3rem;
}

.item-name {
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 800;
  color: #fff;
}

.item-cost {
  font-family: var(--font-title);
  font-size: 1.1rem;
  font-weight: 900;
  color: var(--neon-gold);
  margin-top: 0.2rem;
}

.cost-unit {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-weight: normal;
}

.item-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin-bottom: 1.25rem;
  flex-grow: 1;
}

.btn-shop {
  width: 100%;
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.55rem;
  cursor: pointer;
  transition: var(--transition-smooth);
}

/* 可兌換 */
.item-redeemable {
  border-color: rgba(6, 214, 160, 0.15);
}
.btn-redeem {
  background: linear-gradient(135deg, #06d6a0, #05a87d);
  border: none;
  color: #0b0c10;
  box-shadow: var(--shadow-neon-green);
}
.btn-redeem:hover {
  transform: translateY(-1px);
  filter: brightness(1.1);
  box-shadow: 0 0 12px rgba(6, 214, 160, 0.4);
}

/* 點數不足 */
.btn-insufficient {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  cursor: not-allowed;
}

/* 鎖定中 */
.item-locked {
  opacity: 0.6;
}
.btn-locked {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.02);
  color: var(--text-muted);
  cursor: not-allowed;
}

/* Modal */
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
}

.modal-title {
  font-family: var(--font-body);
  font-size: 1.15rem;
  font-weight: 900;
  margin-bottom: 0.75rem;
  letter-spacing: 1px;
}

.modal-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1.75rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-cancel:hover {
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.btn-confirm-redeem {
  background: var(--neon-gold);
  border: none;
  color: #0b0c10;
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: var(--shadow-neon-gold);
  transition: var(--transition-smooth);
}

.btn-confirm-redeem:hover {
  filter: brightness(1.1);
  box-shadow: 0 0 12px rgba(255, 183, 3, 0.4);
}
</style>
