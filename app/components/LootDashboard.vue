<template>
  <div class="loot-dashboard game-card">
    <!-- 面板標題 -->
    <div class="dashboard-header">
      <div class="title-wrapper">
        <h2 class="dashboard-title">養成福利與商店</h2>
        <span class="board-subtitle">DREAM SHOP & MILESTONES</span>
      </div>
      
      <!-- 個人錢包可用餘額顯示 -->
      <div v-if="activePlayer" class="treasury-card">
        <div class="treasury-label">{{ activePlayerName }} 目前可用點數</div>
        <div class="treasury-value text-neon-gold">
          <span class="treasury-value-number">{{ formatXp(currentBalance) }}</span>
          <span class="xp-unit">XP</span>
        </div>
      </div>
    </div>



    <!-- 2.0 新增：我的收件夾 / 禮物卡盒 (Gift Box) -->
    <div class="giftbox-section">
      <div class="giftbox-header-row">
        <div class="section-title">🎁 我的禮物卡盒</div>
        <button 
          v-if="activePlayer" 
          class="btn-send-custom-note"
          @click="openCustomNoteModal"
        >
          💌 寫張愛心小卡
        </button>
      </div>
      
      <div v-if="!activePlayer" class="spectator-alert-box">
        💡 提示：請登入身分（萱或至），即可在此查看、寫小卡送給夥伴，或兌換收到的禮物。
      </div>
      
      <div v-else-if="myGifts.length === 0" class="empty-gifts-box">
        禮物卡盒目前空空如也。點選右上角「寫張愛心小卡」送給同伴，或者玩下方的幸運扭蛋吧！
      </div>
      
      <div v-else class="gifts-scroll-container">
        <!-- 未使用卡盒區 -->
        <div v-if="myUnusedGifts.length === 0" class="no-unused-alert">
          🎉 目前所有卡片已全部使用或已讀！
        </div>
        <div v-else class="gifts-grid">
          <div 
            v-for="gift in myUnusedGifts" 
            :key="gift.Id" 
            class="gift-card"
            :class="[
              gift.Sender === 'A' ? 'gift-from-a' : 'gift-from-b'
            ]"
          >
            <div class="gift-badge-top">
              From: {{ gift.Message?.startsWith('🎰') ? '🎰 幸運扭蛋機' : (gift.Sender === 'A' ? playerAName : playerBName) }}
              <span class="gift-status-lbl">未使用</span>
            </div>
            
            <h4 class="gift-title-name">{{ gift.RewardName }}</h4>
            
            <div class="gift-msg-bubble">
              <span class="quote-mark">“</span>
              <p class="gift-msg-text">{{ gift.Message || '今天請享受這份小禮物！' }}</p>
              <span class="quote-mark">”</span>
            </div>

            <div class="gift-footer">
              <span class="gift-time-txt">{{ formatTimeAgo(gift.Timestamp) }}</span>
              <button 
                class="btn-claim-gift" 
                :disabled="claimingGifts[gift.Id]"
                @click="claimGift(gift.Id)"
              >
                {{ claimingGifts[gift.Id] ? '使用中...' : getGiftButtonText(gift) }}
              </button>
            </div>
          </div>
        </div>

        <!-- 已使用/已讀存檔區 -->
        <div v-if="myUsedGifts.length > 0" class="archived-gifts-toggle">
          <button @click="showArchivedGifts = !showArchivedGifts" class="btn-toggle-archive">
            {{ showArchivedGifts ? '▼ 收起已使用/已讀卡片' : `▶ 展開已使用/已讀卡片 (${myUsedGifts.length})` }}
          </button>
        </div>

        <div v-if="showArchivedGifts && myUsedGifts.length > 0" class="gifts-grid gifts-grid-archived">
          <div 
            v-for="gift in myUsedGifts" 
            :key="gift.Id" 
            class="gift-card gift-used"
            :class="[
              gift.Sender === 'A' ? 'gift-from-a' : 'gift-from-b'
            ]"
          >
            <div class="gift-badge-top">
              From: {{ gift.Message?.startsWith('🎰') ? '🎰 幸運扭蛋機' : (gift.Sender === 'A' ? playerAName : playerBName) }}
              <span class="gift-status-lbl">已使用/已讀</span>
            </div>
            
            <h4 class="gift-title-name">{{ gift.RewardName }}</h4>
            
            <div class="gift-msg-bubble">
              <span class="quote-mark">“</span>
              <p class="gift-msg-text">{{ gift.Message || '今天請享受這份小禮物！' }}</p>
              <span class="quote-mark">”</span>
            </div>

            <div class="gift-footer">
              <span class="gift-time-txt">
                {{ gift.UsedTimestamp ? `已於 ${formatDateTime(gift.UsedTimestamp)} 兌換` : `已兌換 (${formatTimeAgo(gift.Timestamp)})` }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 夢想商店與扭蛋 -->
    <div class="shop-section">
      <div class="section-title">🛒 養成福利商店</div>
      
      <div class="shop-grid">
        <!-- 🎰 幸運盲盒扭蛋卡片 (2.0 新增) -->
        <div 
          class="shop-item-card gacha-card"
          :class="{
            'item-insufficient': currentBalance < 100 && activePlayer,
            'item-locked': !activePlayer
          }"
        >
          <div class="item-badge">
            <span class="badge-status badge-gacha-txt">驚喜盲盒</span>
          </div>
          
          <div class="item-header">
            <h4 class="item-name text-neon-gold">🎰 幸運養成扭蛋機</h4>
            <div class="item-cost text-neon-gold">{{ formatXp(100) }} <span class="cost-unit">XP</span></div>
          </div>
          
          <p class="item-desc">消費 100 XP 個人額度，隨機抽取實體福利卡（如搥背券、免洗碗卡、愛心早餐卡或請假券等）送入您的卡盒！</p>
          
          <div class="item-actions">
            <button 
              v-if="!activePlayer" 
              class="btn-shop btn-locked" 
              disabled
            >
              鎖定中 (請登入身分)
            </button>
            <button 
              v-else-if="currentBalance < 100" 
              class="btn-shop btn-insufficient" 
              disabled
            >
              餘額不足 (還差 {{ formatXp(100 - currentBalance) }} XP)
            </button>
            <button 
              v-else 
              class="btn-shop btn-gacha"
              :disabled="isSpanning || isRedeeming"
              @click="spinGacha"
            >
              {{ isSpanning ? '扭蛋運轉中...' : '啟動 100 XP 扭蛋' }}
            </button>
          </div>
        </div>

        <!-- 一般兌換商品 -->
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
            <span v-if="totalXp < item.XPThreshold" class="badge-status badge-locked-txt">公會未達標</span>
            <span v-else-if="currentBalance >= item.XPThreshold" class="badge-status badge-ready-txt">可兌換</span>
            <span v-else class="badge-status badge-saving-txt">儲蓄中</span>
          </div>

          <div class="item-header">
            <h4 class="item-name">{{ item.RewardName }}</h4>
            <div class="item-cost">{{ formatXp(item.XPThreshold) }} <span class="cost-unit">XP</span></div>
          </div>
          
          <p class="item-desc">{{ item.Description }}</p>

          <div class="item-actions">
            <!-- 情況 A：公會等級尚未解鎖 -->
            <button 
              v-if="totalXp < item.XPThreshold" 
              class="btn-shop btn-locked" 
              disabled
            >
              公會等級鎖定 (需累積 {{ formatXp(item.XPThreshold) }} XP)
            </button>
            
            <!-- 情況 B：點數不足 -->
            <button 
              v-else-if="currentBalance < item.XPThreshold" 
              class="btn-shop btn-insufficient" 
              disabled
            >
              錢包點數不足 (還差 {{ formatXp(item.XPThreshold - currentBalance) }} XP)
            </button>
            
            <!-- 情況 C：可兌換 -->
            <button 
              v-else 
              class="btn-shop btn-redeem"
              :disabled="isRedeeming || isSpanning"
              @click="confirmRedeem(item)"
            >
              扣點兌換
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 2.0 新增：傳送門彈窗組件，避免 layout 限制造成偏位 -->
    <ClientOnly>
      <Teleport to="body">
        <!-- 2.0 新增：送禮與留言悄悄話彈窗 Modal -->
        <div v-if="showModal" class="modal-overlay">
          <div class="modal-card game-card">
            <h3 class="modal-title text-neon-gold">確認兌換獎勵</h3>
            
            <!-- 如果是自訂驚喜券 (Tier 8) -->
            <div v-if="selectedReward?.Tier === 8" class="custom-coupon-inputs">
              <p class="modal-text">
                您即將花費 <strong class="text-neon-gold">{{ formatXp(selectedReward?.XPThreshold || 0) }} XP</strong> 兌換一張自訂券送給夥伴。
              </p>
              <div class="message-input-wrapper">
                <label class="input-lbl">🎨 請輸入您的自訂券面名稱：</label>
                <input 
                  type="text" 
                  class="input-text" 
                  v-model="customCouponTitle" 
                  placeholder="例如：做家事一次券、捶背 10 分鐘券"
                  maxlength="20"
                  style="margin-bottom: 0.50rem;"
                />
              </div>
            </div>
            
            <!-- 一般商品 -->
            <div v-else>
              <p class="modal-text">
                您即將花費 <strong class="text-neon-gold">{{ formatXp(selectedReward?.XPThreshold || 0) }} XP</strong> 兌換 <strong class="text-white">【{{ selectedReward?.RewardName }}】</strong>。
              </p>
            </div>
            
            <!-- 分流切換 (如果非 Tier 8，我們讓使用者選擇自己使用或送禮；如果是 Tier 8，我們強制為送禮且不顯示分流切換) -->
            <div v-if="selectedReward?.Tier !== 8" class="redeem-type-selector">
              <label class="radio-label">
                <input type="radio" value="self" v-model="redeemType" />
                <span class="custom-radio"></span>
                自己使用 (存入我的卡盒)
              </label>
              <label class="radio-label">
                <input type="radio" value="gift" v-model="redeemType" />
                <span class="custom-radio"></span>
                送給夥伴 (寫下留言悄悄話)
              </label>
            </div>

            <!-- 悄悄話留言框 (送禮時顯示) -->
            <div v-if="redeemType === 'gift' || selectedReward?.Tier === 8" class="message-input-wrapper">
              <label class="input-lbl">💌 給夥伴的留言悄悄話：</label>
              <textarea 
                class="textarea-msg" 
                v-model="giftMessage" 
                placeholder="今天辛苦啦！這張特別券送你，隨時可以使用喔！"
                maxlength="150"
              ></textarea>
            </div>

            <div class="modal-actions">
              <button class="btn-cancel" :disabled="isRedeemingCoupon" @click="showModal = false">取消</button>
              <button 
                class="btn-confirm-redeem" 
                :disabled="isRedeemingCoupon || (selectedReward?.Tier === 8 && !customCouponTitle.trim())"
                @click="executeRedeem"
              >
                {{ isRedeemingCoupon ? '正在兌換...' : '確認扣點' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 2.0 新增：寫愛心自訂卡片彈窗 Modal -->
        <div v-if="showCustomNoteModal" class="modal-overlay">
          <div class="modal-card game-card custom-note-modal">
            <h3 class="modal-title text-neon-gold">💌 寫張愛心小卡給夥伴</h3>
            <p class="modal-text">寫下你想對夥伴說的話。如果想贈送點數，也可以自由附帶（從您錢包扣除並充值進夥伴錢包）。</p>
            
            <!-- 主題圖標選擇 -->
            <div class="theme-selection-area">
              <label class="input-lbl">選擇卡片主題：</label>
              <div class="themes-grid">
                <button 
                  v-for="theme in cardThemes" 
                  :key="theme.emoji"
                  class="btn-theme-select"
                  :class="{ 'theme-selected': selectedThemeEmoji === theme.emoji }"
                  @click="selectedThemeEmoji = theme.emoji"
                >
                  <span class="theme-emoji">{{ theme.emoji }}</span>
                  <span class="theme-name">{{ theme.label }}</span>
                </button>
              </div>
            </div>

            <!-- 小卡悄悄話留言 -->
            <div class="message-input-wrapper">
              <label class="input-lbl">小卡悄悄話內容：</label>
              <textarea 
                class="textarea-msg textarea-custom-note" 
                v-model="customNoteMessage" 
                placeholder="今天辛苦啦！謝謝你昨天的幫忙，祝你有個美好的一天！"
                maxlength="150"
              ></textarea>
            </div>

            <!-- 附帶點數給對方 -->
            <div class="xp-attachment-section">
              <label class="input-lbl">附帶贈送點數：</label>
              <div class="xp-options-grid">
                <button 
                  v-for="val in xpOptions" 
                  :key="val"
                  class="btn-xp-option"
                  :class="{ 'xp-opt-selected': attachedXpToSend === val }"
                  :disabled="val > currentBalance"
                  @click="attachedXpToSend = val"
                >
                  {{ val === 0 ? '不附帶' : `+${val} XP` }}
                </button>
              </div>
              <p v-if="attachedXpToSend > 0" class="xp-attachment-hint">
                💡 送出後將扣減您的錢包 <strong class="text-neon-gold">{{ formatXp(attachedXpToSend) }} XP</strong>，對方點選使用卡片時會增加該點數。
              </p>
            </div>

            <div class="modal-actions">
              <button class="btn-cancel" :disabled="isSendingNote" @click="showCustomNoteModal = false">取消</button>
              <button 
                class="btn-confirm-redeem" 
                :disabled="isSendingNote"
                @click="executeSendCustomNote"
              >
                {{ isSendingNote ? '正在送出...' : '送出愛心卡' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 🎰 扭蛋運轉中動畫覆蓋層 -->
        <div v-if="isSpanning" class="gacha-spin-overlay">
          <div class="gacha-spinner-box">
            <div class="gacha-toy-ball">🎰</div>
            <p class="gacha-spin-title text-neon-gold">扭蛋機正在運轉中...</p>
            <p class="gacha-spin-subtitle">尋找隨機降臨的驚喜卡牌</p>
          </div>
        </div>

        <!-- 🎉 扭蛋獲得獎勵彈窗 -->
        <div v-if="showGachaResult" class="modal-overlay">
          <div class="modal-card game-card gacha-result-card">
            <div class="gacha-confetti-effect">🎉 扭蛋大成功！ 🎉</div>
            <h3 class="gacha-result-title text-neon-gold">{{ gachaResult?.RewardName }}</h3>
            <p class="gacha-result-desc">{{ gachaResult?.Description }}</p>
            <div class="gacha-result-alert">
              此卡牌已被安全送入您的「🎁 禮物卡盒」中！
            </div>
            <div class="modal-actions">
              <button class="btn-confirm-redeem" @click="showGachaResult = false">收下驚喜</button>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import confetti from 'canvas-confetti'

const showToast = inject<any>('showToast')
const removeToast = inject<any>('removeToast')
const apiFetch = useAuthAwareFetch()

export interface Milestone {
  Tier: number
  XPThreshold: number
  RewardName: string
  Description: string
  Unlocked: boolean
}

export interface Gift {
  Id: string
  Sender: 'A' | 'B'
  Receiver: 'A' | 'B'
  RewardName: string;
  Message: string;
  Timestamp: string;
  Used: boolean;
  AttachedXp?: number;
}

const props = defineProps<{
  totalXp: number
  activePlayer: 'A' | 'B' | null
  playerABalance: number
  playerBBalance: number
  playerAName: string
  playerBName: string
  shopItems: Milestone[]
  gifts: Gift[]
  isRedeeming: boolean
}>()

const emit = defineEmits<{
  (e: 'refreshData'): void
}>()

const showModal = ref(false)
const selectedReward = ref<Milestone | null>(null)

// 2.0 禮物與自訂卡片變數
const redeemType = ref<'self' | 'gift'>('self')
const giftMessage = ref('')
const claimingGifts = ref<Record<string, boolean>>({})

// 自訂卡片 (愛心小卡) 狀態
const showCustomNoteModal = ref(false)
const selectedThemeEmoji = ref('❤️')
const customNoteMessage = ref('')
const attachedXpToSend = ref(0)
const isSendingNote = ref(false)
const isRedeemingCoupon = ref(false)

const cardThemes = [
  { emoji: '❤️', label: '溫馨' },
  { emoji: '☕', label: '招待' },
  { emoji: '💪', label: '鼓勵' },
  { emoji: '⭐', label: '讚賞' },
  { emoji: '💆', label: '放鬆' },
  { emoji: '🧹', label: '分擔' }
]

// 扭蛋狀態
const isSpanning = ref(false)
const showGachaResult = ref(false)
const gachaResult = ref<{ RewardName: string; Description: string } | null>(null)

// 扭蛋驚喜隨機池
const GACHA_POOL = [
  { RewardName: '💆 搥背按摩券 (10 分鐘)', Description: '對方向你兌現：親切搥背與肩頸舒壓按摩 10 分鐘！' },
  { RewardName: '🧼 免洗碗家務保護卡', Description: '今天你最大！對方為你做一次洗碗洗鍋家務！' },
  { RewardName: '🍿 深夜宵夜請客券', Description: '放鬆時刻！對方為你準備或買單一份美味的深夜宵夜！' },
  { RewardName: '🍳 驚喜愛心早餐券', Description: '幸福早晨！對方在悠閒的假日為你親手做一份熱騰騰早餐！' },
  { RewardName: '🛒 代購跑腿服務券', Description: '今天想要什麼盡管說！對方幫你去買，免出門直接送到手上！' },
  { RewardName: '🥤 午後豪華手搖飲招待', Description: '點心時間！對方請你喝一杯你最喜歡的豪華手搖飲料！' }
]

// 確定當前身分的可用餘額
const currentBalance = computed(() => {
  if (props.activePlayer === 'A') return props.playerABalance
  if (props.activePlayer === 'B') return props.playerBBalance
  return 0
})

function formatXp(value: number): string {
  return new Intl.NumberFormat('zh-TW').format(Math.max(0, Math.round(Number(value) || 0)))
}

// 當前身分中文姓名
const activePlayerName = computed(() => {
  if (props.activePlayer === 'A') return props.playerAName
  if (props.activePlayer === 'B') return props.playerBName
  return ''
})

// 寫卡片可選擇附帶的點數選項 (限制在可用點數內)
const xpOptions = computed(() => {
  const options = [0]
  if (currentBalance.value >= 10) options.push(10)
  if (currentBalance.value >= 20) options.push(20)
  if (currentBalance.value >= 50) options.push(50)
  if (currentBalance.value >= 100) options.push(100)
  return options
})

// 2.0 新增：自訂驚喜券標題與已使用卡盒折疊狀態
const showArchivedGifts = ref(false)
const customCouponTitle = ref('')
const usedGiftIds = ref<string[]>([])

// 監聽外部 gifts 資料變更，當伺服器數據同步成功後，將已轉為 Used=true 的暫存項目自動過濾清理
watch(() => props.gifts, () => {
  usedGiftIds.value = usedGiftIds.value.filter(id => {
    const g = props.gifts.find(item => item.Id === id)
    return g ? !g.Used : false
  })
}, { deep: true })

// 我的禮物卡盒清單：Receiver 是當前登入身分
const myGifts = computed(() => {
  if (!props.activePlayer) return []
  return props.gifts
    .filter(g => g.Receiver === props.activePlayer)
    .sort((a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime())
})

// 拆分未使用與已使用卡片，導入樂觀更新，點擊使用後 0ms 立刻在畫面上移往已使用卡區，拒絕延遲跳動
const myUnusedGifts = computed(() => {
  return myGifts.value.filter(g => !g.Used && !usedGiftIds.value.includes(g.Id))
})

const myUsedGifts = computed(() => {
  return myGifts.value.filter(g => g.Used || usedGiftIds.value.includes(g.Id))
})

// 根據小卡與商品屬性，自動判定按鈕文字，提供完美語意
function getGiftButtonText(gift: any): string {
  const attachedXp = Number(gift.AttachedXp) || 0
  if (attachedXp > 0) {
    return `領取 +${attachedXp} XP`
  }
  
  // 比對商店商品或自訂驚喜券 (有 🎨 前綴或與商店商品名稱完全相同，或屬於扭蛋池隨機獎品名稱)
  const isShopCoupon = gift.RewardName.startsWith('🎨') || 
                       props.shopItems.some(item => item.RewardName === gift.RewardName) ||
                       GACHA_POOL.some(item => item.RewardName === gift.RewardName)
                       
  if (isShopCoupon) {
    return '使用卡片'
  }
  
  // 免費自訂愛心小卡 (包括 sandbox 生成的測試愛心咖啡卡)
  return '收下祝福 ❤️'
}

function confirmRedeem(reward: any) {
  selectedReward.value = reward
  redeemType.value = 'self'
  giftMessage.value = ''
  showModal.value = true
}

// 執行商店點數商品兌換
async function executeRedeem() {
  if (!selectedReward.value || !props.activePlayer || isRedeemingCoupon.value) return
  isRedeemingCoupon.value = true

  const toastId = showToast ? showToast('正在與 Google Sheets 同步中...', 'loading', 0) : null
  
  const item = selectedReward.value
  const buyer = props.activePlayer
  const partner = buyer === 'A' ? 'B' : 'A'
  
  // 自訂驚喜兌現券 (Tier 8) 強制只能送給夥伴
  const isGift = item.Tier === 8 || redeemType.value === 'gift'
  const receiver = isGift ? partner : buyer
  const sender = isGift ? buyer : partner
  
  const defaultMsg = isGift ? '送你這份小驚喜！' : '自己存入的養成願望清單，期待你幫我兌現！'
  const message = giftMessage.value.trim() || defaultMsg
  
  const finalRewardName = item.Tier === 8
    ? `🎨 ${customCouponTitle.value.trim()}`
    : item.RewardName
  
  try {
    const res = await apiFetch<any>('/api/send-gift', {
      method: 'POST',
      body: {
        sender: sender,
        receiver: receiver,
        buyer: buyer, // 扣除主動兌換者的點數
        rewardName: finalRewardName,
        message: message,
        xp: item.XPThreshold,
        tier: item.Tier,
        attachedXp: 0 // 一般商店兌換為 0 附帶點數
      }
    })
    
    if (res.error) {
      if (removeToast && toastId) removeToast(toastId)
      if (showToast) showToast(res.error, 'error')
      isRedeemingCoupon.value = false
      return
    }
    
    // 清空自訂驚喜券標題與悄悄話欄位
    customCouponTitle.value = ''
    giftMessage.value = ''
    
    if (removeToast && toastId) removeToast(toastId)
    if (showToast) {
      const targetName = isGift ? '夥伴的禮物盒' : '您的卡盒'
      showToast(`已成功扣除 ${item.XPThreshold} XP，卡片已存入${targetName}！`, 'success')
    }

    showModal.value = false
    triggerConfetti()
    emit('refreshData')
  } catch (err: any) {
    if (removeToast && toastId) removeToast(toastId)
    if (showToast) showToast(`兌換出錯: ${err.message}`, 'error')
  } finally {
    isRedeemingCoupon.value = false
  }
}

// 開啟寫愛心自訂卡片彈窗
function openCustomNoteModal() {
  selectedThemeEmoji.value = '❤️'
  customNoteMessage.value = ''
  attachedXpToSend.value = 0
  showCustomNoteModal.value = true
}

// 執行送出愛心自訂卡片
async function executeSendCustomNote() {
  if (!props.activePlayer || isSendingNote.value) return
  isSendingNote.value = true

  const toastId = showToast ? showToast('正在傳送愛心卡中...', 'loading', 0) : null
  
  const buyer = props.activePlayer
  const partner = buyer === 'A' ? 'B' : 'A'
  
  const selectedTheme = cardThemes.find(t => t.emoji === selectedThemeEmoji.value)
  const title = `${selectedThemeEmoji.value} ${selectedTheme?.label || '自訂'}卡片`
  
  const defaultMsg = `今天也是充滿能量的一天，加油！`
  const message = customNoteMessage.value.trim() || defaultMsg
  
  try {
    const res = await apiFetch<any>('/api/send-gift', {
      method: 'POST',
      body: {
        sender: buyer,
        receiver: partner,
        rewardName: title,
        message: message,
        xp: attachedXpToSend.value, // 卡片本身 0 XP，只扣除所附帶的贈禮 XP
        tier: 98, // 自訂卡片特殊 Tier 98
        attachedXp: attachedXpToSend.value
      }
    })
    
    isSendingNote.value = false
    
    if (res.error) {
      if (removeToast && toastId) removeToast(toastId)
      if (showToast) showToast(res.error, 'error')
      return
    }

    showCustomNoteModal.value = false
    
    if (removeToast && toastId) removeToast(toastId)
    if (showToast) {
      const xpSuffix = attachedXpToSend.value > 0 ? `並附贈了 ${attachedXpToSend.value} XP ` : ''
      showToast(`愛心卡已成功送達對方的卡盒！${xpSuffix}🎁`, 'success')
    }
    
    triggerConfetti()
    emit('refreshData')
  } catch (err: any) {
    isSendingNote.value = false
    if (removeToast && toastId) removeToast(toastId)
    if (showToast) showToast(`送出卡片出錯: ${err.message}`, 'error')
  }
}

// 🎰 幸運扭蛋盲盒執行
async function spinGacha() {
  if (!props.activePlayer || currentBalance.value < 100 || isSpanning.value) return
  
  // 自動平滑滾動至最頂端，確保全螢幕扭蛋特效在視野正中央完美顯現！
  window.scrollTo({ top: 0, behavior: 'smooth' })
  
  isSpanning.value = true
  
  // 啟動 2.5 秒的視覺滾動效果
  setTimeout(async () => {
    // 隨機選一個驚喜
    const randomIndex = Math.floor(Math.random() * GACHA_POOL.length)
    const reward = GACHA_POOL[randomIndex]
    
    const buyer = props.activePlayer!
    const partner = buyer === 'A' ? 'B' : 'A'
    
    // 扭蛋獲得實體券，是由對方為我執行 (Sender = partner, Receiver = me)
    try {
      const res = await apiFetch<any>('/api/send-gift', {
        method: 'POST',
        body: {
          sender: partner, 
          receiver: buyer,
          buyer: buyer, // 確保扭蛋扣點精確計算在抽獎者本人身上
          rewardName: reward.RewardName,
          message: '🎰 幸運扭蛋機抽中！這是命運的安排，請溫柔地為對方服務喔～',
          xp: 100,
          tier: 99, // 扭蛋特定 Tier
          attachedXp: 0
        }
      })
      
      isSpanning.value = false
      
      if (res.error) {
        if (showToast) showToast(res.error, 'error')
        return
      }
      
      gachaResult.value = reward
      showGachaResult.value = true
      
      if (showToast) showToast(`恭喜抽中【${reward.RewardName}】！🎉`, 'success')
      triggerConfetti()
      emit('refreshData')
    } catch (err: any) {
      isSpanning.value = false
      if (showToast) showToast(`扭蛋出錯: ${err.message}`, 'error')
    }
  }, 2500)
}

// 🎁 使用禮物卡/點數卡
async function claimGift(giftId: string) {
  if (claimingGifts.value[giftId]) return
  claimingGifts.value[giftId] = true

  const gift = props.gifts.find(g => g.Id === giftId)
  const giftName = gift ? gift.RewardName : '禮物卡'
  
  const toastId = showToast ? showToast(`正在使用並兌現【${giftName}】...`, 'loading', 0) : null
  
  try {
    const res = await apiFetch<any>('/api/use-gift', {
      method: 'POST',
      body: {
        giftId: giftId,
        receiver: gift?.Receiver ?? null,
        attachedXp: Number(gift?.AttachedXp) || 0
      }
    })
    
    if (res.error) {
      if (removeToast && toastId) removeToast(toastId)
      if (showToast) showToast(res.error, 'error')
      claimingGifts.value[giftId] = false
      return
    }
    
    // 樂觀更新：在 0ms 內立馬將這張卡片藏入已使用/已讀區域，徹底防止 API 連線時的按鈕狀態跳動！
    usedGiftIds.value.push(giftId)
    
    if (removeToast && toastId) removeToast(toastId)
    if (showToast) {
      const extraXpMsg = (gift && gift.AttachedXp && gift.AttachedXp > 0)
        ? `，且已獲得附贈的 ${gift.AttachedXp} XP 點數！`
        : '！記得請夥伴為您兌現唷～'
      showToast(`已成功使用【${giftName}】${extraXpMsg}`, 'success')
    }

    triggerConfetti()
    emit('refreshData')
  } catch (err: any) {
    if (removeToast && toastId) removeToast(toastId)
    if (showToast) showToast(`兌換禮物卡出錯: ${err.message}`, 'error')
    claimingGifts.value[giftId] = false
  } finally {
    // 延遲重設以防 DOM 還沒重新渲染時跳動
    claimingGifts.value[giftId] = false
  }
}

// 格式化時間差 (未滿一週顯示相對時間，超過一週顯示 MM/DD HH:MM 獲得)
function formatTimeAgo(timestampStr: string): string {
  if (!timestampStr) return ''
  const t = new Date(timestampStr).getTime()
  const diff = new Date().getTime() - t
  
  const min = 60 * 1000
  const hr = 60 * min
  const day = 24 * hr
  const week = 7 * day
  
  if (diff < min) return '剛剛'
  if (diff < hr) return `${Math.floor(diff / min)} 分鐘前`
  if (diff < day) return `${Math.floor(diff / hr)} 小時前`
  if (diff < week) return `${Math.floor(diff / day)} 天前`
  
  // 超過一個星期，顯示幾月幾號幾點獲得
  const d = new Date(timestampStr)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const date = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${month}/${date} ${hours}:${minutes} 獲得`
}

// 格式化兌換時間：YYYY/MM/DD HH:MM
function formatDateTime(timestampStr: string): string {
  if (!timestampStr) return ''
  const d = new Date(timestampStr)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const date = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}/${month}/${date} ${hours}:${minutes}`
}

function triggerConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  })
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
  display: inline-flex;
  align-items: baseline;
  gap: 0.5rem;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.treasury-value-number {
  letter-spacing: 2px;
  line-height: 1;
}

.xp-unit {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
  letter-spacing: 2px;
}

.section-title {
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  letter-spacing: 1px;
}


/* 🎁 禮物卡盒 Gift Box */
.giftbox-section {
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 1.25rem 1.25rem;
}

.giftbox-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.giftbox-header-row .section-title {
  margin-bottom: 0;
  line-height: 1.2;
}

.btn-send-custom-note {
  background: linear-gradient(135deg, var(--neon-purple), #7b2cbf);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.35rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: var(--shadow-neon-purple);
  transition: var(--transition-smooth);
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.btn-send-custom-note:hover {
  transform: translateY(-1px);
  filter: brightness(1.15);
  box-shadow: 0 0 10px rgba(157, 78, 221, 0.4);
}

.spectator-alert-box, .empty-gifts-box {
  padding: 1.5rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-muted);
  border: 1px dashed rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.gifts-scroll-container {
  max-height: 520px;
  overflow-y: auto;
  padding-right: 0.5rem;
  margin-top: 0.75rem;
}

/* 自訂捲動軸 */
.gifts-scroll-container::-webkit-scrollbar {
  width: 6px;
}
.gifts-scroll-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}
.gifts-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}
.gifts-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.no-unused-alert {
  padding: 1.25rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--neon-gold);
  background: rgba(255, 183, 3, 0.03);
  border: 1px solid rgba(255, 183, 3, 0.1);
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.archived-gifts-toggle {
  display: flex;
  justify-content: center;
  margin: 1.25rem 0 0.75rem 0;
}

.btn-toggle-archive {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: var(--text-muted);
  font-size: 0.75rem;
  padding: 0.4rem 1rem;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-toggle-archive:hover {
  border-color: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.gifts-grid-archived {
  margin-top: 0.75rem;
  opacity: 0.8;
}

.gifts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

@media (max-width: 576px) {
  .gifts-grid {
    grid-template-columns: 1fr !important;
  }
}

.gift-card {
  background: rgba(20, 24, 35, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  transition: var(--transition-smooth);
}

.gift-from-a {
  border-left: 4px solid var(--neon-purple);
  box-shadow: inset 0 0 15px rgba(157, 78, 221, 0.04);
}

.gift-from-b {
  border-left: 4px solid var(--neon-blue);
  box-shadow: inset 0 0 15px rgba(0, 180, 216, 0.04);
}

.gift-used {
  opacity: 0.55;
}

.gift-badge-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--text-secondary);
}

.gift-from-a .gift-badge-top { color: #c8b6ff; }
.gift-from-b .gift-badge-top { color: #90e0ef; }

.gift-status-lbl {
  font-size: 0.6rem;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.gift-card:not(.gift-used) .gift-status-lbl {
  background: rgba(6, 214, 160, 0.08);
  color: var(--neon-green);
  border-color: rgba(6, 214, 160, 0.2);
}

.gift-title-name {
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 850;
  color: #fff;
}

.gift-msg-bubble {
  background: rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  display: flex;
  align-items: flex-start;
  gap: 0.25rem;
}

.quote-mark {
  font-family: Georgia, serif;
  font-size: 1.25rem;
  line-height: 1;
  color: var(--text-muted);
  opacity: 0.5;
}

.gift-msg-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.4;
  flex: 1;
}

.gift-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.25rem;
}

.gift-time-txt {
  font-size: 0.6rem;
  color: var(--text-muted);
}

.btn-claim-gift {
  background: linear-gradient(135deg, #06d6a0, #05a87d);
  border: none;
  color: #0b0c10;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: var(--shadow-neon-green);
  transition: var(--transition-smooth);
}

.btn-claim-gift:hover {
  filter: brightness(1.15);
  transform: translateY(-1px);
}

/* 🛒 養成福利商店 */
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

.badge-gacha-txt {
  background: rgba(255, 183, 3, 0.1);
  color: var(--neon-gold);
  border: 1px solid var(--neon-gold);
  box-shadow: var(--shadow-neon-gold);
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

/* 🎰 扭蛋卡片與按鈕 */
.gacha-card {
  background: rgba(255, 183, 3, 0.02);
  border: 1px solid rgba(255, 183, 3, 0.15);
  box-shadow: inset 0 0 20px rgba(255, 183, 3, 0.02);
}

.gacha-card:hover {
  border-color: var(--neon-gold);
  box-shadow: 0 4px 15px rgba(255, 183, 3, 0.1);
}

.btn-gacha {
  background: linear-gradient(135deg, var(--neon-gold), #cc8e02);
  border: none;
  color: #0b0c10;
  box-shadow: var(--shadow-neon-gold);
}

.btn-gacha:hover {
  transform: translateY(-1px);
  filter: brightness(1.15);
  box-shadow: 0 0 12px rgba(255, 183, 3, 0.4);
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
  border-radius: 16px;
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
  margin-bottom: 1.25rem;
}

/* 兌換選項與留言框 */
.redeem-type-selector {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #fff;
  cursor: pointer;
}

.radio-label input {
  position: absolute;
  opacity: 0;
}

.custom-radio {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: inline-block;
  position: relative;
  transition: var(--transition-smooth);
}

.radio-label input:checked ~ .custom-radio {
  border-color: var(--neon-gold);
}

.custom-radio::after {
  content: "";
  position: absolute;
  display: none;
  width: 6px;
  height: 6px;
  background: var(--neon-gold);
  border-radius: 50%;
  top: 4px;
  left: 4px;
  transform: translate(-50%, -50%);
}

.radio-label input:checked ~ .custom-radio::after {
  display: block;
}

.message-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
  animation: fadeIn-anim 0.3s ease-in-out;
}

.input-lbl {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: bold;
}

.textarea-msg {
  width: 100%;
  height: 60px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #fff;
  padding: 0.5rem;
  font-size: 0.75rem;
  line-height: 1.4;
  resize: none;
  font-family: inherit;
  transition: var(--transition-smooth);
}

.textarea-msg:focus {
  outline: none;
  border-color: var(--neon-gold);
  box-shadow: 0 0 5px rgba(255, 183, 3, 0.2);
}

.input-text {
  width: 100%;
  height: 38px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #fff;
  padding: 0 0.75rem;
  font-size: 0.75rem;
  box-sizing: border-box;
  font-family: inherit;
  transition: var(--transition-smooth);
}

.input-text:focus {
  outline: none;
  border-color: var(--neon-gold);
  box-shadow: 0 0 5px rgba(255, 183, 3, 0.2);
}

/* 愛心小卡彈窗專屬樣式 */
.custom-note-modal {
  border-top-color: var(--neon-purple);
  box-shadow: 0 10px 30px rgba(157, 78, 221, 0.2);
}

.theme-selection-area {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.35rem;
  margin-top: 0.2rem;
}

.btn-theme-select {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 0.4rem 0.2rem;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-theme-select:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--neon-purple);
}

.btn-theme-select.theme-selected {
  background: rgba(157, 78, 221, 0.08);
  border-color: var(--neon-purple);
  box-shadow: var(--shadow-neon-purple);
}

.theme-emoji {
  font-size: 1.15rem;
}

.theme-name {
  font-size: 0.55rem;
  color: var(--text-muted);
  margin-top: 0.15rem;
}

.theme-selected .theme-name {
  color: #c8b6ff;
  font-weight: bold;
}

.textarea-custom-note {
  height: 80px;
}

.xp-attachment-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1.5rem;
}

.xp-options-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.4rem;
}

.btn-xp-option {
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  font-family: var(--font-title);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.4rem 0.2rem;
  border-radius: 6px;
  cursor: pointer;
  transition: var(--transition-smooth);
  white-space: nowrap;
}

.btn-xp-option:hover:not(:disabled) {
  border-color: var(--neon-gold);
  color: #fff;
}

.btn-xp-option.xp-opt-selected {
  background: rgba(255, 183, 3, 0.08);
  border-color: var(--neon-gold);
  color: var(--neon-gold);
  box-shadow: var(--shadow-neon-gold);
}

.btn-xp-option:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.xp-attachment-hint {
  font-size: 0.65rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin-top: 0.15rem;
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

/* 🎰 扭蛋動畫覆蓋層 */
.gacha-spin-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(11, 12, 16, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.gacha-spinner-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.25rem;
}

.gacha-toy-ball {
  font-size: 5rem;
  animation: spin-gacha-anim 0.8s infinite ease-in-out;
  filter: drop-shadow(0 0 20px rgba(255, 183, 3, 0.4));
}

.gacha-spin-title {
  font-family: var(--font-body);
  font-size: 1.3rem;
  font-weight: 900;
  letter-spacing: 1px;
}

.gacha-spin-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
}

@keyframes spin-gacha-anim {
  0% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(-15deg) scale(1.1); }
  50% { transform: rotate(15deg) scale(1); }
  75% { transform: rotate(-15deg) scale(1.1); }
  100% { transform: rotate(0deg) scale(1); }
}

/* 🎉 扭蛋獲得獎勵彈窗 */
.gacha-result-card {
  text-align: center;
  border-top: 3px solid var(--neon-gold);
  box-shadow: 0 0 30px rgba(255, 183, 3, 0.25);
  animation: scaleUp-anim 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.gacha-confetti-effect {
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 900;
  color: var(--neon-gold);
  letter-spacing: 2px;
  margin-bottom: 0.75rem;
}

.gacha-result-title {
  font-family: var(--font-body);
  font-size: 1.4rem;
  font-weight: 900;
  margin-bottom: 0.5rem;
}

.gacha-result-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.gacha-result-alert {
  background: rgba(255, 183, 3, 0.05);
  border: 1px solid rgba(255, 183, 3, 0.15);
  border-radius: 8px;
  padding: 0.5rem;
  font-size: 0.75rem;
  color: var(--neon-gold);
  margin-bottom: 1.5rem;
}

@keyframes fadeIn-anim {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleUp-anim {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
</style>
