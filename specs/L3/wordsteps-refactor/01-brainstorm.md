# 01-Brainstorm：WordSteps 架构重构

> 日期：2026-05-31
> 需求级别：L3
> 状态：通过

---

## 一、问题清单

### 1.1 核心 Bug：单词切换后无变化

**症状**：连续点击"认识"/"不认识"/"下一个"多轮后，单词卡住不变。

**根因定位**（代码追踪）：

```
App.tsx animateThen 函数（第 58 行附近）：

setTimeout(() => {
    fn();                                    // dispatch NEXT_WORD（index++）
    const s = stateRef.current;              // ← stateRef 仍是旧 state（React 未渲染）
    const d = computeDisplay(s);             // ← 用旧 index 算出旧单词
    dispatch({ type: 'SET_CURRENT_DISPLAY', d });  // ← 把旧单词写入 currentDisplay
    ...
}, 250);
```

React 批处理 NEXT_WORD 和 SET_CURRENT_DISPLAY 后，`useEffect` 检测到 index 变化再次调用 `computeDisplay(newState)` 并 dispatch 正确的单词。但这里存在三个隐患：

1. **双写竞态**：SET_CURRENT_DISPLAY 被先后 dispatch 两次（先旧后新），React 批处理顺序不可控
2. **isAnimating 锁 600ms**：`animateThen` 开头 `if (stateRef.current.isAnimating) return;` 阻止连续操作，但锁释放时 stateRef 可能已过期
3. **computeDisplay 的 reviewQueue 干扰**：如果队列中有 `insertAfter <= index` 的复习词，`computeDisplay` 始终返回同一个复习词，导致 index 递增但 display 不变

**结论**：问题 3 最可能是主因。复习队列中的词可能因 insertAfter 计算问题一直匹配当前 index，导致 index 推进但 display 始终是同一个复习词。

### 1.2 按钮不合理禁用

| 组件 | 问题 | 原因 |
|------|------|------|
| NavBar | 拼写模式下"认识/不认识"被 disabled，但"下一个"可以点，点了却不解锁拼写状态 | `disabled={isSpell}` 一刀切，拼写未完成状态没正确处理 |
| SpellArea | 拼写错误后 spellLocked=true，但错误反馈后再次提交的行为不一致 | `spellLocked` 和 `tried` 两个状态互不同步 |
| 全局 | 动画期间（600ms）所有键盘/点击被锁 | `isAnimating` 守卫太激进 |

### 1.3 窗口比例不自适应

**现状**：
- 主进程 `main.ts` 的 `will-resize` 处理器逻辑有缺陷——用 `getSize()` 和 `newBounds` 比较时取了错误的参考点
- CSS 大量使用固定 px 值（如 `480px`、`720px`），且 CSS 变量体系不完整
- 6 种比例切换只改窗口大小，CSS 不响应

---

## 二、架构诊断

### 2.1 巨型 Reducer（WordState.tsx，400+ 行）

当前所有状态挤在一个 reducer 里：

```
WordState
├── 词库数据（wordBanks, loading, error）
├── 会话（lib, words, index, mode, currentDisplay）
├── 计数（todayCount, correctCount, spellCorrect…）
├── UI（darkTheme, hidden, ratioIdx, showSettings, toast, modal）
├── 角色（charState, feedbackMsg）
├── 复习（reviewQueue, masteredWords）
└── 持久化（8 个 useEffect 分别写 localStorage）
```

**后果**：
- 改一个 action 要读完整 reducer，心智负担高
- 全局 context 导致所有组件在任何 state 变化时都重新渲染
- 无法做细粒度单元测试

### 2.2 数据流双向耦合

当前链路：
```
用户点击 → dispatch(action) → reducer → state 变化
                                            ↓
                                    animateThen（读 stateRef）
                                            ↓
                                    computeDisplay（旧 state）
                                            ↓
                                    dispatch(SET_CURRENT_DISPLAY)
                                            ↓
                                    useEffect 检测到变化
                                            ↓
                                    computeDisplay（新 state）
                                            ↓
                                    dispatch(SET_CURRENT_DISPLAY) ← 第二次
```

display 被计算了两次，且第一次用的是旧数据。

### 2.3 自定义词库缺失

旧原型（`index.html`）有完整的自定义词库体系（`custom-w1`, `custom-w1-d1/d2/d3`），但 Electron 版完全没有：
- 只有 6 个等级词库 + "全部收藏"/"今日收录"
- `wordbanks-enriched.json` 是 5MB 单体文件，无法扩展
- 没有用户导入词库的入口

### 2.4 类型安全缺失

- `tsconfig.json` 未开启 `strict: true`
- `(window as any).electronAPI` 散落各处
- IPC channel 名称是裸字符串

---

## 三、目标架构方案

### 方案 A：Zustand 分片（推荐）

```
src/
├── store/
│   ├── wordbankStore.ts    # 词库加载、当前 lib、words/allWords
│   ├── sessionStore.ts     # index, mode, currentDisplay, reviewQueue
│   ├── statsStore.ts       # 计数器
│   └── uiStore.ts          # 主题、窗口、设置面板、toast、modal
├── hooks/
│   ├── useDisplay.ts       # 从 sessionStore 派生 currentDisplay（单一数据源）
│   ├── useAnimation.ts     # 动画状态机，有自己独立的状态，不混入业务 store
│   ├── usePersistence.ts   # 监听 store 变化自动写 localStorage
│   └── useKeyboard.ts      # 快捷键（从 App.tsx 抽出）
├── services/
│   ├── wordbankLoader.ts   # 统一词库加载接口
│   └── storageService.ts   # localStorage 封装
├── components/             # 保持不变，各组件按需订阅各自 store
└── types/                  # 集中类型定义
```

**优点**：
- 每个 store 独立，可以单独测试
- 组件只订阅需要的 slice，避免无意义重渲染
- `useDisplay` 是派生状态，不再双写
- 拆完后每个文件 50-100 行，新人 10 分钟能看懂

**缺点**：
- 引入 Zustand 新依赖（包体积 +3KB gzipped）
- 跨 store 通信需要显式调用 `useXxxStore.getState()`

### 方案 B：useReducer + Context 组合（保守）

保留 useReducer 模式，但拆成 4 个独立的 context：

```
WordBankContext
SessionContext
UIContext
```

每个 context 只暴露自己的 state 和 dispatch。

**优点**：不引入新依赖
**缺点**：
- 仍然有 context 重渲染问题（React context 的固有缺陷）
- 不如 Zustand 简洁
- `WordState.tsx` 依然会很大（只是拆成 4 个文件）

**推荐方案 A**。

---

## 四、Bug 修复策略（不依赖重构即可执行）

### 4.1 修复显示冻结（可立即执行）

三处改动，不影响架构：

1. **`WordState.tsx` 的 `NEXT_WORD` reducer**：增加 `reviewQueue` 清理逻辑——当 index 推进且当前 display 是复习词时，从队列中移除该词
2. **`App.tsx` 的 `animateThen`**：删除 setTimeout 内的 `computeDisplay` + `SET_CURRENT_DISPLAY` 两行，display 完全交给 useEffect
3. **`computeDisplay`**：增强防御，如果 review 词的 `insertAfter` 已经远小于 index（差距 > 10），视为过期，跳过

### 4.2 修复按钮禁用

- NavBar：`disabled={isSpell}` 改为 `disabled={isSpell && state.spellLocked}`（拼写中未提交时禁用，已提交后可切换）
- SpellArea：合并 `spellLocked` 和 `tried` 为统一状态 `spellPhase: 'input' | 'submitted' | 'retry'`

### 4.3 修复窗口缩放

- 主进程 `will-resize`：用当前窗口尺寸 `[w, h]` 判断用户拖拽的边，用 `setAspectRatio()` 替代手动计算
- CSS：将固定的 480/720 替换为 CSS 变量，配合 `aspect-ratio` 属性

---

## 五、自定义词库方案（已确认）

### 决策

采用文件夹即层级方案（方案 A），用户通过文件夹结构自由组织多层词库。

### 文件结构

```
%APPDATA%/WordSteps/user-banks/
└── E-W001-编程词汇/              ← 文件夹 = 父级菜单
    ├── Day1-基础名词/
    │   └── words.json
    ├── Day2-基础动词/
    │   └── words.json
    └── Day3-基础形容词/
        └── words.json
```

### 命名约定

- 格式：`{编号}-{显示名}/`，如 `E-W001-编程词汇/`
- 编号决定排序，显示名决定菜单文字
- 用户可在设置中选择是否显示编号前缀

### 渲染规则

- 文件夹有 `words.json` → 叶子节点
- 文件夹有子文件夹 → 父节点，单词 = 所有后代的合集
- 父节点可以同时有自己的 `words.json` + 子文件夹
- "我的词库"下拉渲染为级联菜单

### 引导机制

首次启动时在 `user-banks/` 下自动生成一个 `示例词库/` 文件夹，内含 `words.json` 模板

### 入口

"我的词库"下拉底部增加"📂 打开词库文件夹"按钮，调用系统资源管理器

---

## 六、决策记录

| # | 问题 | 决策 | 日期 |
|---|------|------|------|
| 1 | Zustand vs 保守方案 | ✅ 方案 A（Zustand Slices Pattern） | 2026-05-31 |
| 2 | 先修 Bug 还是直接重构 | ✅ 路线 β（直接重构） | 2026-05-31 |
| 3 | 自定义词库设计 | ✅ 文件夹层级方案（方案 A），详见第五章 | 2026-05-31 |
| 4 | 旧原型 vs Electron | ✅ Electron 唯一主版本 | 2026-05-31 |

---

## 七、风险清单

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 重构期间破坏现有功能 | 高 | 先写单元测试覆盖 computeDisplay/buildSpellDiff 等纯函数 |
| localStorage 数据迁移失败 | 中 | 新架构可读旧 key，平滑迁移 |
| Zustand 学习成本 | 低 | API 极简，5 分钟可上手 |
| wordbanks-enriched.json (5MB) 加载性能 | 中 | 考虑按需懒加载单个词库，而非一次性加载全部 |

---

> **下一阶段**：L3-2 提案（Proposal），在方案 A/B 基础上细化实现路径和验收标准。
