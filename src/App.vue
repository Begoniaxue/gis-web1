<template>
  <div class="app-container">
    <Header />
    <CesiumMap ref="mapRef" />
    <ControlPanel @open-buffer="showBufferDialog = true" @open-route="showRouteDialog = true" />
    <InfoPanel />
    
    <BufferDialog v-model="showBufferDialog" />
    <RouteDialog v-model="showRouteDialog" />
    
    <div class="status-bar">
      <span class="status-item">
        <el-icon><Location /></el-icon>
        经度: {{ currentLng.toFixed(6) }}°
      </span>
      <span class="status-item">
        <el-icon><Location /></el-icon>
        纬度: {{ currentLat.toFixed(6) }}°
      </span>
      <span class="status-item">
        <el-icon><View /></el-icon>
        高度: {{ currentHeight.toFixed(0) }} m
      </span>
      <span class="status-item">
        <el-icon><Aim /></el-icon>
        俯仰角: {{ pitch.toFixed(1) }}°
      </span>
      <span class="status-item right">
        <el-icon><CircleCheck /></el-icon>
        服务状态: 正常
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Header from '@/components/Header.vue'
import CesiumMap from '@/components/CesiumMap.vue'
import ControlPanel from '@/components/ControlPanel.vue'
import InfoPanel from '@/components/InfoPanel.vue'
import BufferDialog from '@/components/BufferDialog.vue'
import RouteDialog from '@/components/RouteDialog.vue'
import { cesiumViewer } from '@/utils/cesiumViewer'

const mapRef = ref()
const showBufferDialog = ref(false)
const showRouteDialog = ref(false)

const currentLng = ref(116.3974)
const currentLat = ref(39.9093)
const currentHeight = ref(5000)
const pitch = ref(-45)

onMounted(() => {
  setTimeout(() => {
    const viewer = cesiumViewer.getViewer()
    if (viewer) {
      viewer.camera.changed.addEventListener(() => {
        const position = viewer.camera.position
        const cartographic = Cesium.Cartographic.fromCartesian(position)
        currentLng.value = Cesium.Math.toDegrees(cartographic.longitude)
        currentLat.value = Cesium.Math.toDegrees(cartographic.latitude)
        currentHeight.value = cartographic.height
        pitch.value = Cesium.Math.toDegrees(viewer.camera.pitch)
      })
    }
  }, 1000)
})
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.status-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 32px;
  background: rgba(20, 30, 50, 0.85);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 24px;
  z-index: 100;
  color: #a0aec0;
  font-size: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-item.right {
  margin-left: auto;
  color: #68d391;
}
</style>
