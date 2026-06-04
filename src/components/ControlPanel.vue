<template>
  <div class="control-panel">
    <el-collapse v-model="activeNames">
      <el-collapse-item name="basemap">
        <template #title>
          <span class="panel-title">
            <el-icon><Map /></el-icon>
            底图切换
          </span>
        </template>
        <el-radio-group v-model="baseMapType" size="small" @change="handleBaseMapChange">
          <el-radio-button label="tianditu_img">天地图影像</el-radio-button>
          <el-radio-button label="tianditu_vec">天地图矢量</el-radio-button>
          <el-radio-button label="gaode_img">高德影像</el-radio-button>
          <el-radio-button label="gaode_vec">高德矢量</el-radio-button>
        </el-radio-group>
      </el-collapse-item>

      <el-collapse-item name="layers">
        <template #title>
          <span class="panel-title">
            <el-icon><Tickets /></el-icon>
            图层控制
          </span>
        </template>
        <div class="layer-controls">
          <el-checkbox v-model="terrainEnabled" @change="handleTerrainChange">
            地形高程
          </el-checkbox>
          <el-checkbox v-model="buildingsVisible" @change="handleBuildingsChange">
            建筑模型
          </el-checkbox>
          <el-checkbox v-model="plotsVisible" @change="handlePlotsChange">
            地块数据
          </el-checkbox>
        </div>
      </el-collapse-item>

      <el-collapse-item name="effects">
        <template #title>
          <span class="panel-title">
            <el-icon><MagicStick /></el-icon>
            后处理特效
          </span>
        </template>
        <div class="effect-controls">
          <el-checkbox v-model="postEffects.bloom" @change="toggleEffect('bloom')">
            泛光效果
          </el-checkbox>
          <el-checkbox v-model="postEffects.fog" @change="toggleEffect('fog')">
            大气雾效
          </el-checkbox>
          <el-checkbox v-model="postEffects.depthOfField" @change="toggleEffect('depthOfField')">
            景深效果
          </el-checkbox>
        </div>
      </el-collapse-item>

      <el-collapse-item name="tools">
        <template #title>
          <span class="panel-title">
            <el-icon><Tools /></el-icon>
            空间查询
          </span>
        </template>
        <div class="tool-buttons">
          <el-radio-group v-model="selectionMode" size="small">
            <el-radio-button label="point">
              <el-icon><Position /></el-icon>
              点选
            </el-radio-button>
            <el-radio-button label="rectangle">
              <el-icon><Grid /></el-icon>
              框选
            </el-radio-button>
            <el-radio-button label="polygon">
              <el-icon><Crop /></el-icon>
              多边形
            </el-radio-button>
          </el-radio-group>
        </div>
      </el-collapse-item>

      <el-collapse-item name="analysis">
        <template #title>
          <span class="panel-title">
            <el-icon><DataAnalysis /></el-icon>
            空间分析
          </span>
        </template>
        <div class="analysis-buttons">
          <el-button type="primary" size="small" @click="openBufferDialog" style="width: 100%; margin-bottom: 8px">
            <el-icon><CircleCheck /></el-icon>
            缓冲区分析
          </el-button>
          <el-button type="success" size="small" @click="openRouteDialog" style="width: 100%">
            <el-icon><Guide /></el-icon>
            路径规划
          </el-button>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useMapStore } from '@/store/mapStore'
import type { BaseMapType } from '@/types'

const mapStore = useMapStore()
const activeNames = ref<string[]>(['basemap', 'layers', 'tools'])

const baseMapType = computed<BaseMapType>({
  get: () => mapStore.currentBaseMap,
  set: (val) => mapStore.setBaseMap(val)
})

const terrainEnabled = computed({
  get: () => mapStore.terrainEnabled,
  set: () => {}
})

const buildingsVisible = computed({
  get: () => mapStore.buildingsVisible,
  set: () => {}
})

const plotsVisible = computed({
  get: () => mapStore.plotsVisible,
  set: () => {}
})

const postEffects = reactive({
  bloom: mapStore.state.postEffects.bloom,
  fog: mapStore.state.postEffects.fog,
  depthOfField: mapStore.state.postEffects.depthOfField
})

const selectionMode = computed({
  get: () => mapStore.selectionMode,
  set: (val) => mapStore.setSelectionMode(val as 'point' | 'rectangle' | 'polygon')
})

function handleBaseMapChange(val: BaseMapType) {
  mapStore.setBaseMap(val)
}

function handleTerrainChange() {
  mapStore.toggleTerrain()
}

function handleBuildingsChange() {
  mapStore.toggleBuildings()
}

function handlePlotsChange() {
  mapStore.togglePlots()
}

function toggleEffect(effect: keyof typeof postEffects) {
  mapStore.togglePostEffect(effect as keyof typeof mapStore.state.postEffects)
  postEffects[effect] = mapStore.state.postEffects[effect as keyof typeof mapStore.state.postEffects]
}

const emit = defineEmits(['openBuffer', 'openRoute'])

function openBufferDialog() {
  emit('openBuffer')
}

function openRouteDialog() {
  emit('openRoute')
}
</script>

<style scoped>
.control-panel {
  position: absolute;
  top: 80px;
  left: 20px;
  width: 280px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.layer-controls,
.effect-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tool-buttons,
.analysis-buttons {
  width: 100%;
}

:deep(.el-collapse-item__content) {
  padding: 12px;
}

:deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
