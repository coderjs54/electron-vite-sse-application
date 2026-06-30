# electron-vite-sse-application

基于 **Electron + Vue3 + Express** 的 SSE（Server-Sent Events）流式渲染桌面应用示例。

![Tech Stack](https://img.shields.io/badge/Electron-39.2-blue?logo=electron)
![Tech Stack](https://img.shields.io/badge/Vue-3.5-green?logo=vue.js)
![Tech Stack](https://img.shields.io/badge/Express-5.2-grey?logo=express)
![Tech Stack](https://img.shields.io/badge/Vite-7.2-purple?logo=vite)

## 特性

- ⚡ **实时流式渲染** — 数据逐字到达，即时呈现，无需等待全部完成
- 🔒 **本地安全通信** — Express 服务仅监听 `127.0.0.1`，所有通信在本地进程间完成
- 📝 **Markdown 渲染** — 使用 `marked` 库解析，支持标题、表格、代码块、任务列表等
- 🎨 **明亮主题 UI** — 简洁现代的浅色界面，紫蓝渐变配色
- 🖥️ **Electron 桌面应用** — 跨平台支持 Windows / macOS / Linux

## 架构

```
┌──────────────────┐       IPC (get-server-port)      ┌────────────────────┐
│   渲染进程 (Vue)   │ ◄────────────────────────────── │   主进程 (Electron)  │
│                  │                                   │                    │
│  EventSource ────┼─── http://127.0.0.1:{port}/sse ──►  Express 服务器     │
│  实时渲染 Markdown │ ◄─── SSE data: {content} ──────── │  GET /sse?prompt   │
└──────────────────┘                                   └────────────────────┘
```

- **主进程**：启动 Express 服务器（监听随机端口），提供 SSE 端点，模拟 AI 逐字流式回复
- **Preload**：通过 `contextBridge` 暴露 `window.sse` API，安全桥接 IPC 通信
- **渲染进程**：Vue 3 组件通过 `EventSource` 连接 SSE，使用 `marked` 实时渲染 Markdown

## 技术栈

| 层面 | 技术 |
|------|------|
| 桌面框架 | Electron 39 |
| 构建工具 | electron-vite + Vite 7 |
| 前端框架 | Vue 3.5 (Composition API) |
| Markdown | marked |
| 后端服务 | Express 5.2 (主进程内) |
| 流式协议 | SSE (Server-Sent Events) |
| 包管理器 | pnpm |

## 项目结构

```
src/
├── main/                    # 主进程
│   └── index.js             # Electron 入口 + Express 服务器 + SSE 端点
├── preload/                 # 预加载脚本
│   └── index.js             # contextBridge 暴露 sseApi
└── renderer/                # 渲染进程
    ├── index.html           # HTML 入口
    └── src/
        ├── main.js          # Vue 入口
        ├── App.vue          # SSE 流式渲染主组件
        └── assets/
            ├── main.css     # 全局样式（明亮主题）
            └── base.css     # 基础变量
```

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 10

### 安装

```bash
pnpm install
```

### 开发

```bash
pnpm dev
```

启动后，Express 服务器运行在随机端口（仅 `127.0.0.1`），Vue 渲染进程自动获取端口并建立 SSE 连接。

### 构建

```bash
# Windows
pnpm build:win

# macOS
pnpm build:mac

# Linux
pnpm build:linux
```

## 工作流程

1. Electron 主进程启动后，Express 服务器监听 `127.0.0.1` 随机端口
2. 渲染进程通过 IPC `get-server-port` 获取端口号
3. 用户输入话题，点击"开始流式传输"
4. 渲染进程通过 `EventSource` 连接 `http://127.0.0.1:{port}/sse?prompt=xxx`
5. Express 服务器以 30ms 间隔逐字符推送数据（SSE 格式）
6. Vue 组件实时接收数据，`marked` 解析 Markdown，自动滚动显示

### SSE 事件流

```
event: start          →  流开始通知
data: {content}       →  逐字内容（×N 次）
event: done           →  流结束通知
```

## 代码检查

```bash
pnpm lint
pnpm format
```

## 推荐 IDE

- [VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## License

MIT
