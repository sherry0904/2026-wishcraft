<template>
  <div v-if="isSupported" class="push-toggle-container">
    <div class="toggle-info">
      <span class="toggle-label">定時打卡提醒 (每天 21:00)</span>
      <span class="toggle-status" :class="{ active: isSubscribed }">
        {{ isSubscribed ? '已開啟' : '未開啟' }}
      </span>
    </div>
    
    <label class="switch">
      <input type="checkbox" :checked="isSubscribed" @change="toggleSubscription">
      <span class="slider round"></span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { useWebPush } from '~/composables/useWebPush'

const { isSupported, isSubscribed, subscribe, unsubscribe } = useWebPush()

// 從 index.vue 的 provide 取得 showToast，若不存在則 fallback 到 alert
const showToast = inject<(msg: string, type?: string, duration?: number) => void>('showToast')

const toast = (msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  if (showToast) {
    showToast(msg, type)
  } else {
    alert(msg)
  }
}

const toggleSubscription = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.checked) {
    const result = await subscribe()
    if (result === 'success') {
      toast('通知已開啟！每天晚上 9 點會提醒你填寫今日任務 🔔', 'success')
    } else if (result === 'permission_denied') {
      toast('請在瀏覽器設定中允許通知權限，才能接收提醒', 'warning')
      target.checked = false
    } else {
      toast('開啟通知失敗，請確認瀏覽器是否支援推播功能', 'error')
      target.checked = false
    }
  } else {
    const ok = await unsubscribe()
    if (ok) {
      toast('已關閉每日提醒通知', 'info')
    }
  }
}
</script>

<style scoped>
.push-toggle-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 15px;
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toggle-label {
  font-size: 0.9rem;
  color: #fff;
  font-weight: 600;
}

.toggle-status {
  font-size: 0.75rem;
  color: #aaa;
}

.toggle-status.active {
  color: #00f5d4;
  text-shadow: 0 0 5px rgba(0, 245, 212, 0.5);
}

/* The switch - the box around the slider */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.2);
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #8a2be2;
  box-shadow: 0 0 10px rgba(138, 43, 226, 0.5);
}

input:focus + .slider {
  box-shadow: 0 0 1px #8a2be2;
}

input:checked + .slider:before {
  transform: translateX(24px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 26px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>
