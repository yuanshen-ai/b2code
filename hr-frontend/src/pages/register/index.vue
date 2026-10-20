<template>
  <AuthLayout title="知了智能招聘系统" subtitle="开启您的招聘之旅">
    <el-form
      ref="ruleFormRef"
      :model="ruleForm"
      :rules="rules"
      label-position="top"
      class="space-y-6"
      @submit.prevent="submitForm(ruleFormRef)"
    >
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="ruleForm.email" size="large" placeholder="请输入邮箱地址" />
      </el-form-item>

      <el-form-item label="邀请码" prop="invite_code">
        <div class="flex w-full gap-x-4">
          <el-input v-model="ruleForm.invite_code" size="large" placeholder="请输入邀请码" />
        </div>
      </el-form-item>

      <el-form-item label="用户名" prop="username">
        <el-input v-model="ruleForm.username" size="large" placeholder="请输入用户名" />
      </el-form-item>

      <el-form-item label="真实姓名" prop="realname">
        <el-input v-model="ruleForm.realname" size="large" placeholder="请输入真实姓名" />
      </el-form-item>

      <el-form-item label="密码" prop="password">
        <el-input
          v-model="ruleForm.password"
          type="password"
          size="large"
          placeholder="请输入密码"
          show-password
        />
      </el-form-item>

      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          v-model="ruleForm.confirmPassword"
          type="password"
          size="large"
          placeholder="请再次输入密码"
          show-password
        />
      </el-form-item>

      <div>
        <el-button type="primary" native-type="submit" class="w-full" size="large">注册</el-button>
      </div>
    </el-form>

    <p class="mt-10 text-center text-sm text-gray-500">
      已有账户?
      {{ ' ' }}
      <router-link to="/login" class="font-semibold leading-6 text-indigo-600 hover:text-indigo-500"
        >立即登录</router-link
      >
    </p>
  </AuthLayout>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import AuthLayout from '@/components/AuthLayout.vue'
import { register, type RegisterData } from '@/apis/user_api'

const router = useRouter()
const ruleFormRef = ref<FormInstance>()

const ruleForm = reactive({
  email: '',
  invite_code: '',
  username: '',
  realname: '',
  password: '',
  confirmPassword: '',
})

const validatePass = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== ruleForm.password) {
    callback(new Error('两次输入的密码不一致!'))
  } else {
    callback()
  }
}

const rules = reactive<FormRules<typeof ruleForm>>({
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] },
  ],
  invite_code: [{ required: true, message: '请输入邀请码', trigger: 'blur' }],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度应为 2 到 20 个字符', trigger: 'blur' },
  ],
  realname: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '真实姓名长度应为 2 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应为 6 到 20 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { validator: validatePass, trigger: 'blur' },
  ],
})

async function submitForm(formEl: FormInstance | undefined) {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        await register(ruleForm as RegisterData)
        ElMessage.success('注册成功，请登录！')
        router.push('/login')
      } catch (error) {
        ElMessage.error('注册失败，请检查您的输入！')
      }
    } else {
      ElMessage.error('请修正表单中的错误')
    }
  })
}
</script>
