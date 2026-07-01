import fs from 'fs'
import path from 'path'

// 定義模擬資料庫的儲存路徑
const DB_FILE = path.resolve(process.cwd(), 'local_db.json')

export interface LocalQuest {
  Id: string;
  Player: 'A' | 'B' | 'Both';
  Category: string;
  Name: string;
  Description: string;
  XP: number;
  Icon: string;
  Active: boolean;
}

export interface LocalMilestone {
  Tier: number;
  XPThreshold: number;
  RewardName: string;
  Description: string;
  Unlocked: boolean;
}

export interface LocalLog {
  Timestamp: string;
  Date: string; // YYYY-MM-DD
  Player: 'A' | 'B';
  QuestId: string;
  XP: number;
  IsSkipPass: boolean;
}

export interface LocalGift {
  Id: string;
  Sender: 'A' | 'B';
  Receiver: 'A' | 'B';
  RewardName: string;
  Message: string;
  Timestamp: string;
  Used: boolean;
  AttachedXp: number;
}

export interface LocalDbSchema {
  quests: LocalQuest[];
  milestones: LocalMilestone[];
  shopItems: LocalMilestone[];
  gifts: LocalGift[];
  logs: LocalLog[];
  config: Record<string, string | number>;
}

// 預設的任務資料
const DEFAULT_QUESTS: LocalQuest[] = [
  { Id: 'q_water_a', Player: 'A', Category: '飲水', Name: '喝水 2000cc', Description: '一天喝足 2000cc 水，保持水分', XP: 10, Icon: '💧', Active: true },
  { Id: 'q_water_b', Player: 'B', Category: '飲水', Name: '喝水 2000cc', Description: '一天喝足 2000cc 水，保持水分', XP: 10, Icon: '💧', Active: true },
  { Id: 'q_food_a', Player: 'A', Category: '進食', Name: '先吃菜肉再吃澱粉', Description: '吃飯順序調整，血糖穩定不發胖', XP: 15, Icon: '🥗', Active: true },
  { Id: 'q_food_b', Player: 'B', Category: '進食', Name: '吃飯不配手機', Description: '專心享受一餐，細嚼慢嚥', XP: 15, Icon: '🍱', Active: true },
  { Id: 'q_move_a', Player: 'A', Category: '運動', Name: '多走樓梯/走路', Description: '提早一站下車，或者搭電梯改走樓梯', XP: 20, Icon: '🚶', Active: true },
  { Id: 'q_move_b', Player: 'B', Category: '運動', Name: '在家深蹲 20 下', Description: '做簡單的小運動，活絡一下筋骨', XP: 20, Icon: '🏋️', Active: true },
  { Id: 'q_resist_a', Player: 'A', Category: '精神', Name: '今天不喝手搖杯', Description: '成功抗拒含糖下午茶的誘惑', XP: 30, Icon: '🚫', Active: true },
  { Id: 'q_resist_b', Player: 'B', Category: '精神', Name: '睡前 30 分鐘不滑手機', Description: '讓大腦關機，安穩睡個好覺', XP: 30, Icon: '📱', Active: true },
  { Id: 'q_chore_a', Player: 'A', Category: '家務', Name: '整理房間 10 分鐘', Description: '隨手整理書桌或吸地，環境清爽', XP: 25, Icon: '🧹', Active: true },
  { Id: 'q_read_b', Player: 'B', Category: '學習', Name: '看書 10 頁', Description: '隨便看什麼書都行，有看就好', XP: 25, Icon: '📖', Active: true },
  { Id: 'q_stretch_a', Player: 'A', Category: '運動', Name: '伸展拉筋 10 分鐘', Description: '睡前拉個筋，舒緩一整天疲勞', XP: 20, Icon: '🧘', Active: true },
  { Id: 'q_stretch_b', Player: 'B', Category: '運動', Name: '伸展拉筋 10 分鐘', Description: '睡前拉個筋，舒緩一整天疲勞', XP: 20, Icon: '🧘', Active: true }
]

// 預設的永久公會等級里程碑資料 (不扣點，永久解鎖)
const DEFAULT_MILESTONES: LocalMilestone[] = [
  { Tier: 1, XPThreshold: 300, RewardName: 'Lv.1 夢想啟航', Description: '解鎖夢想商店兌換權限，開啟日常挑戰！', Unlocked: false },
  { Tier: 2, XPThreshold: 600, RewardName: 'Lv.2 默契萌芽', Description: '解鎖第二張請假券額度，養成輕鬆無壓力！', Unlocked: false },
  { Tier: 3, XPThreshold: 1200, RewardName: 'Lv.3 養成先鋒', Description: '解鎖每週 AI 戰報專屬頭銜與冒險統計頁面！', Unlocked: false },
  { Tier: 4, XPThreshold: 2500, RewardName: 'Lv.4 傳奇二人組', Description: '自訂任務上限+2，解鎖進階養成日常！', Unlocked: false },
  { Tier: 5, XPThreshold: 5000, RewardName: 'Lv.5 夢想實踐家', Description: '共同獲得解鎖成就：3000 元實體旅遊加碼金！', Unlocked: false },
  { Tier: 6, XPThreshold: 10000, RewardName: 'Lv.6 超凡公會', Description: '共同獲得解鎖成就：雙人兩天一夜溫泉旅行補貼！', Unlocked: false },
  { Tier: 7, XPThreshold: 20000, RewardName: 'Lv.7 終極信仰', Description: '獲得解鎖成就：10,000 元共同升級家電或娛樂設備基金！', Unlocked: false }
]

// 預設的夢想商店商品資料 (可用點數扣除兌換)
const DEFAULT_SHOP_ITEMS: LocalMilestone[] = [
  { Tier: 1, XPThreshold: 300, RewardName: '雙人豪華手搖飲', Description: '買一杯不用看價錢的豪華飲料', Unlocked: false },
  { Tier: 2, XPThreshold: 600, RewardName: '週末甜點約會', Description: '雙人下午茶，一起吃好吃的蛋糕', Unlocked: false },
  { Tier: 3, XPThreshold: 1200, RewardName: '雙人電影約會', Description: '買大爆米花 and 可樂一起看場電影', Unlocked: false },
  { Tier: 4, XPThreshold: 2500, RewardName: '豪華燒肉/火鍋大餐', Description: '慶祝突破階段性目標的豪華大餐', Unlocked: false },
  { Tier: 5, XPThreshold: 5000, RewardName: '存入 3000 元旅遊基金', Description: '一起為下次旅遊存錢', Unlocked: false },
  { Tier: 6, XPThreshold: 10000, RewardName: '週末溫泉小旅行', Description: '兩天一夜的一泊二食溫泉之旅', Unlocked: false },
  { Tier: 7, XPThreshold: 20000, RewardName: '神兵利器升級基金', Description: '存入 10,000 元作為家電或娛樂設備升級金', Unlocked: false },
  { Tier: 8, XPThreshold: 150, RewardName: '🎨 自訂驚喜兌現券', Description: '花費 150 XP 自訂一張專屬券送給夥伴，內容與稱呼由你發揮！', Unlocked: false }
]


// 預設設定
const DEFAULT_CONFIG = {
  GuildName: '日常養成基地',
  PlayerAName: '萱',
  PlayerBName: '至',
  AIPrompt: '請根據本週數據：{PlayerA} 完成了 {A_completed} 項任務，{PlayerB} 完成了 {B_completed} 項任務。請以輕鬆、溫馨且鼓勵性的冒險戰報口吻，撰寫一篇 100 字內的每週進度戰報總結，並給予雙方熱血與實用的鼓勵，語系使用台灣繁體中文。',
  WeeklyQuota: 2
}



export function getLocalDb(): LocalDbSchema {
  if (!fs.existsSync(DB_FILE)) {
    const initialDb: LocalDbSchema = {
      quests: DEFAULT_QUESTS,
      milestones: DEFAULT_MILESTONES,
      shopItems: DEFAULT_SHOP_ITEMS,
      gifts: [],
      logs: [],
      config: DEFAULT_CONFIG
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8')
    return initialDb
  }
  
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8')
    const parsed = JSON.parse(content) as LocalDbSchema
    
    // 確保 shopItems 存在
    if (!parsed.shopItems) {
      parsed.shopItems = DEFAULT_SHOP_ITEMS
      parsed.milestones = DEFAULT_MILESTONES
    }

    // 確保 Tier 8 (自訂驚喜兌現券) 存在於目前載入的資料庫中
    if (parsed.shopItems && !parsed.shopItems.some((i: any) => i.Tier === 8)) {
      parsed.shopItems.push({
        Tier: 8,
        XPThreshold: 150,
        RewardName: '🎨 自訂驚喜兌現券',
        Description: '花費 150 XP 自訂一張專屬券送給夥伴，內容與稱呼由你發揮！',
        Unlocked: false
      })
    }
    
    // 確保 gifts 存在
    if (!parsed.gifts) {
      parsed.gifts = []
    }
    
    saveLocalDb(parsed)
    return parsed
  } catch (e) {
    const initialDb: LocalDbSchema = {
      quests: DEFAULT_QUESTS,
      milestones: DEFAULT_MILESTONES,
      shopItems: DEFAULT_SHOP_ITEMS,
      gifts: [],
      logs: [],
      config: DEFAULT_CONFIG
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8')
    return initialDb
  }
}

export function saveLocalDb(data: LocalDbSchema) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8')
}
