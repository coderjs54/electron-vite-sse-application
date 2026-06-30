import { contextBridge, ipcRenderer } from 'electron'

// 暴露 SSE 相关的 API 给渲染进程
const sseApi = {
  // 获取 Express 服务器的端口号
  getServerPort: () => ipcRenderer.invoke('get-server-port'),
  // 发送 ping 测试
  ping: () => ipcRenderer.send('ping')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('sse', sseApi)
  } catch (error) {
    console.error(error)
  }
} else {
  window.sse = sseApi
}
