<template>
  <el-dialog
    v-model="visible"
    title="缓冲区分析"
    width="400px"
    @close="handleClose"
  >
    <el-form :model="form" label-width="80px">
      <el-form-item label="中心点">
        <el-input v-model="centerText" placeholder="点击地图选择中心点" readonly />
        <el-button type="primary" size="small" @click="pickCenter" style="margin-top: 8px">
          <el-icon><Position /></el-icon>
          地图选点
        </el-button>
      </el-form-item>
      <el-form-item label="缓冲半径">
        <el-slider
          v-model="form.radius"
          :min="100"
          :max="2000"
          :step="100"
          :marks="{ 100: '100m', 500: '500m', 1000: '1km', 2000: '2km' }"
        />
        <span style="margin-left: 8px">{{ form.radius }} 米</span>
      </el-form-item>
    </el-form>

    <div v-if="result" class="result-section">
      <el-divider>分析结果</el-divider>
      <el-statistic title="范围内地块" :value="result.plots.length" style="margin-bottom: 12px" />
      <el-statistic title="范围内建筑" :value="result.buildings.length" style="margin-bottom: 12px" />
      <el-statistic title="范围内道路" :value="result.roads.length" />
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleAnalyze" :loading="loading">开始分析</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { api } from '@/api'
import { cesiumViewer } from '@/utils/cesiumViewer'
import type { BufferAnalysisResult } from '@/types'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const form = reactive({
  centerLng: 116.3974,
  centerLat: 39.9093,
  radius: 500
})

const centerText = computed(() => `${form.centerLng.toFixed(6)}, ${form.centerLat.toFixed(6)}`)

const result = ref<BufferAnalysisResult | null>(null)
const loading = ref(false)

function pickCenter() {
  const viewer = cesiumViewer.getViewer()
  if (!viewer) return

  const handler = new (Cesium as any).ScreenSpaceEventHandler(viewer.scene.canvas)
  handler.setInputAction((movement: any) => {
    const pick = viewer.scene.pickPosition(movement.position)
    if (pick) {
      const cartographic = Cesium.Cartographic.fromCartesian(pick)
      form.centerLng = Cesium.Math.toDegrees(cartographic.longitude)
      form.centerLat = Cesium.Math.toDegrees(cartographic.latitude)
      handler.destroy()
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}

async function handleAnalyze() {
  loading.value = true
  try {
    const res = await api.bufferAnalysis(
      { lng: form.centerLng, lat: form.centerLat },
      form.radius
    )
    
    if (res.code === 200) {
      result.value = res.data
      cesiumViewer.showBuffer(
        { lng: form.centerLng, lat: form.centerLat },
        form.radius
      )
    }
  } catch (error) {
    console.error('Buffer analysis failed:', error)
  } finally {
    loading.value = false
  }
}

function handleClose() {
  visible.value = false
  result.value = null
  cesiumViewer.clearBuffer()
}
</script>

<style scoped>
.result-section {
  max-height: 300px;
  overflow-y: auto;
}
</style>
