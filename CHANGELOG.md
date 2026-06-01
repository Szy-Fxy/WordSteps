# Changelog

## [3.0.0] - 2026-05-31

### 架构
- 状态管理重构：useReducer → Zustand Slices Pattern (4 个 slice)
- display 改为派生计算，消除双写竞态
- IPC 类型安全映射表，preload 重构

### 新增
- 自定义词库：`user-banks/` 文件夹层级自动加载
- 父子级联菜单：`{编号}-{显示名}/` 自动汇总
- `Ctrl+Alt+W` 全局快捷键恢复窗口
- `will-resize` 事件修复，确保比例锁定

### 修复
- 深色模式 Modal 对比度
- SpellArea 布局一致性
- 工具栏高度统一
- BankSelector 层级判断逻辑（前缀匹配替代分隔符计数）
- 复习队列 10 窗口过期防御

---

## [2.0.0] - 2026-05

- Electron 桌面版
- React 19 + TypeScript 重写
- Vite 构建
- Zustand 状态管理
- 有道发音

---

## [1.0.0] - 2026-04

- 原型：纯前端 HTML + CSS + JS
- 三种学习模式
- 基础词库打包
