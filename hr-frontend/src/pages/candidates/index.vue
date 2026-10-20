<template>
  <div class="flex justify-between items-center mb-4">
    <h1 class="text-2xl font-bold">候选人管理</h1>
  </div>
  <div>
    <div class="flex justify-end mb-4">
      <router-link to="/candidates/add">
        <el-button type="primary">添加候选人</el-button>
      </router-link>
    </div>

    <div class="flex">
      <el-table :data="candidates" style="width: 100%" border>
        <el-table-column prop="name" label="姓名"></el-table-column>
        <el-table-column prop="position.title" label="职位"></el-table-column>
        <el-table-column label="性别">
          <template #default="scope">
            <el-tag v-if="scope.row.gender == '男'" type="success">男</el-tag>
            <el-tag v-else-if="scope.row.gender == '女'" type="danger">女</el-tag>
            <el-tag v-else type="warning">未知</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱"></el-table-column>
        <el-table-column prop="phone_number" label="手机"></el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间"></el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button link type="primary" @click="showDetails(scope.row)">详情</el-button>
            <span class="ml-1"></span>
            <el-button link type="primary" @click="openStatusDialog(scope.row)">修改状态</el-button>
            <span class="ml-1"></span>
            <el-link
              type="primary"
              :href="http.baseURL + '/media/' + scope.row.resume.file_path"
              target="_blank"
              >简历</el-link
            >
            <span class="ml-1"></span>
            <el-button link type="primary" @click="showAIScore(scope.row)">AI评分</el-button>
            <el-button
              v-if="['AI筛选成功', 'AI筛选失败'].includes(scope.row.status)"
              link type="success"
              :loading="approvingId === scope.row.id"
              :disabled="!!approvingId || scope.row.interview_invitation_sent"
              @click="approveInterview(scope.row)"
            >{{ scope.row.interview_invitation_sent ? '邀请已发送' : '同意面试并发送邀请' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="detailsDialogVisible" title="候选人详情">
      <el-descriptions v-if="selectedCandidate" :column="2" border>
        <el-descriptions-item label="姓名">{{ selectedCandidate.name }}</el-descriptions-item>
        <el-descriptions-item label="职位">{{
          selectedCandidate.position.title
        }}</el-descriptions-item>
        <el-descriptions-item label="性别">
          <el-tag v-if="selectedCandidate.gender == '男'" type="success">男</el-tag>
          <el-tag v-else-if="selectedCandidate.gender == '女'" type="danger">女</el-tag>
          <el-tag v-else type="warning">未知</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ selectedCandidate.email }}</el-descriptions-item>
        <el-descriptions-item label="手机">{{
          selectedCandidate.phone_number
        }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTagType(selectedCandidate.status as string)">{{
            selectedCandidate.status
          }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="selectedCandidate.creator" label="推荐人">{{
          selectedCandidate.creator.realname
        }}</el-descriptions-item>
        <!-- <el-descriptions-item label="创建时间">{{
          selectedCandidate.created_at
        }}</el-descriptions-item> -->
        <el-descriptions-item label="工作经历" :span="2">{{
          selectedCandidate.work_experience || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="项目经历" :span="2">{{
          selectedCandidate.project_experience || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="教育经历" :span="2">{{
          selectedCandidate.education_experience || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="技能" :span="2">{{
          selectedCandidate.skills || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="自我评价" :span="2">{{
          selectedCandidate.self_evaluation || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="其他信息" :span="2">{{
          selectedCandidate.other_information || '-'
        }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailsDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="aiScoreDialogVisible" title="AI评分详情">
      <div v-if="aiScore">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="综合得分">{{ aiScore.overall_score }}</el-descriptions-item>
          <el-descriptions-item label="工作经验">{{
            aiScore.work_experience_score
          }}</el-descriptions-item>
          <el-descriptions-item label="技术能力">{{
            aiScore.technical_skills_score
          }}</el-descriptions-item>
          <el-descriptions-item label="软技能">{{
            aiScore.soft_skills_score
          }}</el-descriptions-item>
          <el-descriptions-item label="教育背景">{{
            aiScore.educational_background_score
          }}</el-descriptions-item>
          <el-descriptions-item label="项目经验">{{
            aiScore.project_experience_score
          }}</el-descriptions-item>
          <el-descriptions-item label="优势" :span="2">
            <ul>
              <li v-for="(strength, index) in aiScore.strengths" :key="index">{{ strength }}</li>
            </ul>
          </el-descriptions-item>
          <el-descriptions-item label="劣势" :span="2">
            <ul>
              <li v-for="(weakness, index) in aiScore.weaknesses" :key="index">{{ weakness }}</li>
            </ul>
          </el-descriptions-item>
          <el-descriptions-item label="总结" :span="2">{{ aiScore.summary }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="aiScoreDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="statusDialogVisible" title="修改候选人状态" width="520px">
      <el-form :model="statusForm" label-width="100px">
        <el-form-item label="当前状态">
          <el-tag
            v-if="statusCandidate"
            :type="getStatusTagType(statusCandidate.status as string)"
            >{{ statusCandidate.status }}</el-tag
          >
        </el-form-item>

        <el-form-item label="目标状态" required>
          <el-select v-model="statusForm.status" placeholder="请选择目标状态" style="width: 100%">
            <el-option v-for="s in selectableNextStatuses" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="statusForm.status === '待面试'" label="面试时间" required>
          <el-date-picker
            v-model="statusForm.interview_time"
            type="datetime"
            placeholder="请选择面试时间"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item v-if="statusForm.status === '面试未通过'" label="未通过原因" required>
          <el-input
            v-model="statusForm.rejection_reason"
            type="textarea"
            :rows="3"
            placeholder="请输入未通过原因"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="statusDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="statusSubmitting" @click="submitStatus"
            >确认</el-button
          >
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCandidates, getCandidateAiScore, updateCandidateStatus, approveCandidateInterview } from '@/apis/candidate_api'
import type { Candidate, CandidateAIScore } from '@/apis/candidate_api'
import { CandidateStatusEnum } from '@/apis/candidate_api'
import http from '@/apis/request'
import { getPositionList, type Position } from '@/apis/position_api'

const candidates = ref<Candidate[]>([])
const positions = ref<Position[]>([])

const detailsDialogVisible = ref(false)
const selectedCandidate = ref<Candidate | null>(null)

const showDetails = (candidate: Candidate) => {
  selectedCandidate.value = candidate
  detailsDialogVisible.value = true
}

// 修改状态
const statusDialogVisible = ref(false)
const statusSubmitting = ref(false)
const statusCandidate = ref<Candidate | null>(null)
const statusForm = ref<{
  status: string
  interview_time: Date | null
  rejection_reason: string
}>({
  status: '',
  interview_time: null,
  rejection_reason: '',
})

const statusFlow: string[] = [
  CandidateStatusEnum.APPLICATION,
  CandidateStatusEnum.AI_FILTER_FAILED,
  CandidateStatusEnum.AI_FILTER_PASSED,
  CandidateStatusEnum.WAITING_FOR_INTERVIEW,
  CandidateStatusEnum.REFUSED_INTERVIEW,
  CandidateStatusEnum.INTERVIEW_PASSED,
  CandidateStatusEnum.INTERVIEW_REJECTED,
  CandidateStatusEnum.HIRED,
  CandidateStatusEnum.REJECTED,
]

const selectableNextStatuses = computed(() => {
  if (!statusCandidate.value) return []
  const current = statusCandidate.value.status as unknown as string
  const idx = statusFlow.indexOf(current)
  if (idx < 0) return []
  return statusFlow.slice(idx + 1)
})

const openStatusDialog = (candidate: Candidate) => {
  statusCandidate.value = candidate
  statusForm.value = {
    status: '',
    interview_time: null,
    rejection_reason: '',
  }
  statusDialogVisible.value = true
}

const submitStatus = async () => {
  if (!statusCandidate.value) return
  if (!statusForm.value.status) {
    ElMessage.error('请选择目标状态')
    return
  }
  if (
    statusForm.value.status === CandidateStatusEnum.WAITING_FOR_INTERVIEW &&
    !statusForm.value.interview_time
  ) {
    ElMessage.error('请选择面试时间')
    return
  }
  if (
    statusForm.value.status === CandidateStatusEnum.INTERVIEW_REJECTED &&
    !statusForm.value.rejection_reason
  ) {
    ElMessage.error('请输入未通过原因')
    return
  }

  try {
    statusSubmitting.value = true
    await updateCandidateStatus(statusCandidate.value.id, {
      status: statusForm.value.status as any,
      interview_time: statusForm.value.interview_time
        ? (statusForm.value.interview_time as any).toISOString()
        : null,
      rejection_reason: statusForm.value.rejection_reason || null,
    })
    ElMessage.success('状态修改成功')
    statusDialogVisible.value = false
    await fetchCandidates()
  } catch (e) {
    ElMessage.error('状态修改失败')
  } finally {
    statusSubmitting.value = false
  }
}

const fetchCandidates = async () => {
  try {
    const response = await getCandidates({})
    candidates.value = response.candidates || []
  } catch (error) {
    ElMessage.error('获取候选人列表失败')
  }
}

const fetchPositions = async () => {
  try {
    const response = await getPositionList({})
    positions.value = response.positions || []
  } catch (error) {
    ElMessage.error('获取职位列表失败')
  }
}

// Map candidate status to Element Plus tag type
const getStatusTagType = (status: string): string => {
  switch (status) {
    case '已投递':
      return 'info'
    case 'AI筛选失败':
      return 'danger'
    case 'AI筛选成功':
      return 'success'
    case '待面试':
      return 'warning'
    case '拒绝面试':
      return 'info'
    case '面试通过':
      return 'success'
    case '面试未通过':
      return 'danger'
    case '已入职':
      return 'success'
    case '已拒绝':
      return 'danger'
    default:
      return 'default'
  }
}

const approvingId = ref<string | null>(null)
const approveInterview = async (candidate: Candidate): Promise<void> => {
  try {
    await ElMessageBox.confirm(
      `同意 ${candidate.name} 参加面试，并向 ${candidate.email} 发送面试邀请？系统将查询面试官空闲时间后发信。`,
      '批准面试', { confirmButtonText: '同意并发送', cancelButtonText: '取消', type: 'warning' },
    )
  } catch { return }
  approvingId.value = candidate.id
  try {
    await approveCandidateInterview(candidate.id)
    ElMessage.success('面试邀请已发送，等待候选人邮件回复')
    await fetchCandidates()
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.detail || '面试邀请处理失败，请检查后台日志')
  } finally {
    approvingId.value = null
  }
}

// AI Score dialog
const aiScoreDialogVisible = ref(false)
const aiScore = ref<CandidateAIScore | null>(null)

const showAIScore = async (candidate: Candidate) => {
  try {
    const data = await getCandidateAiScore(candidate.id)
    aiScore.value = data.ai_score
    aiScoreDialogVisible.value = true
  } catch (error) {
    ElMessage.error('暂无AI评分！')
  }
}

onMounted(() => {
  fetchCandidates()
  fetchPositions()
})
</script>
