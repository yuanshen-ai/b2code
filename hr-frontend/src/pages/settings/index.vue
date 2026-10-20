<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">Settings</h1>

    <div class="bg-white p-6 rounded-lg shadow">
      <h2 class="text-lg font-semibold mb-4">钉钉</h2>

      <div v-if="loading" class="text-gray-500">加载中...</div>

      <template v-else>
        <div v-if="statusResp.is_linked" class="text-green-700">
          已绑定钉钉
          <span v-if="statusResp.dingding_user?.nick"
            >（{{ statusResp.dingding_user?.nick }}）</span
          >
        </div>

        <div v-else class="text-gray-700 mb-3">未绑定钉钉</div>

        <button
          class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          :disabled="btnLoading"
          @click="onBindDingtalk"
        >
          登录钉钉
        </button>

        <div v-if="errorMsg" class="text-red-600 mt-3">{{ errorMsg }}</div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getDingtalkAuthorizeUrl, getDingtalkStatus } from '@/apis/user_api'

type DingTalkStatusResp = {
  is_linked: boolean
  dingding_user: null | {
    nick: string
    union_id: string
  }
}

const loading = ref(true)
const btnLoading = ref(false)
const errorMsg = ref('')
const statusResp = ref<DingTalkStatusResp>({ is_linked: false, dingding_user: null })

const fetchStatus = async () => {
  errorMsg.value = ''
  try {
    const resp = await getDingtalkStatus()
    statusResp.value = { ...resp, is_linked: !!resp.dingding_user }
  } catch (e: any) {
    errorMsg.value = e?.message || '获取钉钉绑定状态失败'
  } finally {
    loading.value = false
  }
}

const onBindDingtalk = async () => {
  btnLoading.value = true
  errorMsg.value = ''
  try {
    const resp = await getDingtalkAuthorizeUrl()
    console.log(resp)
    if (!resp?.authorize_url) {
      throw new Error('后端未返回 authorization_url')
    }
    window.location.href = resp.authorize_url
  } catch (e: any) {
    errorMsg.value = e?.message || '跳转钉钉登录失败'
  } finally {
    btnLoading.value = false
  }
}

onMounted(() => {
  fetchStatus()
})
</script>
