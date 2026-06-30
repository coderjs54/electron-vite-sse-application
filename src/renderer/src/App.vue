<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { marked } from 'marked'

// 状态
const streaming = ref(false)
const content = ref('')
const serverPort = ref(0)
const inputPrompt = ref('SSE 流式渲染技术')
const errorMsg = ref('')
const serverReady = ref(false)

let eventSource = null

// 使用 marked 渲染 Markdown 内容
const renderedContent = computed(() => {
  return marked.parse(content.value, { breaks: true })
})

// 初始化：获取服务器端口
onMounted(async () => {
  try {
    serverPort.value = await window.sse.getServerPort()
    serverReady.value = true
    console.log(`[Renderer] SSE 服务器端口: ${serverPort.value}`)
  } catch (err) {
    errorMsg.value = '无法连接到本地 Express 服务器'
    console.error('[Renderer] 获取服务器端口失败:', err)
  }
})

onUnmounted(() => {
  stopStream()
})

// 开始 SSE 流式接收
function startStream() {
  if (!serverPort.value || streaming.value) return

  stopStream()
  content.value = ''
  errorMsg.value = ''
  streaming.value = true

  const prompt = encodeURIComponent(inputPrompt.value || 'Hello')
  const url = `http://127.0.0.1:${serverPort.value}/sse?prompt=${prompt}`

  eventSource = new EventSource(url)

  eventSource.addEventListener('start', (e) => {
    const data = JSON.parse(e.data)
    console.log('[SSE] 流开始:', data.prompt)
  })

  eventSource.addEventListener('message', (e) => {
    try {
      const data = JSON.parse(e.data)
      content.value += data.content
      nextTick(() => {
        const el = document.querySelector('.stream-content')
        if (el) el.scrollTop = el.scrollHeight
      })
    } catch {
      // 忽略非 JSON 数据
    }
  })

  eventSource.addEventListener('done', () => {
    stopStream()
  })

  eventSource.onerror = () => {
    errorMsg.value = 'SSE 连接中断，请重试'
    stopStream()
  }
}

// 停止流式接收
function stopStream() {
  streaming.value = false
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
}

// 清空内容
function clearContent() {
  content.value = ''
  errorMsg.value = ''
}
</script>

<template>
  <div class="sse-container">
    <!-- 头部 -->
    <header class="sse-header">
      <h1>⚡ SSE 流式渲染演示</h1>
      <div class="server-status">
        <span class="status-dot" :class="{ active: serverReady }"></span>
        {{ serverReady ? `服务器已就绪 (端口: ${serverPort})` : '正在连接服务器...' }}
      </div>
    </header>

    <!-- 输入区域 -->
    <div class="input-area">
      <input
        v-model="inputPrompt"
        type="text"
        placeholder="输入话题，然后点击开始流式传输..."
        @keydown.enter="startStream"
        :disabled="streaming || !serverReady"
      />
      <button
        class="btn-start"
        @click="startStream"
        :disabled="streaming || !serverReady"
      >
        {{ streaming ? '接收中...' : '▶ 开始流式传输' }}
      </button>
      <button
        class="btn-stop"
        v-if="streaming"
        @click="stopStream"
      >
        ⏹ 停止
      </button>
      <button
        class="btn-clear"
        @click="clearContent"
        :disabled="streaming"
      >
        🗑 清空
      </button>
    </div>

    <!-- 错误信息 -->
    <div v-if="errorMsg" class="error-msg">
      {{ errorMsg }}
    </div>

    <!-- 流式内容显示区域 -->
    <div class="stream-content" :class="{ empty: !content && !streaming }">
      <div v-if="!content && !streaming" class="placeholder">
        <div class="placeholder-icon">📡</div>
        <p>在上方输入话题，点击"开始流式传输"查看 SSE 实时推送效果</p>
        <p class="hint">数据将以流式方式逐块到达并实时渲染</p>
      </div>
      <div v-else class="content-text" v-html="renderedContent"></div>
      <span v-if="streaming" class="cursor-blink">|</span>
    </div>

    <!-- 状态栏 -->
    <footer class="sse-footer">
      <span>状态: {{ streaming ? '🟢 接收中' : '⚪ 空闲' }}</span>
      <span v-if="content">已接收 {{ content.length }} 字符</span>
    </footer>
  </div>
</template>
