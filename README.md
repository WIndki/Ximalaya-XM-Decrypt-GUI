# Ximalaya Audio Decryption Tool

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-37.2.3-brightgreen.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0.5-purple.svg)](https://vitejs.dev/)

## 项目简介

这是一个用于解密喜马拉雅音频文件（.xm 格式）的现代化桌面应用程序，使用 **Electron + TypeScript + React + Vite** 技术栈构建，完全重构自 [![Github](https://img.shields.io/badge/Github-Diaoxiaozhang/Ximalaya--XM--Decrypt-blue?style=flat-square&logo=github)](https://github.com/Diaoxiaozhang/Ximalaya-XM-Decrypt) 版本。本项目提供了一个用户友好的图形界面，支持批量解密和实时进度反馈。

## ✨ 功能特性

- 🔓 **四阶段解密**: 完整实现 ID3 解析、AES-256-CBC 解密、WASM 模块处理和数据重组
- 📁 **智能批量处理**: 支持拖拽和多文件同时解密，性能优化的工作线程
- 🎵 **全格式支持**: 自动识别并输出 MP3、M4A、FLAC、WAV 等格式
- 💻 **现代化界面**: 采用 HeroUI 组件库和 Tailwind CSS 的优雅设计
- 🚀 **高性能**: 基于 Electron 37.2.3 的跨平台桌面应用
- 📊 **实时反馈**: 详细的解密进度、元数据展示和虚拟化列表
- 🎨 **无边框设计**: 沉浸式的用户体验和流畅动画
- 🛡️ **安全可靠**: 所有处理在本地完成，无需网络连接

![Screenshot](https://raw.githubusercontent.com/WIndki/Ximalaya-XM-Decrypt-GUI/main/public/screenshot.png)

## 🛠 技术架构

### 前端层
- **React 19.1.0** - 最新的用户界面框架
- **TypeScript 5.8.3** - 类型安全的开发体验
- **Vite 7.0.5** - 极速构建和热重载
- **Tailwind CSS 4.1.11** - 现代化的样式框架
- **HeroUI 2.8.1** - 优雅的 React 组件库
- **Framer Motion 12.23.6** - 流畅的动画效果
- **Lucide React 0.525.0** - 精美的图标集

### 桌面层
- **Electron 37.2.3** - 跨平台桌面应用框架
- **IPC 通信** - 安全的进程间通信
- **文件系统集成** - 原生文件操作支持
- **Worker Threads** - 多线程处理提升性能

### 核心依赖
- **music-metadata 11.7.0** - 音频元数据解析
- **node-id3 0.2.9** - ID3 标签处理
- **file-type 21.0.0** - 文件类型检测
- **crypto (Node.js)** - AES 加密解密

## 📦 快速开始

### 环境要求

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0  
- **操作系统**: Windows 10+、macOS 10.15+、Linux (主流发行版)
- **内存**: 建议 4GB 以上
- **磁盘空间**: 1GB 可用空间 (包含开发依赖)

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/WIndki/Ximalaya-XM-Decrypt-GUI.git
cd Ximalaya-XM-Decrypt-GUI
```

2. **安装依赖**
```bash
npm install
```

3. **开发模式运行**
```bash
npm run dev
```

4. **构建生产版本**
```bash
npm run build
```

5. **打包应用程序**
```bash
npm run dist
```

### 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发环境 (并发运行 Vite 和 Electron) |
| `npm run dev:vite` | 仅启动 Vite 开发服务器 |
| `npm run dev:electron` | 仅启动 Electron 应用 |
| `npm run build` | 构建所有组件 |
| `npm run build:vite` | 构建前端应用 |
| `npm run build:electron` | 构建 Electron 主进程 |
| `npm run pack` | 打包应用 (不创建安装程序) |
| `npm run dist` | 构建并创建分发包 |

## 📁 项目结构

```
Ximalaya-XM-Decrypt-GUI/
├── 📁 electron/                    # Electron 主进程
│   ├── 📄 main.ts                  # 主进程入口，窗口管理
│   ├── 📄 preload.ts               # 预加载脚本，IPC 桥接
│   ├── 📄 tsconfig.json            # Electron TypeScript 配置
│   ├── 📁 public/                  # Electron 静态资源
│   │   ├── 🖼️ icon.png             # 应用图标 (PNG)
│   │   └── 🖼️ icon.svg             # 应用图标 (SVG)
│   └── 📁 services/                # 核心业务逻辑
│       ├── 📄 decryptionManager.ts # 解密任务管理器
│       ├── 📄 decryptionService.ts # 核心解密算法实现
│       ├── 📄 decryptionWorker.ts  # 工作线程处理
│       └── 📄 xm_encryptor.wasm    # WASM 解密模块
├── 📁 src/                         # React 前端应用
│   ├── 📄 App.tsx                  # 主应用组件
│   ├── 📄 main.tsx                 # React 应用入口
│   ├── 📄 App.css                  # 应用样式
│   ├── 📄 index.css                # 全局样式
│   ├── 📄 hero.ts                  # 英雄组件逻辑
│   ├── 📁 components/              # UI 组件
│   │   ├── 📄 ResultsList.tsx      # 结果列表组件
│   │   ├── 📄 ThemeToggle.tsx      # 主题切换组件
│   │   ├── 📄 TitleBar.tsx         # 自定义标题栏
│   │   ├── 📄 TitleBar.css         # 标题栏样式
│   │   └── 📄 VirtualizedList.tsx  # 虚拟化列表组件
│   └── 📁 types/                   # TypeScript 类型定义
│       └── 📄 electron.d.ts        # Electron API 类型
├── 📁 public/                      # 前端静态资源
│   ├── 🖼️ icon.png                 # 应用图标
│   └── 🖼️ icon.svg                 # 应用图标 (矢量)
├── 📁 release/                     # 构建输出目录
│   ├── 📄 builder-debug.yml        # 构建调试配置
│   ├── 📄 builder-effective-config.yaml # 有效构建配置
│   ├── 📦 Ximalaya Decrypt Tool Setup 1.0.0.exe # Windows 安装程序
│   └── 📁 win-unpacked/            # Windows 解包版本
├── 📄 package.json                 # 项目配置和依赖
├── 📄 tsconfig.json                # TypeScript 配置
├── 📄 tsconfig.node.json           # Node.js TypeScript 配置
├── 📄 vite.config.mts              # Vite 构建配置
├── 📄 tailwind.config.js           # Tailwind CSS 配置
├── 📄 postcss.config.js            # PostCSS 配置
├── 📄 index.html                   # HTML 入口文件
├── 📄 test-decryption.ts           # 解密测试脚本
├── 📄 decryptionService copy.ts    # 解密服务备份
└── 📄 README.md                    # 项目文档
```

## 🎯 使用说明

### 基本操作流程

1. **启动应用**
   ```bash
   npm run dev          # 开发模式
   # 或者运行打包后的应用程序
   ```

2. **文件选择**
   - 方式一：点击"选择文件"按钮，支持多选
   - 方式二：直接拖拽 .xm 文件到应用窗口
   - 支持的文件格式：`.xm` (喜马拉雅加密音频)

3. **配置设置**
   - 选择输出目录（可选，默认为源文件同目录）
   - 查看文件列表和预估处理时间

4. **开始解密**
   - 点击"开始解密"按钮
   - 实时查看解密进度和处理状态
   - 支持取消操作

5. **查看结果**
   - 详细的解密结果展示
   - 音频元数据信息
   - 文件输出路径和格式信息
   - 错误日志（如果有）

### 界面功能详解

#### 主界面区域
- **文件选择区**: 支持拖拽上传，显示文件数量和总大小
- **进度显示**: 实时进度条，当前处理文件名和完成百分比
- **结果列表**: 虚拟化列表，高效显示大量处理结果

#### 解密结果信息
- ✅ **成功**: 显示输出路径、文件格式、音频元数据
- ❌ **失败**: 显示错误信息和失败原因
- � **统计**: 成功/失败数量、处理时间、输出格式分布

#### 键盘快捷键
- `Ctrl+O`: 打开文件选择对话框
- `Ctrl+S`: 选择输出目录
- `Enter`: 开始解密
- `Esc`: 取消当前操作

## �🔧 开发与构建

### 开发环境设置

1. **安装开发依赖**
   ```bash
   npm install
   ```

2. **启动开发服务器**
   ```bash
   npm run dev:vite     # 前端开发服务器 (http://localhost:5173)
   npm run dev:electron # Electron 开发环境
   npm run dev          # 并发启动前端和 Electron
   ```

3. **代码检查和格式化**
   ```bash
   npx tsc --noEmit     # TypeScript 类型检查
   npx tailwindcss -i src/index.css -o dist/style.css --watch
   ```

### 构建配置

#### Vite 配置 (`vite.config.mts`)
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

#### Electron Builder 配置 (`package.json`)
```json
{
  "build": {
    "appId": "com.ximalaya.decrypt",
    "productName": "Ximalaya Decrypt Tool",
    "directories": {
      "output": "release"
    },
    "extraResources": [
      {
        "from": "electron/services/xm_encryptor.wasm",
        "to": "xm_encryptor.wasm"
      }
    ],
    "win": {
      "icon": "public/icon.png",
      "target": "nsis"
    },
    "mac": {
      "icon": "public/icon.png",
      "category": "public.app-category.utilities"
    },
    "linux": {
      "icon": "public/icon.png",
      "target": "AppImage"
    }
  }
}
```

### 构建命令详解

| 命令 | 说明 | 输出目录 |
|------|------|----------|
| `npm run build:vite` | 构建前端应用 | `dist/renderer/` |
| `npm run build:electron` | 构建 Electron 主进程 | `dist/electron/` |
| `npm run build` | 构建所有组件 | `dist/` |
| `npm run pack` | 打包应用 (不创建安装程序) | `release/` |
| `npm run dist` | 构建并创建分发包 | `release/` |

### 平台特定构建

#### Windows
```bash
npm run dist           # 创建 NSIS 安装程序
# 输出: release/Ximalaya Decrypt Tool Setup 1.0.0.exe
```

#### macOS
```bash
npm run dist           # 创建 DMG 安装包
# 需要在 macOS 系统上运行
```

#### Linux
```bash
npm run dist           # 创建 AppImage
# 输出: release/Ximalaya Decrypt Tool-1.0.0.AppImage
```


## 📄 许可证

本项目采用 **MIT 许可证**，允许自由使用、修改和分发。

```
MIT License

Copyright (c) 2024 Ximalaya Decrypt Tool

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## ⚠️ 免责声明

- **教育目的**: 本工具仅用于学习和研究目的
- **合法使用**: 请确保您有权解密和使用相关音频文件
- **版权尊重**: 请尊重音频内容的版权，不得用于商业用途
- **法律责任**: 使用本工具产生的任何法律后果由用户自行承担
- **技术支持**: 作者不对使用本工具造成的任何损失承担责任