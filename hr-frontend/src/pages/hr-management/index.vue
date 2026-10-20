<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-semibold">HR管理</h1>
    </div>

    <div>
      <el-table :data="rows" border stripe v-loading="loading">
        <el-table-column prop="realname" label="姓名" min-width="120" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="department.name" label="所属部门" min-width="140" />
        <el-table-column label="负责部门" min-width="180">
          <template #default="scope">
            <span>
              {{ (scope.row.managed_departments || []).map((d: any) => d.name).join('、') || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="openAssign(scope.row)">指派部门</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="assignVisible" title="指派负责部门" width="520px">
      <div class="mb-3 text-sm text-gray-600" v-if="selectedHR">
        {{ selectedHR.realname }}（{{ selectedHR.email }}）
      </div>

      <el-select
        v-model="selectedDepartmentIds"
        multiple
        filterable
        class="w-full"
        placeholder="请选择部门"
      >
        <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
      </el-select>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="assignVisible = false">取消</el-button>
          <el-button type="primary" :loading="assignSubmitting" @click="submitAssign"
            >确认指派</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  assignDepartments,
  getAllDepartments,
  type AssignDepartmentsSchema,
  getHRList,
} from '@/apis/user_api'
import { type User, type Department } from '@/stores/user'

const loading = ref(false)
const rows = ref<User[]>([])

const assignVisible = ref(false)
const assignSubmitting = ref(false)
const selectedHR = ref<User | null>(null)
const departments = ref<Department[]>([])
const selectedDepartmentIds = ref<string[]>([])

const openAssign = async (hr: User) => {
  selectedHR.value = hr

  selectedDepartmentIds.value = (hr.managed_departments || [])
    .map((d) => d.id)
    .filter((id): id is string => !!id)

  assignVisible.value = true

  if (departments.value.length === 0) {
    await fetchDepartments()
  }
}

const fetchDepartments = async () => {
  try {
    const res = await getAllDepartments()
    departments.value = res.departments || []
  } catch (e) {
    ElMessage.error('获取部门列表失败')
  }
}

const fetchHRList = async () => {
  loading.value = true
  try {
    const res = await getHRList()
    rows.value = res.hrs || []
  } catch (e) {
    ElMessage.error('获取HR列表失败')
  } finally {
    loading.value = false
  }
}

const submitAssign = async () => {
  if (!selectedHR.value) return

  const payload: AssignDepartmentsSchema = {
    hr_id: selectedHR.value.id,
    department_ids: selectedDepartmentIds.value,
  }

  assignSubmitting.value = true
  try {
    await assignDepartments(payload)
    ElMessage.success('指派成功')
    assignVisible.value = false
    await fetchHRList()
  } catch (e) {
    ElMessage.error('指派失败（仅HR Leader可操作）')
  } finally {
    assignSubmitting.value = false
  }
}

onMounted(async () => {
  await fetchHRList()
})
</script>
