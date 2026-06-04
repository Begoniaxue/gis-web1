<template>
  <Transition name="slide">
    <div v-if="selectedPlot || selectedBuilding" class="info-panel">
      <div class="panel-header">
        <span class="panel-title">
          <el-icon><InfoFilled /></el-icon>
          {{ selectedPlot ? '地块信息' : '建筑信息' }}
        </span>
        <el-icon class="close-icon" @click="closePanel"><Close /></el-icon>
      </div>
      
      <div class="panel-content" v-if="selectedPlot">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="地块名称">{{ selectedPlot.name }}</el-descriptions-item>
          <el-descriptions-item label="权属单位">{{ selectedPlot.owner }}</el-descriptions-item>
          <el-descriptions-item label="用地性质">
            <el-tag :type="getLandUseTagType(selectedPlot.landUseType)" size="small">
              {{ selectedPlot.landUseType }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="地块面积">
            {{ (selectedPlot.area / 10000).toFixed(2) }} 公顷
          </el-descriptions-item>
          <el-descriptions-item label="地块等级">{{ selectedPlot.level }}</el-descriptions-item>
          <el-descriptions-item label="海拔高度">{{ selectedPlot.elevation }} m</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ selectedPlot.createTime }}</el-descriptions-item>
          <el-descriptions-item label="描述">{{ selectedPlot.description }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="panel-content" v-if="selectedBuilding">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="建筑名称">{{ selectedBuilding.name }}</el-descriptions-item>
          <el-descriptions-item label="建筑地址">{{ selectedBuilding.address }}</el-descriptions-item>
          <el-descriptions-item label="建筑类型">
            <el-tag type="info" size="small">{{ selectedBuilding.type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="建筑面积">
            {{ (selectedBuilding.area / 10000).toFixed(2) }} 万m²
          </el-descriptions-item>
          <el-descriptions-item label="楼层数量">{{ selectedBuilding.floors }} 层</el-descriptions-item>
          <el-descriptions-item label="建筑高度">{{ selectedBuilding.height }} m</el-descriptions-item>
          <el-descriptions-item label="建成年份">{{ selectedBuilding.buildYear }} 年</el-descriptions-item>
          <el-descriptions-item label="经纬度">
            {{ selectedBuilding.position.lng.toFixed(6) }}, {{ selectedBuilding.position.lat.toFixed(6) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMapStore } from '@/store/mapStore'

const mapStore = useMapStore()

const selectedPlot = computed(() => mapStore.selectedPlot)
const selectedBuilding = computed(() => mapStore.selectedBuilding)

function closePanel() {
  mapStore.setSelectedPlot(null)
  mapStore.setSelectedBuilding(null)
}

function getLandUseTagType(type: string): 'success' | 'warning' | 'danger' | 'info' | 'primary' {
  const typeMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary'> = {
    '商业用地': 'danger',
    '住宅用地': 'success',
    '工业用地': 'warning',
    '公共设施用地': 'info',
    '绿化用地': 'success',
    '交通用地': 'primary'
  }
  return typeMap[type] || 'info'
}
</script>

<style scoped>
.info-panel {
  position: absolute;
  top: 80px;
  right: 20px;
  width: 320px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: white;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.close-icon {
  cursor: pointer;
  font-size: 18px;
  transition: transform 0.2s;
}

.close-icon:hover {
  transform: rotate(90deg);
}

.panel-content {
  padding: 16px;
  max-height: 60vh;
  overflow-y: auto;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
