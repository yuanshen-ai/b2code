<template>
  <div class="p-4 space-y-4">
    <!-- Header with Invite Button -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">员工管理</h1>
      <el-button type="primary" @click="openInviteDialog">
        <el-icon class="mr-1"><Plus /></el-icon>
        邀请员工
      </el-button>
    </div>

    <!-- Department Filter (only for superuser) -->
    <div v-if="currentUser?.is_superuser" class="mb-4">
      <el-select
        v-model="selectedDepartmentId"
        placeholder="选择部门筛选"
        filterable
        clearable
        style="width: 240px"
        @change="onDepartmentChange"
      >
        <el-option label="全部部门" :value="null" />
        <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
      </el-select>
    </div>

    <!-- Employee Table -->
    <el-table v-loading="loading" :data="employeeList" border style="width: 100%">
      <el-table-column label="用户名">
        <template #default="scope">
          <span>{{ scope.row.realname }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="realname" label="姓名" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="department.name" label="部门" />
      <el-table-column prop="created_at" label="入职时间" />
      <el-table-column label="是否 HR">
        <template #default="scope">
          <el-tag v-if="scope.row.is_hr" type="warning">HR</el-tag>
          <span v-else>否</span>
        </template>
      </el-table-column>
      <el-table-column label="是否部门Leader">
        <template #default="scope">
          <el-tag v-if="scope.row.is_department_leader" type="success">是</el-tag>
          <span v-else>否</span>
        </template>
      </el-table-column>
      <el-table-column label="状态">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'ACTIVE'" type="success">正常</el-tag>
          <el-tag v-else-if="scope.row.status === 'BLOCKED'" type="warning">被禁用</el-tag>
          <el-tag v-else type="info">离职</el-tag>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div class="flex justify-end">
      <el-pagination
        background
        :current-page="page"
        :page-size="size"
        layout="prev, pager, next"
        :total="total"
        @update:current-page="onPageChange"
      />
    </div>

    <!-- Invite Employee Dialog -->
    <el-dialog v-model="inviteDialogVisible" title="邀请员工" width="480px">
      <el-form :model="inviteForm" ref="inviteFormRef" :rules="inviteRules" label-width="100px">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="inviteForm.email" placeholder="请输入员工邮箱" />
        </el-form-item>
        <el-form-item label="所属部门" prop="department_id">
          <el-select v-model="inviteForm.department_id" placeholder="请选择部门" filterable>
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inviteDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitInvite">邀请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getUserList, inviteUser, getAllDepartments, type UserInviteSchema } from '@/apis/user_api'
import { useUserStore } from '@/stores/user'
import { type User, type Department } from '@/stores/user'

/* State */
const loading = ref(false)
const page = ref(1)
const size = ref(10)
const total = ref(0)
const employeeList = ref<User[]>([])
const departments = ref<Department[]>([])
const selectedDepartmentId = ref<string | null>(null)

/* Current user info */
const userStore = useUserStore()
const currentUser = userStore.getUserInfo

/* Invite Dialog */
const inviteDialogVisible = ref(false)
const inviteForm = ref<{ email: string; department_id: string | null }>({
  email: '',
  department_id: '',
})
const inviteFormRef = ref<FormInstance>()
const inviteRules = {
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
  department_id: [{ required: true, message: '请选择部门', trigger: 'change' }],
}

/* Fetch employee list */
const fetchEmployees = async () => {
  try {
    loading.value = true
    const params: { page: number; size: number; department_id?: string | null } = {
      page: page.value,
      size: size.value,
    }
    // 只有超级用户筛选时才传递部门ID
    if (currentUser?.is_superuser && selectedDepartmentId.value) {
      params.department_id = selectedDepartmentId.value
    }
    const response = await getUserList(params)
    employeeList.value = response.users || []
    total.value = response.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

/* Fetch departments */
const fetchDepartments = async () => {
  try {
    const response = await getAllDepartments()
    departments.value = response.departments || []
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchEmployees()
  fetchDepartments()
})

/* Pagination change */
const onPageChange = (newPage: number) => {
  console.log('Page changed to:', newPage)
  page.value = newPage
  fetchEmployees()
}

/* Department filter change */
const onDepartmentChange = () => {
  page.value = 1 // 重置到第一页
  fetchEmployees()
}

/* Invite functions */
const openInviteDialog = () => {
  inviteDialogVisible.value = true
}

const submitInvite = () => {
  inviteFormRef.value?.validate(async (valid) => {
    if (!valid) return
    try {
      await inviteUser(inviteForm.value as UserInviteSchema)
      ElMessage.success('邀请成功')
      inviteDialogVisible.value = false
    } catch (error) {
      ElMessage.error('邀请失败')
      console.error(error)
    }
  })
}
</script>

<style scoped></style>
