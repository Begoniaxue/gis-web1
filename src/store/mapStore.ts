import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BaseMapType, MapState, PlotInfo, BuildingInfo } from '@/types'

export const useMapStore = defineStore('map', () => {
  const state = ref<MapState>({
    currentBaseMap: 'osm_img',
    terrainEnabled: true,
    buildingsVisible: true,
    plotsVisible: true,
    postEffects: {
      bloom: true,
      fog: true,
      depthOfField: false
    }
  })

  const selectedPlot = ref<PlotInfo | null>(null)
  const selectedBuilding = ref<BuildingInfo | null>(null)
  const isSelecting = ref(false)
  const selectionMode = ref<'point' | 'rectangle' | 'polygon'>('point')

  const currentBaseMap = computed(() => state.value.currentBaseMap)
  const terrainEnabled = computed(() => state.value.terrainEnabled)
  const buildingsVisible = computed(() => state.value.buildingsVisible)
  const plotsVisible = computed(() => state.value.plotsVisible)

  function setBaseMap(type: BaseMapType) {
    state.value.currentBaseMap = type
  }

  function toggleTerrain() {
    state.value.terrainEnabled = !state.value.terrainEnabled
  }

  function toggleBuildings() {
    state.value.buildingsVisible = !state.value.buildingsVisible
  }

  function togglePlots() {
    state.value.plotsVisible = !state.value.plotsVisible
  }

  function togglePostEffect(effect: keyof MapState['postEffects']) {
    state.value.postEffects[effect] = !state.value.postEffects[effect]
  }

  function setSelectionMode(mode: 'point' | 'rectangle' | 'polygon') {
    selectionMode.value = mode
    isSelecting.value = false
  }

  function startSelection() {
    isSelecting.value = true
  }

  function stopSelection() {
    isSelecting.value = false
  }

  function setSelectedPlot(plot: PlotInfo | null) {
    selectedPlot.value = plot
  }

  function setSelectedBuilding(building: BuildingInfo | null) {
    selectedBuilding.value = building
  }

  return {
    state,
    selectedPlot,
    selectedBuilding,
    isSelecting,
    selectionMode,
    currentBaseMap,
    terrainEnabled,
    buildingsVisible,
    plotsVisible,
    setBaseMap,
    toggleTerrain,
    toggleBuildings,
    togglePlots,
    togglePostEffect,
    setSelectionMode,
    startSelection,
    stopSelection,
    setSelectedPlot,
    setSelectedBuilding
  }
})
