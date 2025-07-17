# Ximalaya Audio Decryption Tool

## 项目简介

这是一个用于解密喜马拉雅音频文件（.xm 格式）的现代化桌面应用程序，使用 **Electron + TypeScript + React + Vite** 技术栈构建，完全重构自原始 Python 版本。

## ✨ 功能特性

- 🔓 **三阶段解密**: 完整实现 ID3 解析、AES-256-CBC 解密和 WASM 模块处理
- 📁 **智能批量处理**: 支持拖拽和多文件同时解密
- 🎵 **全格式支持**: 自动识别并输出 MP3、M4A、FLAC、WAV 等格式
- 💻 **现代化界面**: 采用毛玻璃效果和渐变设计的优雅用户界面
- 🚀 **高性能**: 基于 Electron 的跨平台桌面应用
- 📊 **实时反馈**: 详细的解密进度和结果展示
- 🎨 **无工具栏设计**: 沉浸式的用户体验

## 🛠 技术架构

### 前端层
- **React 18** - 现代化用户界面框架
- **TypeScript** - 类型安全的开发体验
- **Vite** - 极速构建和热重载
- **CSS3** - 高级视觉效果和动画

### 后端层
- **Express.js** - 高性能 Web 服务器
- **Node.js** - 服务器运行时环境
- **AES-256-CBC** - 工业级加密算法
- **ID3 解析器** - 完整的音频元数据处理

### 桌面层
- **Electron** - 跨平台桌面应用框架
- **IPC 通信** - 安全的进程间通信
- **文件系统集成** - 原生文件操作支持

## 🚀 核心解密算法

本工具完整实现了喜马拉雅音频文件的解密流程：

### 第一阶段：ID3 元数据解析
- 解析 ID3v2.3 标签格式
- 提取标题、艺术家、专辑等信息
- 获取 ISRC、编码技术等解密参数

### 第二阶段：AES-256-CBC 解密
- 使用固定密钥 `ximalayaximalayaximalayaximalaya`
- 根据 ISRC 或编码者信息生成 IV
- 移除 PKCS7 填充并提取可打印字节

### 第三阶段：WASM 模块处理
- 调用原生 WASM 解密模块
- 使用轨道号作为解密参数
- 生成 Base64 编码的中间结果

### 第四阶段：数据重组
- 合并编码技术信息和解密结果
- Base64 解码生成最终音频数据
- 自动识别音频格式并添加扩展名

## 📦 安装和运行

### 开发环境

1. **克隆项目**
```bash
git clone <repository-url>
cd gui
```

2. **安装依赖**
```bash
npm install
```

3. **开发模式运行**
```bash
npm run dev
```

### 生产构建

1. **构建所有组件**
```bash
npm run build
```

2. **打包应用程序**
```bash
npm run dist
```

## 📁 项目结构

```
gui/
├── electron/              # Electron 主进程
│   ├── main.ts            # 主进程入口，窗口管理
│   ├── preload.ts         # 预加载脚本，IPC 桥接
│   └── tsconfig.json      # Electron TypeScript 配置
├── server/                # Express 后端服务
│   ├── services/          # 业务逻辑服务
│   │   └── decryptionService.ts  # 核心解密算法
│   ├── index.ts           # 服务器入口
│   └── tsconfig.json      # 服务器 TypeScript 配置
├── src/                   # React 前端应用
│   ├── components/        # UI 组件
│   │   ├── FileSelector.tsx      # 文件选择组件
│   │   ├── DecryptionProgress.tsx # 进度显示组件
│   │   └── ResultsDisplay.tsx    # 结果展示组件
│   ├── types/            # TypeScript 类型定义
│   ├── App.tsx           # 主应用组件
│   ├── main.tsx          # React 入口
│   ├── App.css           # 应用样式
│   └── index.css         # 全局样式
├── public/               # 静态资源
│   └── icon.svg          # 应用图标
├── .github/              # GitHub 配置
│   └── copilot-instructions.md  # Copilot 指令
├── package.json          # 项目配置
├── tsconfig.json         # TypeScript 配置
├── vite.config.ts        # Vite 配置
└── README.md            # 项目文档
```

## 🎯 使用说明

1. **启动应用**: 运行 `npm run dev` 或双击打包后的应用程序
2. **选择文件**: 拖拽 .xm 文件或点击选择按钮
3. **设置输出**: 选择解密后文件的保存目录（可选）
4. **开始解密**: 点击"开始解密"按钮
5. **查看结果**: 实时查看解密进度和详细结果

## 🔧 开发命令

```bash
# 开发模式（同时启动前端和 Electron）
npm run dev

# 分别启动组件
npm run dev:vite          # 仅前端开发服务器
npm run dev:electron      # 仅 Electron

# 构建命令
npm run build             # 构建所有组件
npm run build:vite        # 构建前端
npm run build:electron    # 构建 Electron
npm run build:server      # 构建后端

# 打包发布
npm run pack             # 打包应用
npm run dist             # 生成分发版本
```

## 💡 UI/UX 特性

- **无边框设计**: 隐藏传统工具栏，提供沉浸式体验
- **渐变背景**: 动态渐变和径向光晕效果
- **毛玻璃效果**: 现代化的半透明卡片设计
- **平滑动画**: 丰富的过渡动画和交互反馈
- **响应式布局**: 适配不同屏幕尺寸
- **深色主题**: 护眼的深色配色方案

## ⚙️ 系统要求

- **Node.js** 16.0 或更高版本
- **npm** 8.0 或更高版本
- **操作系统**: Windows 10+、macOS 10.15+、Linux（主流发行版）
- **内存**: 建议 4GB 以上
- **磁盘空间**: 500MB 可用空间

## 🔒 安全说明

- 本工具使用标准的加密算法，确保文件处理安全
- 所有文件处理都在本地进行，不会上传到任何服务器
- 临时文件会在处理完成后自动清理

## 🐛 故障排除

### 常见问题

1. **应用无法启动**
   - 确保已安装 Node.js 和所有依赖
   - 检查防火墙是否阻止应用运行

2. **解密失败**
   - 确认文件格式为 .xm
   - 检查文件是否损坏
   - 确保有足够的磁盘空间

3. **性能问题**
   - 关闭不必要的后台程序
   - 确保系统有足够的可用内存

## 📄 许可证

MIT License - 详见 LICENSE 文件

## ⚠️ 免责声明

- 本工具仅用于学习和研究目的
- 请确保您有权解密和使用相关音频文件
- 使用本工具产生的任何法律后果由用户自行承担

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 📧 联系方式

如有问题或建议，请通过 GitHub Issues 联系。
