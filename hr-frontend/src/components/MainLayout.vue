<template>
  <div class="h-screen flex">
    <!-- Side Navigation Menu -->
    <aside class="w-64 bg-white text-gray-800 flex flex-col border-r border-gray-200">
      <div class="p-4 text-xl font-bold h-16 flex items-center border-b border-gray-200">
        知了智能招聘系统
      </div>
      <nav class="flex-1 p-4">
        <ul>
          <li>
            <router-link
              to="/dashboard"
              class="flex items-center gap-3 py-3 px-4 rounded text-gray-600"
            >
              <el-icon><House /></el-icon>
              <span>首页</span>
            </router-link>
          </li>
          <li>
            <router-link
              to="/positions"
              class="flex items-center gap-3 py-3 px-4 rounded text-gray-600"
            >
              <el-icon><Postcard /></el-icon>
              <span>职位管理</span>
            </router-link>
          </li>
          <li>
            <router-link
              to="/candidates"
              class="flex items-center gap-3 py-3 px-4 rounded text-gray-600"
            >
              <el-icon><User /></el-icon>
              <span>候选人管理</span>
            </router-link>
          </li>
          <li>
            <router-link
              to="/employees"
              class="flex items-center gap-3 py-3 px-4 rounded text-gray-600"
            >
              <el-icon><OfficeBuilding /></el-icon>
              <span>员工管理</span>
            </router-link>
          </li>

          <li v-if="userStore.user?.is_superuser">
            <router-link
              to="/hr-management"
              class="flex items-center gap-3 py-3 px-4 rounded text-gray-600"
            >
              <el-icon><UserFilled /></el-icon>
              <span>HR管理</span>
            </router-link>
          </li>
        </ul>
      </nav>
    </aside>

    <div class="flex-1 flex flex-col">
      <!-- Top Navigation Bar -->
      <header class="bg-white shadow-md p-4 flex justify-between items-center h-16">
        <div><!-- Can be used for breadcrumbs or other info --></div>
        <div class="flex items-center pr-6">
          <el-dropdown>
            <span
              class="el-dropdown-link flex items-center cursor-pointer text-base focus:outline-none"
            >
              [{{ userStore.user?.department?.name }}] {{ userStore.user?.realname }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="goToSettings">
                  <el-icon><Setting /></el-icon>
                  <span>设置</span>
                </el-dropdown-item>
                <el-dropdown-item @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  <span>退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="flex-1 p-6 bg-gray-100 overflow-y-auto">
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  House,
  Postcard,
  User,
  UserFilled,
  OfficeBuilding,
  ArrowDown,
  Setting,
  SwitchButton,
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

onBeforeMount(() => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
  }
})

onMounted(() => {})

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

const goToSettings = () => {
  router.push('/settings')
}
</script>

<style>
.el-dropdown-menu {
  min-width: 120px;
}

.el-dropdown-menu__item {
  font-size: 1rem; /* Corresponds to text-base in Tailwind CSS */
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.el-dropdown-menu__item .el-icon {
  margin-right: 8px;
}

nav .router-link-active {
  background-color: #f3f4f6; /* bg-gray-100 */
  color: #3b82f6; /* text-blue-500 */
}
</style>
