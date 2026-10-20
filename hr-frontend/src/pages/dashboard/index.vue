<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Dashboard</h1>
        <p class="text-sm text-gray-500">近 7 天趋势 + 职位/候选人指标</p>
      </div>
      <button
        class="px-3 py-2 rounded border text-sm hover:bg-gray-50"
        :disabled="loading"
        @click="refresh"
      >
        刷新
      </button>
    </div>

    <div v-if="error" class="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
      {{ error }}
    </div>

    <div
      class="p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 shadow-sm ring-1 ring-slate-200/70"
    >
      <div class="flex items-center justify-between">
        <div>
          <div class="text-base font-semibold text-slate-800">近 7 天新增候选人</div>
          <div class="mt-1 text-xs text-slate-500">候选人数量趋势</div>
        </div>
        <div v-if="loading" class="text-xs text-slate-400">加载中…</div>
      </div>
      <div
        ref="chartEl"
        class="mt-4 w-full rounded-xl bg-white/70 backdrop-blur-sm"
        style="height: 320px"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import { getLatest7DaysCandidates } from '@/apis/dashboard_api'

const loading = ref(false)
const error = ref<string | null>(null)

const chartEl = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

const chartDays = ref<string[]>([])
const chartCounts = ref<number[]>([])

const renderChart = () => {
  if (!chartEl.value) return

  if (!chart) {
    chart = echarts.init(chartEl.value)
  }

  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.88)',
      borderWidth: 0,
      textStyle: {
        color: '#F8FAFC',
      },
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: '#94A3B8',
          width: 1,
        },
      },
    },
    grid: {
      left: 16,
      right: 16,
      top: 22,
      bottom: 18,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: chartDays.value,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#64748B',
      },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          color: '#E2E8F0',
          type: 'dashed',
        },
      },
      axisLabel: {
        color: '#64748B',
      },
    },
    series: [
      {
        name: '候选人人数',
        type: 'line',
        smooth: true,
        data: chartCounts.value,
        showSymbol: false,
        lineStyle: {
          width: 3,
          color: '#4F46E5',
          shadowColor: 'rgba(79, 70, 229, 0.28)',
          shadowBlur: 8,
        },
        itemStyle: {
          color: '#4F46E5',
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            borderColor: '#EEF2FF',
            borderWidth: 2,
          },
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(79, 70, 229, 0.25)' },
            { offset: 1, color: 'rgba(79, 70, 229, 0.02)' },
          ]),
        },
      },
    ],
  })
}

const refresh = async () => {
  loading.value = true
  error.value = null

  try {
    const data = await getLatest7DaysCandidates()

    chartDays.value = data.map((item) => item.day)
    chartCounts.value = data.map((item) => item.count)

    await nextTick()
    renderChart()
  } catch (err) {
    console.error(err)
    error.value = '获取近 7 天候选人趋势失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

const handleResize = () => {
  chart?.resize()
}

onMounted(async () => {
  await refresh()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
  chart = null
})
</script>
