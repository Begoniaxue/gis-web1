<template>
  <header class="app-header">
    <div class="header-left">
      <el-icon class="logo-icon"><Connection /></el-icon>
      <h1 class="app-title">三维国土自然资源实景可视化系统</h1>
    </div>
    <div class="header-right">
      <el-button-group>
        <el-button size="small" @click="resetView">
          <el-icon><HomeFilled /></el-icon>
          复位视角
        </el-button>
        <el-button size="small" @click="toggleFullscreen">
          <el-icon><FullScreen /></el-icon>
          全屏
        </el-button>
      </el-button-group>
      <el-dropdown trigger="click">
        <span class="user-info">
          <el-avatar :size="32" icon="UserFilled" />
          <span class="username">管理员</span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>个人中心</el-dropdown-item>
            <el-dropdown-item>系统设置</el-dropdown-item>
            <el-dropdown-item divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { cesiumViewer } from '@/utils/cesiumViewer'
import * as Cesium from 'cesium'

function resetView() {
  const viewer = cesiumViewer.getViewer()
  if (viewer) {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(116.3974, 39.9093, 5000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0
      },
      duration: 2
    })
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}
</script>

<style scoped>
.app-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(90deg, rgba(20, 50, 100, 0.95) 0%, rgba(40, 80, 150, 0.95) 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  z-index: 1000;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
  color: #4fc3f7;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  color: white;
  margin: 0;
  letter-spacing: 2px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: white;
}

.username {
  font-size: 14px;
}
</style>
