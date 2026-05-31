# 02-Proposal：WordSteps 架构重构

> 日期：2026-05-31
> 需求级别：L3
> 状态：通过

---

## 一、为什么

### 当前架构的问题

| 问题 | 影响 | 证据 |
|------|------|------|
| 巨型 reducer（400+ 行，30+ action） | 任何改动都要读完整 reducer，心智负担高 | `WordState.tsx` 承载词库/会话/计数/UI/角色/持久化 6 个领域 |
| display 双写导致 Bug | 单词切换后卡住不变 | `animateThen` 和 `useEffect` 各自计算 display，旧数据覆盖新数据 |
| 全局 context 导致全量重渲染 | 性能浪费 | 所有组件都在 `WordContext.Provider` 下 |
| 自定义词库缺失 | 用户无法添加自己的词库 | Electron 版只有 6 个内置等级词库 |
| 状态与 UI 耦合 | 动画逻辑嵌入业务 reducer | `isAnimating`、`animDir` 和单词切换混在一起 |
| IPC 类型不安全 | `(window as any).electronAPI` 散落各处 | 4 个文件中有裸 `as any` |
| 窗口缩放失效 | 固定 px 值 + 主进程 resize 逻辑有 Bug | `main.ts` 的 `will-resize` 用 `getSize()` 比较，时序有问题 |

### 不重构的后果

- Bug 修一个冒一个（根源是架构层面）
- 加新功能（自定义词库、设置页面扩展）成本越来越高
- 项目无法交给另一个开发者维护

---

## 二、选定方案

**Zustand Slices Pattern**（详见 01-brainstorm 方案 A + 子代理调研修正）

### 为什么选这个

| 评测维度 | Zustand Slices | 独立 Zustand stores | useReducer + Context |
|----------|---------------|-------------------|---------------------|
| 跨 slice 依赖 | ✅ 通过 `get()` 直接访问 | ❌ 需手动桥接 | ✅ 自然支持 |
| 重渲染控制 | ✅ selector 按需订阅 | ✅ 但需跨 store 时复杂 | ❌ context 全部重渲染 |
| TypeScript 类型推导 | ✅ `StateCreator<A & B>` | ⚠️ 需手动联合 | ✅ |
| 包体积 | +3KB gzipped | +3KB | 0 |
| 学习成本 | 中 | 中 | 低（已熟悉） |
| 与 electron-store 集成 | ✅ middleware 无缝 | ✅ | ❌ 需手动同步 |

### 架构总览

```
┌─────────────────────────────────────────────┐
│  App.tsx（组件编排层）                        │
├─────────────────────────────────────────────┤
│  Components（只订阅需要的 store slice）        │
│  WordCard ← useSessionStore(s => s.display)  │
│  NavBar   ← useSessionStore(s => s.mode)     │
├─────────────────────────────────────────────┤
│  Hooks（派生状态 + 副作用）                    │
│  useDisplay   → 从 sessionStore 派生 display │
│  useAnimation → 独立动画状态机                │
│  useKeyboard  → 快捷键映射                    │
│  usePersistence → 自动写 electron-store      │
├─────────────────────────────────────────────┤
│  Store（Zustand bound store + 4 slices）      │
│  ┌──────────┬──────────┬──────────┬────────┐ │
│  │ wordbank │ session  │  stats   │   ui   │ │
│  │  slice   │  slice   │  slice   │ slice  │ │
│  └──────────┴──────────┴──────────┴────────┘ │
├─────────────────────────────────────────────┤
│  Services（纯函数，可替换）                     │
│  wordbankLoader.ts  │  storageService.ts     │
├─────────────────────────────────────────────┤
│  Electron Layer（主进程 + preload）            │
│  main.ts  │  preload.ts  │  IPC_CHANNELS    │
└─────────────────────────────────────────────┘
```

---

## 三、变更概要

### 3.1 新增文件

| 文件 | 职责 |
|------|------|
| `src/store/boundStore.ts` | 组合 4 个 slice 的 bound store 入口 |
| `src/store/wordbankSlice.ts` | 词库加载、当前 lib、words/allWords、切换词库 |
| `src/store/sessionSlice.ts` | index、mode、reviewQueue、拼写状态 |
| `src/store/statsSlice.ts` | todayCount、correctCount、totalAttempts、streak |
| `src/store/uiSlice.ts` | theme、hidden、ratio、settingsPanel、toast、modal、charState、feedback |
| `src/hooks/useDisplay.ts` | 从 session+wordbank store 派生 currentDisplay（单一数据源） |
| `src/hooks/useAnimation.ts` | 动画状态机（isAnimating、animDir） |
| `src/hooks/useKeyboard.ts` | 键盘快捷键（从 App.tsx 抽出） |
| `src/hooks/usePersistence.ts` | 监听 store 变化自动写 electron-store |
| `src/services/wordbankLoader.ts` | 词库加载：内置词库 + 扫描 user-banks/ |
| `src/services/storageService.ts` | electron-store 封装（读/写/迁移） |
| `src/types/electron.d.ts` | `window.electronAPI` 类型声明 |
| `src/types/ipc-channels.ts` | IPC channel 映射表 |
| `src/constants.ts` | localStorage key、CSS class 等字符串常量 |

### 3.2 修改文件

| 文件 | 改动 |
|------|------|
| `src/App.tsx` | 移除巨型 reducer 逻辑，改为读 store + 渲染组件 |
| `src/components/*.tsx` (14 个) | `useWordState()` 改为各自的 `useXxxStore(selector)` |
| `src/context/WordState.tsx` | **删除**，拆到 4 个 slice + hooks |
| `src/hooks/useAudio.ts` | 保持逻辑，hook 内读 store |
| `electron/preload.ts` | 基于 `IPC_CHANNELS` 映射表重构，完全类型安全 |
| `electron/main.ts` | 修复 `will-resize` 逻辑；新增 `ipcMain.handle('open-user-banks-folder')` |
| `index.html` | 不变（Vite 入口） |

### 3.3 删除文件

| 文件 | 原因 |
|------|------|
| `src/context/WordState.tsx` | 拆到 store/ + hooks/ |

### 3.4 新增依赖

| 包 | 版本 | 用途 | 大小 |
|----|------|------|------|
| `zustand` | ^5.x | 状态管理 | ~3KB gzip |
| `electron-store` | ^10.x | 持久化（替代 localStorage） | ~5KB gzip |

---

## 四、自定义词库实现路径

### 4.1 存储结构

```
%APPDATA%/WordSteps/
├── config.json              ← electron-store 管理的设置
├── user-banks/              ← 用户词库目录
│   ├── E-W001-编程词汇/
│   │   ├── Day1-基础名词/
│   │   │   └── words.json
│   │   ├── Day2-基础动词/
│   │   │   └── words.json
│   │   └── Day3-基础形容词/
│   │       └── words.json
│   └── 示例词库/             ← 首次启动自动生成
│       └── words.json       ← 模板文件
└── wordbanks-enriched.json  ← 内置词库（只读，打包在资源中）
```

### 4.2 菜单渲染

```
我的词库 ▾
├── 📁 E-W001-编程词汇 (50词)
│   ├── Day1-基础名词 (5词)
│   ├── Day2-基础动词 (5词)
│   └── Day3-基础形容词 (5词)
├── ──────────────
└── 📂 打开词库文件夹
```

### 4.3 设置项

在 SettingPanel 中新增：
- ☐ 显示词库编号前缀（默认开启）

### 4.4 数据流

```
启动 → wordbankLoader.loadAll()
         ├── fetch wordbanks-enriched.json（内置）
         ├── fs.readdir user-banks/（扫描）
         │     └── 递归解析文件夹 → 构建 WordBank 树
         └── 合并到 wordbankSlice.banks
```

---

## 五、数据流修正（display 单一数据源）

### 修正前（两个计算点互相覆盖）

```
用户点击 → dispatch(NEXT_WORD) → index++
           animateThen 内 computeDisplay(stateRef.current) → dispatch(SET_CURRENT_DISPLAY, 旧词)
           useEffect 检测到 index 变化 → computeDisplay(newState) → dispatch(SET_CURRENT_DISPLAY, 新词)
           ↑ 两次 dispatch 顺序不可控
```

### 修正后（单一派生）

```
用户点击 → sessionSlice.nextWord() → index++
           useDisplay() 检测到 index 变化 → 自动派生 display
           ↑ 不再有任何地方手动计算 display
```

`useDisplay` 的实现（伪代码）：

```typescript
function useDisplay(): DisplayData | null {
  const { index, words, allWords, reviewQueue } = useBoundStore();
  const [state, dispatch] = useAnimationStore();

  return useMemo(() => {
    // 1. 检查复习队列
    const review = reviewQueue.find(r => r.insertAfter <= index);
    if (review && index - review.insertAfter < 10) {
      const w = allWords.find(x => x.s === review.wordS);
      if (w) return { word: w, isReview: true, reviewData: review };
    }
    // 2. 正常单词
    if (!words.length) return null;
    return { word: words[index % words.length], isReview: false };
  }, [index, words, allWords, reviewQueue]);
}
```

---

## 六、影响范围

| 层级 | 文件数 | 操作 |
|------|--------|------|
| store/ | 5 | 新增 |
| hooks/ | 4 | 新增 |
| services/ | 2 | 新增 |
| types/ | 2 | 新增 |
| components/ | 14 | 修改（`useWordState()` → `useXxxStore()`） |
| App.tsx | 1 | 重写 |
| context/WordState.tsx | 1 | 删除 |
| electron/preload.ts | 1 | 重构 |
| electron/main.ts | 1 | 修改 |
| package.json | 1 | 新增依赖 |
| constants.ts | 1 | 新增 |

---

## 七、不在本次范围

- 内置词库编辑器（Phase 2）
- 多窗口同步（当前单窗口，不需要）
- IndexedDB 替代 wordbanks-enriched.json（文件仍可直接 fetch，性能够用）
- PWA 移动端（Electron 唯一主版本）
- 离线音频包下载功能（SettingPanel 已有占位按钮，实际下载逻辑 Phase 2）
- 旧原型维护（`D:/OH-WorkSpace/wordsteps/js/` 归档）

---

## 八、验收标准

1. 原有功能全部保留（浏览/回忆/拼写三种模式、发音、收藏、复习队列、连续打卡、角色表情）
2. "认识"/"不认识"/"下一个" 连续点击 50 轮，单词正常切换不卡死
3. 拼写模式下"跳过"、"提示"、"下一个" 行为一致
4. 按钮禁用状态正确（拼写提交前禁用切换模式，提交后可切换）
5. 窗口拖拽缩放保持比例，6 种比例切换正常
6. 自定义词库：在 `user-banks/` 下新建文件夹和 `words.json`，启动后自动出现在菜单中
7. 父子菜单正确：选父级 = 所有子级单词合并后的列表
8. localStorage 历史数据自动迁移到 electron-store（`wordsteps_mastered`、`wordsteps_favorites` 等 key）
9. TypeScript strict mode 通过，零 `any`
10. `npm run build` 成功

---

> **下一阶段**：L3-3 技术设计（`03-design.md`），细化每个 slice 的接口定义、IPC channel 映射表、组件与 store 的订阅关系。
