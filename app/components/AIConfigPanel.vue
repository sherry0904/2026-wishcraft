<template>
  <div class="ai-config-panel game-card" :class="{ 'panel-collapsed': isCollapsed }">
    <div class="panel-header" @click="isCollapsed = !isCollapsed">
      <div class="title-wrapper">
        <h3 class="panel-title">系統設定與 AI 提示詞</h3>
        <span class="panel-subtitle">GUILD SETTINGS</span>
      </div>
      <span class="collapse-icon">{{ isCollapsed ? '＋ 展開' : '－ 收合' }}</span>
    </div>

    <div v-show="!isCollapsed" class="panel-body">
      <!-- 離線模式提示 -->
      <div v-if="isOffline" class="local-settings-banner">
        💡 提示：目前處於離線展示模式，以下變更將直接儲存於本機的 <code>local_db.json</code> 檔案中。
      </div>

      <!-- 系統名稱設定 -->
      <div class="config-group">
        <label class="config-label">看板名稱 (System Name)</label>
        <input 
          type="text" 
          v-model="localGuildName" 
          class="config-input text-input"
          placeholder="例如：雙人夢想解鎖板"
        />
        <p class="config-hint">設定系統頂部顯示的系統標題，例如「雙人夢想解鎖板」或「日常養成基地」。</p>
      </div>

      <!-- 雙人名稱設定 -->
      <div class="config-group names-row">
        <div class="name-field">
          <label class="config-label">玩家 A 名字</label>
          <input 
            type="text" 
            v-model="localPlayerAName" 
            class="config-input text-input"
            placeholder="例如：小明"
          />
        </div>
        <div class="name-field">
          <label class="config-label">玩家 B 名字</label>
          <input 
            type="text" 
            v-model="localPlayerBName" 
            class="config-input text-input"
            placeholder="例如：小華"
          />
        </div>
      </div>

      <!-- 每週請假次數設定 -->
      <div class="config-group">
        <label class="config-label">每週請假券上限次數 (Weekly Skip Quota)</label>
        <div class="quota-input-wrapper">
          <input 
            type="number" 
            v-model="localQuota" 
            min="1" 
            max="7" 
            class="config-input number-input"
          />
          <span class="input-unit">次 / 週</span>
        </div>
        <p class="config-hint">控制每位玩家每週可點擊「請假券」的最大額度上限。</p>
      </div>

      <!-- AI Prompt 設定 -->
      <div class="config-group">
        <label class="config-label">Google Sheets `=AI` 英文提示詞範本 (AI Prompt Template)</label>
        <textarea 
          v-model="localPrompt" 
          rows="4" 
          class="config-input textarea-input"
          placeholder="請輸入給試算表 AI 函數讀取的英文 Prompt..."
        ></textarea>
        <p class="config-hint">
          用於 Google Sheets 的 AI 函數。您可以使用 <code>{A_completed}</code> 與 <code>{B_completed}</code> 作為動態參數，以便 AI 根據當週雙方的完成度撰寫鼓勵與週報總結。
        </p>
      </div>

      <div class="panel-actions">
        <button 
          class="btn-save" 
          :disabled="isSaving" 
          @click="onSave"
        >
          {{ isSaving ? '同步中...' : '儲存並同步至試算表' }}
        </button>
        <span v-if="saveSuccess" class="save-success-msg">儲存成功！已同步 ✅</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  guildName: string
  playerAName: string
  playerBName: string
  aiPrompt: string
  weeklyQuota: number
  isOffline: boolean
  isSaving: boolean
}>()

const emit = defineEmits<{
  (e: 'saveConfig', payload: { guildName: string; playerAName: string; playerBName: string; aiPrompt: string; weeklyQuota: number }): void
}>()

const isCollapsed = ref(true)
const localGuildName = ref(props.guildName)
const localPlayerAName = ref(props.playerAName)
const localPlayerBName = ref(props.playerBName)
const localPrompt = ref(props.aiPrompt)
const localQuota = ref(props.weeklyQuota)
const saveSuccess = ref(false)

watch(() => props.guildName, (newVal) => {
  localGuildName.value = newVal
})

watch(() => props.playerAName, (newVal) => {
  localPlayerAName.value = newVal
})

watch(() => props.playerBName, (newVal) => {
  localPlayerBName.value = newVal
})

watch(() => props.aiPrompt, (newVal) => {
  localPrompt.value = newVal
})

watch(() => props.weeklyQuota, (newVal) => {
  localQuota.value = newVal
})

function onSave() {
  emit('saveConfig', {
    guildName: localGuildName.value,
    playerAName: localPlayerAName.value,
    playerBName: localPlayerBName.value,
    aiPrompt: localPrompt.value,
    weeklyQuota: Number(localQuota.value)
  })
  
  saveSuccess.value = true
  setTimeout(() => {
    saveSuccess.value = false
  }, 3000)
}
</script>

<style scoped>
.ai-config-panel {
  margin-top: 3rem;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(20, 24, 35, 0.4);
}

.panel-collapsed {
  padding: 1rem 1.5rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.title-wrapper {
  display: flex;
  flex-direction: column;
}

.panel-title {
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-secondary);
}

.panel-subtitle {
  font-family: var(--font-title);
  font-size: 0.55rem;
  letter-spacing: 2px;
  color: var(--text-muted);
  margin-top: 0.1rem;
}

.collapse-icon {
  font-family: var(--font-body);
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: bold;
}

.panel-body {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
  animation: slide-down 0.25s ease-out;
}

@keyframes slide-down {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.local-settings-banner {
  background: rgba(0, 180, 216, 0.08);
  border: 1px solid rgba(0, 180, 216, 0.2);
  color: var(--neon-blue);
  padding: 0.6rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  margin-bottom: 1.5rem;
}

.config-group {
  margin-bottom: 1.5rem;
}

.config-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #fff;
}

.config-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: #fff;
  padding: 0.75rem;
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
  transition: var(--transition-smooth);
}

.config-input:focus {
  border-color: var(--neon-purple);
  box-shadow: 0 0 8px rgba(157, 78, 221, 0.2);
}

.quota-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.number-input {
  width: 100px;
  text-align: center;
}

.input-unit {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.textarea-input {
  resize: vertical;
  line-height: 1.5;
}

.config-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.4rem;
  line-height: 1.4;
}

.config-hint code {
  background: rgba(255, 255, 255, 0.05);
  padding: 0.05rem 0.25rem;
  border-radius: 3px;
  color: #fff;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-top: 2rem;
}

.btn-save {
  background: linear-gradient(135deg, #495057, #343a40);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.6rem 1.25rem;
  transition: var(--transition-smooth);
}

.btn-save:hover:not(:disabled) {
  background: var(--bg-card-hover);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 雙人名字排版 */
.names-row {
  display: flex;
  gap: 1rem;
}

.name-field {
  flex: 1;
}

@media (max-width: 576px) {
  .names-row {
    flex-direction: column;
    gap: 0.75rem;
  }
}

.save-success-msg {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--neon-green);
  animation: pulse-green 1s infinite alternate;
}

@keyframes pulse-green {
  from { opacity: 0.7; }
  to { opacity: 1; }
}
</style>
