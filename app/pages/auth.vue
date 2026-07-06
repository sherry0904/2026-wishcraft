<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="logo-container">
        <img src="/icon.jpg" alt="WishCraft Logo" class="logo" />
      </div>
      <h1 class="title">Welcome to WishCraft</h1>
      <p class="subtitle">請輸入通關密碼以進入日常任務解鎖系統</p>
      
      <div class="input-group">
        <input 
          type="password" 
          v-model="passcode" 
          placeholder="Enter Passcode" 
          @keyup.enter="verify"
          class="passcode-input"
        />
        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
      </div>
      
      <button @click="verify" class="verify-btn" :disabled="isLoading">
        {{ isLoading ? '驗證中...' : '解鎖進入' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCookie, useRouter } from '#imports'

const passcode = ref('')
const errorMsg = ref('')
const isLoading = ref(false)
const router = useRouter()

const verify = async () => {
  if (!passcode.value) return
  
  isLoading.value = true
  errorMsg.value = ''
  
  try {
    const response = await $fetch('/api/auth', {
      method: 'POST',
      body: { passcode: passcode.value }
    })
    
    if (response.success) {
      // 讓 Nuxt 的客戶端狀態立即知道 cookie 已改變，避免 router.push 被 middleware 擋下
      const authStateCookie = useCookie('wishcraft_auth_state', {
        maxAge: 60 * 60 * 24 * 365,
        path: '/'
      })
      authStateCookie.value = 'true'
      router.push('/')
    } else {
      errorMsg.value = response.message || '密碼錯誤，請重新輸入'
      passcode.value = ''
    }
  } catch (err) {
    errorMsg.value = '連線伺服器失敗，請稍後再試'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #0d0221;
  font-family: 'Orbitron', 'Noto Sans TC', sans-serif;
  padding: 20px;
}

.auth-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}

.logo-container {
  margin-bottom: 20px;
}

.logo {
  width: 100px;
  height: 100px;
  border-radius: 20px;
  box-shadow: 0 0 20px rgba(138, 43, 226, 0.5);
}

.title {
  color: #fff;
  font-size: 1.8rem;
  margin-bottom: 10px;
  font-weight: 800;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.subtitle {
  color: #aaa;
  font-size: 0.9rem;
  margin-bottom: 30px;
}

.input-group {
  margin-bottom: 25px;
}

.passcode-input {
  width: 100%;
  padding: 15px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
  font-size: 1.2rem;
  text-align: center;
  outline: none;
  transition: all 0.3s ease;
}

.passcode-input:focus {
  border-color: #8a2be2;
  box-shadow: 0 0 15px rgba(138, 43, 226, 0.3);
}

.error-msg {
  color: #ff4757;
  font-size: 0.85rem;
  margin-top: 10px;
}

.verify-btn {
  width: 100%;
  padding: 15px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(45deg, #8a2be2, #4169e1);
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.verify-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(138, 43, 226, 0.4);
}

.verify-btn:active {
  transform: translateY(0);
}
</style>
