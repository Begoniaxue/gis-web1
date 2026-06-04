<template>
  <div id="cesiumContainer" ref="cesiumContainer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { cesiumViewer } from '@/utils/cesiumViewer'
import { useMapStore } from '@/store/mapStore'
import { api } from '@/api'
import { spatialIndex } from '@/utils/spatialIndex'

const mapStore = useMapStore()
const cesiumContainer = ref<HTMLDivElement | null>(null)

onMounted(async () => {
  if (cesiumContainer.value) {
    cesiumViewer.init('cesiumContainer')
    await loadData()
    setupSelectionHandler()
  }
})

onUnmounted(() => {
  cesiumViewer.destroy()
})

async function loadData() {
  try {
    const [plotsRes, buildingsRes] = await Promise.all([
      api.getPlots(),
      api.getBuildings()
    ])

    if (plotsRes.code === 200) {
      cesiumViewer.addPlots(plotsRes.data)
    }

    if (buildingsRes.code === 200) {
      cesiumViewer.addBuildings(buildingsRes.data, 20)
    }

    spatialIndex.build(buildingsRes.data, plotsRes.data)
  } catch (error) {
    console.error('Failed to load data:', error)
  }
}

function setupSelectionHandler() {
  cesiumViewer.setupPointSelection((entity) => {
    if (entity && entity.properties) {
      const type = entity.properties.type?.getValue()
      const data = entity.properties.data?.getValue()
      
      if (type === 'plot') {
        mapStore.setSelectedPlot(data)
        mapStore.setSelectedBuilding(null)
      } else if (type === 'building') {
        mapStore.setSelectedBuilding(data)
        mapStore.setSelectedPlot(null)
      }
    } else {
      mapStore.setSelectedPlot(null)
      mapStore.setSelectedBuilding(null)
    }
  })
}

watch(
  () => mapStore.currentBaseMap,
  (newType) => {
    cesiumViewer.initBaseMap(newType)
  }
)

watch(
  () => mapStore.terrainEnabled,
  (enabled) => {
    cesiumViewer.enableTerrain(enabled)
  }
)

watch(
  () => mapStore.buildingsVisible,
  (visible) => {
    cesiumViewer.setBuildingsVisible(visible)
  }
)

watch(
  () => mapStore.plotsVisible,
  (visible) => {
    cesiumViewer.setPlotsVisible(visible)
  }
)

watch(
  () => mapStore.state.postEffects,
  (effects) => {
    Object.entries(effects).forEach(([effect, enabled]) => {
      cesiumViewer.setPostEffect(effect, enabled)
    })
  },
  { deep: true }
)

watch(
  () => mapStore.selectionMode,
  (mode) => {
    switch (mode) {
      case 'point':
        setupSelectionHandler()
        break
      case 'rectangle':
        cesiumViewer.setupRectangleSelection((entities) => {
          console.log('Selected entities:', entities)
        })
        break
      case 'polygon':
        cesiumViewer.setupPolygonSelection((entities) => {
          console.log('Selected entities:', entities)
        })
        break
    }
  }
)

defineExpose({
  viewer: cesiumViewer
})
</script>

<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
}
</style>
