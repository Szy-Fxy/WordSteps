# WordSteps（步步记词）

<p align="center">
  <img src="https://img.shields.io/badge/version-3.0-blue" alt="version">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license">
  <img src="https://img.shields.io/badge/language-TypeScript-3178c6" alt="language">
  <img src="https://img.shields.io/badge/platform-Windows-0078d6" alt="platform">
  <img src="https://img.shields.io/badge/framework-Electron-47848f" alt="framework">
  <img src="https://img.shields.io/badge/status-beta-orange" alt="status">
</p>

> 一款面向考研备考者的桌面端单词学习工具。浏览、回忆、拼写三种模式，内建评分调度复习，连续打卡追踪。

[English](#) | 简体中文

---

## 这是什么

WordSteps 是一个离线优先的 Electron 桌面应用，为系统性背单词而设计。支持从小学到托福的等级词库，也支持自定义词库（文件夹即词库，建好就能用）。不联网也能学，发音走有道 DictVoice。

设计原则：**数据先行、UI 后行**。词库质量决定工具天花板。

---

## 功能特性

- **三种学习模式**：浏览（看单词+释义+例句）、回忆（遮释义自测）、拼写（打单词，逐字母 diff 纠错）
- **艾宾浩斯复习调度**：答错的词自动进入复习队列，按间隔重新出现
- **自定义词库**：在 `user-banks/` 下建文件夹 + `words.json`，启动自动加载，支持父子级联菜单
- **学习伙伴角色**：🐟 小鱼会根据你的正确率切换表情（😊→😎→🎉），正向反馈驱动留存
- **连续打卡追踪**：每日学习计数 + 连续天数统计
- **摸鱼模式**：`Esc` 一键隐藏窗口，`Ctrl+Alt+W` 全局恢复，小窗口自适应比例
- **深色/浅色双主题**
- **6 种窗口比例**：9:16、3:2、1:1、3:4、2:3、16:9 + 自由拖拽
- **全键盘操作**：← 不认识 / ↓ 下一个 / → 认识 / Space 发音 / H 释义 / S 收藏
- **离线可用**：词库本地打包，发音走网络（后续支持离线音频包下载）

---

## 截图

> 即将添加

---

## 快速开始

### 下载安装

从 [Releases](https://github.com/Szy-Fxy/WordSteps/releases) 下载最新版。（暂无构建产物，请从源码运行）

| 平台 | 状态 |
|------|------|
| Windows | ✅ 即将发布 |
| macOS | 🔧 待适配 |
| Linux | 🔧 待适配 |

### 从源码运行

```bash
# 安装依赖
npm install

# 开发模式（Vite HMR + Electron）
npm run dev:electron

# 仅启动前端（浏览器调试）
npm run dev

# 生产构建
npm run build
```

---

## 自定义词库

在 `%APPDATA%/wordsteps/user-banks/` 下按文件夹层级创建词库：

```
user-banks/
├── E001-W1-核心词汇/          ← 父级（自动汇总所有子级单词）
│   ├── Day1-基础名词/
│   │   └── words.json        ← 单词数据
│   ├── Day2-基础动词/
│   │   └── words.json
│   └── Day3-基础形容词/
│       └── words.json
└── 示例词库/                  ← 首次启动自动生成
    └── words.json
```

`words.json` 格式：

```json
{
  "label": "Day1-基础名词",
  "words": [
    {
      "s": "variable",
      "p": "n. 变量（存储玩家血量的容器）",
      "ex": {
        "en": "The variable stores the player's health.",
        "cn": "变量存储了玩家的血量。"
      }
    }
  ]
}
```

必填字段：`s`（单词）、`p`（释义）。音标（`uk`/`us`）和例句（`ex`）可选。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面端 | Electron 28 |
| 前端 | React 19 + TypeScript |
| 状态管理 | Zustand 5 (Slices Pattern) |
| 构建 | Vite 6 |
| 打包 | electron-builder |
| 持久化 | electron-store + localStorage 迁移 |
| 发音 | 有道 DictVoice API |

---

## 架构

```
src/
├── store/          Zustand 状态管理（4 个 slice）
│   ├── wordbankSlice  词库加载与切换
│   ├── sessionSlice   学习会话（index/mode/复习队列）
│   ├── statsSlice     学习统计
│   └── uiSlice        主题/窗口/动画/反馈
├── hooks/          自定义 hooks
│   ├── useDisplay     单词显示（单一派生源）
│   ├── useAnimation   动画状态机
│   ├── useKeyboard    键盘快捷键
│   └── usePersistence 持久化同步
├── components/     React 组件（14 个）
├── services/       词库加载 / 存储服务
├── types/          类型定义 + IPC 类型安全映射表
electron/
├── main.ts         Electron 主进程（窗口管理 + 词库扫描）
└── preload.ts      IPC 桥接（类型安全）
```

**数据流**：`用户操作 → store action → index 变化 → useDisplay 派生 display → 组件重渲染`。display 是派生状态，不存储在 store 中，消除双写竞态。

---

## 版本

| 版本 | 日期 | 改动 |
|------|------|------|
| v3.0 | 2026-05-31 | 架构重构：Zustand Slices 替代 useReducer；自定义词库文件夹加载；IPC 类型安全；深色模式修复；拼写模式交互修正 |
| v2.0 | 2026-05 | Electron 桌面版，React + TypeScript 重写 |
| v1.0 | 2026-04 | 原型：纯前端 HTML + CSS + JS（index.html） |

---

## 开发

```bash
# 类型检查
npx tsc --noEmit

# 构建
npm run build

# 仅构建 Vite（不打包 Electron）
npm run build:unpack
```

---

## 许可证

[MIT](LICENSE)
