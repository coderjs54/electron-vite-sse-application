import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import express from 'express'
import icon from '../../resources/icon.png?asset'

// 启动 Express 服务器
let serverPort = 0
const expressApp = express()

// SSE 模拟数据：一段 AI 风格的渐进式回复
const sampleData = `# SSE 流式传输详解

## 什么是 SSE？

**SSE**（Server-Sent Events）是一种基于 HTTP 的*单向通信协议*，允许服务端主动向客户端推送数据。

---

## 核心特点

| 特性 | SSE | WebSocket |
|------|-----|-----------|
| 通信方向 | 单向（服务端 → 客户端） | 双向 |
| 协议 | HTTP/HTTPS | ws/wss |
| 自动重连 | ✅ 内置支持 | ❌ 需手动实现 |
| 轻量程度 | ⭐⭐⭐ | ⭐⭐ |
| 浏览器支持 | 所有现代浏览器 | 所有现代浏览器 |

---

## 常用事件类型

1. **message** — 默认消息事件
2. **error** — 连接错误处理
3. **custom** — 自定义命名事件

\`\`\`javascript
// 前端创建 SSE 连接
const source = new EventSource('/api/stream');

source.onmessage = (event) => {
  console.log('收到数据:', event.data);
};

source.onerror = (err) => {
  console.error('连接错误:', err);
};
\`\`\`

## 适用场景

> SSE 特别适合 **AI 对话流式输出**、实时通知推送、股票行情更新等场景。

- [x] AI 大模型流式对话
- [x] 实时日志监控
- [x] 进度条更新
- [ ] 实时多人游戏（推荐 WebSocket）

---

## 💡 暂停/恢复功能

你现在可以使用下方的 **暂停** 和 **恢复** 按钮来控制流式传输的节奏。

点击暂停后，服务端会停止推送数据；
点击恢复后，会从暂停的位置继续推送。

---

## 小贴士

- 每条消息以 \`data:\` 开头，以 \`\\n\\n\` 结尾
- 服务端需设置 \`Content-Type: text/event-stream\`
- 可通过 \`id:\` 字段实现断点续传

> **提示**：你正在看到的这段内容，就是通过 SSE 逐字流式传输并实时渲染为 Markdown 格式的。`

// SSE 端点
expressApp.get('/sse', (req, res) => {
  // 设置 SSE 响应头
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  })

  const prompt = req.query.prompt || '默认话题'
  let sentLength = 0

  // 发送初始事件，告知流开始
  res.write(`event: start\ndata: ${JSON.stringify({ prompt })}\n\n`)

  // 逐字符发送数据，模拟流式 AI 回复效果
  const interval = setInterval(() => {
    if (sentLength >= sampleData.length) {
      // 发送完成事件
      res.write('event: done\ndata: [STREAM_COMPLETE]\n\n')
      clearInterval(interval)
      res.end()
      return
    }

    // 每次发送 1 个字符，模拟逐字流式输出
    const chunk = sampleData.slice(sentLength, sentLength + 1)
    res.write(`data: ${JSON.stringify({ content: chunk, index: sentLength })}\n\n`)
    sentLength++
  }, 30) // 每 30ms 发送 1 个字符
})

// 启动 Express 服务器
function startExpressServer() {
  return new Promise((resolve, reject) => {
    const server = expressApp.listen(0, '127.0.0.1', () => {
      serverPort = server.address().port
      console.log(`[SSE Server] Express server started on port: ${serverPort}`)
      resolve(serverPort)
    })
    server.on('error', reject)
  })
}

// 注册 IPC 处理
function registerIpcHandlers() {
  // 返回 Express 服务器端口号
  ipcMain.handle('get-server-port', () => {
    return serverPort
  })

  // 测试 ping
  ipcMain.on('ping', () => console.log('pong'))
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 750,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 启动 Express 服务器
  await startExpressServer()

  // 注册 IPC 处理
  registerIpcHandlers()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
