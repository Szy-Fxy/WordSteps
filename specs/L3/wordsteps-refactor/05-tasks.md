# 05-Tasks：WordSteps 架构重构任务清单

> 日期：2026-05-31
> 需求级别：L3
> 阶段：L3-5
> 状态：通过

---

## 依赖安装与类型基础设施

- [ ] 1.1 安装 `zustand`、`electron-store` 依赖
  - 文件：`package.json`
- [ ] 1.2 创建 `src/types/ipc-channels.ts`（IPC 映射表）
  - 文件：`src/types/ipc-channels.ts`
- [ ] 1.3 创建 `src/types/electron.d.ts`（window.electronAPI 类型声明）
  - 文件：`src/types/electron.d.ts`
- [ ] 1.4 创建 `src/constants.ts`（localStorage key、CSS class 等字符串常量）
  - 文件：`src/constants.ts`

---

## Services 层

- [ ] 2.1 创建 `src/services/storageService.ts`（electron-store 封装 + localStorage 迁移函数）
  - 文件：`src/services/storageService.ts`
- [ ] 2.2 创建 `src/services/wordbankLoader.ts`（内置词库加载 + 用户词库扫描）
  - 文件：`src/services/wordbankLoader.ts`

---

## Store Slices

- [ ] 3.1 创建 `src/store/uiSlice.ts`
  - 内容：darkTheme, hidden, winW, winH, ratioIdx, showSettings, settings, showBankNumber, charState, feedback, toast, modal, isAnimating, animDir + 全部 actions
  - 文件：`src/store/uiSlice.ts`
- [ ] 3.2 创建 `src/store/statsSlice.ts`
  - 内容：todayCount, correctCount, totalAttempts, spellCorrect, spellTotal, currentStreak, bestStreak, streakDays, dailyLog, libStates + actions
  - 文件：`src/store/statsSlice.ts`
- [ ] 3.3 创建 `src/store/sessionSlice.ts`
  - 内容：index, mode, reviewQueue, masteredWords, favorites, spellPhase + 全部 actions
  - 文件：`src/store/sessionSlice.ts`
- [ ] 3.4 创建 `src/store/wordbankSlice.ts`
  - 内容：wordBanks, loading, error, lib, allWords, words, isSearching + 全部 actions
  - 文件：`src/store/wordbankSlice.ts`
- [ ] 3.5 创建 `src/store/boundStore.ts`（组合 4 个 slice + persist middleware）
  - 文件：`src/store/boundStore.ts`

---

## Hooks

- [ ] 4.1 创建 `src/hooks/useDisplay.ts`（computeDisplay + useDisplay，复习词 10 窗口过期防御）
  - 文件：`src/hooks/useDisplay.ts`
- [ ] 4.2 创建 `src/hooks/useAnimation.ts`（animateThen，只调 fn 不读业务 state）
  - 文件：`src/hooks/useAnimation.ts`
- [ ] 4.3 创建 `src/hooks/useKeyboard.ts`（键盘快捷键，从 App.tsx 抽出）
  - 文件：`src/hooks/useKeyboard.ts`
- [ ] 4.4 创建 `src/hooks/usePersistence.ts`（store 变化 → electron-store 自动同步）
  - 文件：`src/hooks/usePersistence.ts`

---

## IPC & 主进程

- [ ] 5.1 重构 `electron/preload.ts`（基于 IPC_CHANNELS 映射表）
  - 文件：`electron/preload.ts`
- [ ] 5.2 修改 `electron/main.ts`
  - 新增 `ipcMain.handle('storage:save')`、`ipcMain.handle('bank:list-user')`、`ipcMain.handle('bank:open-folder')`
  - 修复 `will-resize` 等比缩放逻辑
  - 文件：`electron/main.ts`

---

## App.tsx 重写

- [ ] 6.1 重写 `src/App.tsx`
  - 移除 WordProvider、useReducer
  - 引入 useBoundStore、useDisplay、useAnimation、useKeyboard、usePersistence
  - 保留组件编排，移除 animateThen 中的 display 计算
  - 文件：`src/App.tsx`

---

## 组件改造（逐组件用 selector 替换 useWordState）

- [ ] 7.1 改造 `src/components/WordCard.tsx`
  - `useWordState()` → `useBoundStore(selector)`
  - `dispatch()` → `store.getState().xxxAction()`
  - 文件：`src/components/WordCard.tsx`
- [ ] 7.2 改造 `src/components/SpellArea.tsx`
  - 增加 `spellPhase` 状态、修复死控件（拼写模式隐藏/显示释义按钮不渲染）
  - 跳过停留改为 2000ms + 任意点击继续
  - 发音按钮移到释义右侧
  - 文件：`src/components/SpellArea.tsx`
- [ ] 7.3 改造 `src/components/NavBar.tsx`
  - 按钮禁用逻辑改为基于 `mode` + `spellPhase` 而非简单 `isSpell`
  - 文件：`src/components/NavBar.tsx`
- [ ] 7.4 改造 `src/components/BankSelector.tsx`
  - 新增自定义词库层级菜单渲染
  - "📂 打开词库文件夹"按钮
  - 文件：`src/components/BankSelector.tsx`
- [ ] 7.5 改造 `src/components/ModeTabs.tsx`
  - 文件：`src/components/ModeTabs.tsx`
- [ ] 7.6 改造 `src/components/SearchBar.tsx`
  - 文件：`src/components/SearchBar.tsx`
- [ ] 7.7 改造 `src/components/StatsBar.tsx`
  - 文件：`src/components/StatsBar.tsx`
- [ ] 7.8 改造 `src/components/TitleBar.tsx`
  - 比例按钮从循环改为下拉选择（含"自由"选项）
  - 文件：`src/components/TitleBar.tsx`
- [ ] 7.9 改造 `src/components/SettingsPanel.tsx`
  - 新增"☐ 显示词库编号前缀"设置项
  - 文件：`src/components/SettingsPanel.tsx`
- [ ] 7.10 改造其余组件：CharacterFace、FeedbackBar、FloatBall、ModalOverlay、ShortcutHints、Toast
  - 文件：`src/components/CharacterFace.tsx`、`FeedbackBar.tsx`、`FloatBall.tsx`、`ModalOverlay.tsx`、`ShortcutHints.tsx`、`Toast.tsx`

---

## CSS 修复

- [ ] 8.1 修复深色模式 CSS 变量覆盖
  - `.dark` 下补充 `--bg-card`、`--text-primary` 等变量
  - `.modal-box`、`.settings-box` 显式继承变量
  - 文件：`src/App.css`
- [ ] 8.2 SpellArea 布局重设计
  - 输入框 36px 统一高度
  - 辅助按钮同级排列
  - 发音按钮移到释义右侧
  - 文件：`src/App.css`
- [ ] 8.3 修复 buildFeedback 文案
  - `'star'` → "连续 N 次正确，状态不错！"
  - 文件：`src/hooks/useDisplay.ts` 或 `src/constants.ts`

---

## 清理

- [ ] 9.1 删除 `src/context/WordState.tsx`
  - 文件：`src/context/WordState.tsx`
- [ ] 9.2 更新 `useAudio.ts` 的 store 引用
  - `useWordState()` → `useBoundStore(selector)`
  - 文件：`src/hooks/useAudio.ts`

---

## 编译与验证

- [ ] 10.1 `tsc --noEmit` → 零错误
- [ ] 10.2 `npm run build` → 成功
- [ ] 10.3 手动验证 14 项验收标准（AC-01 ~ AC-14）
- [ ] 10.4 旧原型文件移入 `archive/`
  - 文件：`D:/OH-WorkSpace/wordsteps/index.html`、`js/`、`css/`

---

## 任务依赖图

```
1.x (基础设施)
  ↓
2.x (services)
  ↓
3.x (store slices)
  ↓
4.x (hooks)  ←→  5.x (IPC/主进程)
  ↓
6.1 (App.tsx)
  ↓
7.1~7.10 (组件改造)  ←→  8.x (CSS)
  ↓
9.1~9.2 (清理)
  ↓
10.x (验证)
```

任务总数：32 项。并行对：4.x 和 5.x 可同时做，7.x 和 8.x 可同时做。
