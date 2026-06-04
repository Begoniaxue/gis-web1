<template>
  <el-dialog
    v-model="visible"
    title="路径规划"
    width="450px"
    @close="handleClose"
  >
    <el-form :model="form" label-width="80px">
      <el-form-item label="起点">
        <el-input v-model="startText" placeholder="点击地图选择起点" readonly />
        <el-button type="primary" size="small" @click="pickStart" style="margin-top: 8px">
          <el-icon><Position /></el-icon>
          选择起点
        </el-button>
      </el-form-item>
      <el-form-item label="终点">
        <el-input v-model="endText" placeholder="点击地图选择终点" readonly />
        <el-button type="success" size="small" @click="pickEnd" style="margin-top: 8px">
          <el-icon><Position /></el-icon>
          选择终点
        </el-button>
      </el-form-item>
    </el-form>

    <div v-if="result" class="result-section">
      <el-divider>规划结果</el-divider>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="总距离">
          {{ (result.distance / 1000).toFixed(2) }} km
        </el-descriptions-item>
        <el-descriptions-item label="预计时间">
          {{ Math.floor(result.duration / 60) }} 分钟
        </el-descriptions-item>
      </el-descriptions>
      
      <el-divider content-position="left">途经点</el-divider>
      <el-timeline>
        <el-timeline-item
          v-for="(point, index) in result.points"
          :key="index"
          :type="index === 0 ? 'success' : index === result.points.length - 1 ? 'danger' : 'primary'"
        >
          <div>{{ point.name }}</div>
          <div style="font-size: 12px; color: #999">
            {{ point.lng.toFixed(6) }}, {{ point.lat.toFixed(6) }}
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handlePlan" :loading="loading" :disabled="!canPlan">
        开始规划
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { api } from '@/api'
import { cesiumViewer } from '@/utils/cesiumViewer'
import type { RouteResult } from '@/types'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const form = reactive({
  startLng: 116.3874,
  startLat: 39.9093,
  endLng: 116.4074,
  endLat: 39.9093
})

const startText = computed(() => `${form.startLng.toFixed(6)}, ${form.startLat.toFixed(6)}`)
const endText = computed(() => `${form.endLng.toFixed(6)}, ${form.endLat.toFixed(6)}`)
const canPlan = computed(() => form.startLng && form.startLat && form.endLng && form.endLat)

const result = ref<RouteResult | null>(null)
const loading = ref(false)

function pickStart() {
  const viewer = cesiumViewer.getViewer()
  if (!viewer) return

  const handler = new (Cesium as any).ScreenSpaceEventHandler(viewer.scene.canvas)
  handler.setInputAction((movement: any) => {
    const pick = viewer.scene.pickPosition(movement.position)
    if (pick) {
      const cartographic = Cesium.Cartographic.fromCartesian(pick)
      form.startLng = Cesium.Math.toDegrees(cartographic.longitude)
      form.startLat = Cesium.Math.toDegrees(cartographic.latitude)
      handler.destroy()
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}

function pickEnd() {
  const viewer = cesiumViewer.getViewer()
  if (!viewer) return

  const handler = new (Cesium as any).ScreenSpaceEventHandler(viewer.scene.canvas)
  handler.setInputAction((movement: any) => {
    const pick = viewer.scene.pickPosition(movement.position)
    if (pick) {
      const cartographic = Cesium.Cartographic.fromCartesian(pick)
      form.endLng = Cesium.Math.toDegrees(cartographic.longitude)
      form.endLat = Cesium.Math.toDegrees(cartographic.latitude)
      handler.destroy()
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}

async function handlePlan() {
  loading.value = true
  try {
    const res = await api.planRoute(
      { lng: form.startLng, lat: form.startLat },
      { lng: form.endLng, lat: form.endLat }
    )
    
    if (res.code === 200) {
      result.value = res.data
      cesiumViewer.showRoute(res.data)
    }
  } catch (error) {
    console.error('Route planning failed:', error)
  } finally {
    loading.value = false
  }
}

function handleClose() {
  visible.value = false
  result.value = null
  cesiumViewer.clearRoute()
}
</script>

<style scoped>
.result-section {
  max-height: 350px;
  overflow-y: auto;
}
</style>
