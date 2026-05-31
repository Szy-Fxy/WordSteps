# 06-Review：WordSteps 架构重构集成审核

> 日期：2026-05-31
> 需求级别：L3
> 阶段：L3-6
> 状态：待审核

---

## 一、文档完整性

| 文档 | 状态 | 备注 |
|------|------|------|
| 00-MetaSpec | — | 不适用（非跨批次约束，单次重构无需元规格） |
| 01-brainstorm.md | ✅ | 问题清单完整，方案对比充分，用户决策已记录 |
| 02-proposal.md | ✅ | 选定方案明确，变更清单完整，验收标准 10 项 |
| 03-design.md | ✅ | 4 个 Slice 完整 TS 接口，IPC 映射表，CSS 变量体系，SpellArea 新布局 |
| 04-spec.md | ✅ | 13 个 FR，每个覆盖正常路径 + 边界 + 错误处理 |
| 05-tasks.md | ✅ | 32 项任务，按依赖排序，标注可并行对 |

---

## 二、交叉检查

### 2.1 04-spec 场景 → 05-tasks 覆盖

| FR | 标题 | 覆盖任务 | 状态 |
|----|------|----------|------|
| FR-01 | Zustand Slices 状态管理 | 3.1~3.5, 9.1 | ✅ |
| FR-02 | Display 单一派生源 | 4.1, 6.1 | ✅ |
| FR-03 | 动画与业务解耦 | 3.1(uiSlice), 4.2, 6.1 | ✅ |
| FR-04 | 组件按需订阅 | 7.1~7.10, 6.1 | ✅ |
| FR-05 | 深色模式 CSS | 8.1 | ✅ |
| FR-06 | 拼写模式交互修正 | 7.2, 7.3, 7.10(ShortcutHints), 8.2 | ✅ |
| FR-07 | 窗口比例显式选择 | 5.2, 7.8 | ✅ |
| FR-08 | 自定义词库加载 | 2.2, 5.2, 7.4 | ✅ |
| FR-09 | IPC 类型安全 | 1.2, 1.3, 5.1 | ✅ |
| FR-10 | localStorage 迁移 | 2.1 | ✅ |
| FR-11 | 自动发音预加载 | 9.2(useAudio) | ✅ |
| FR-12 | 按钮禁用逻辑 | 7.3(NavBar), 7.2(SpellArea) | ✅ |
| FR-13 | 反馈文案修正 | 8.3 | ✅ |

**结论**：无遗漏。但 FR-11（音频预加载）的任务覆盖较弱，仅靠 `9.2 更新 useAudio.ts` 不够具体。需要在任务 9.2 中明确"移除 400ms setTimeout，改用 Audio 预加载 + requestAnimationFrame"。

### 2.2 03-design 接口 → 04-spec 场景满足度

| 04-spec 场景 | 03-design 对应接口 | 满足 |
|-------------|-------------------|------|
| FR-01 词库加载 | `wordbankSlice.loadBanks()` | ✅ |
| FR-02 display 派生 | `useDisplay()` → `computeDisplay()` | ✅ |
| FR-03 动画守卫 | `uiSlice.isAnimating` + `useAnimation.animateThen()` | ✅ |
| FR-04 按需订阅 | `useBoundStore(selector)` | ✅ |
| FR-05 深色 CSS | CSS 变量体系（`--bg-card`, `--text-primary`） | ✅ |
| FR-06 拼写死控件 | `SpellArea` 条件渲染 `mode === 'spell'` 隐藏按钮 | ✅ |
| FR-07 窗口比例 | `uiSlice.setRatio()` + `electron/main.ts` 显式选择 | ✅ |
| FR-08 自定义词库 | `wordbankLoader.loadAllWordbanks()` + `IPC bank:list-user` | ✅ |
| FR-09 IPC 类型安全 | `IPC_CHANNELS` 映射表 + `window.electronAPI.invoke<K>()` | ✅ |
| FR-10 迁移 | `storageService.migrateFromLocalStorage()` | ✅ |
| FR-11 音频预加载 | `useAudio` 内部 `new Audio(url).preload = 'auto'` | ⚠️ 设计中有描述但无函数签名 |
| FR-12 按钮禁用 | `NavBar` 条件 `mode === 'spell' && spellPhase === 'input'` | ✅ |
| FR-13 文案修正 | `buildFeedback` 函数内修改 | ✅ |

**发现**：FR-11 设计文档中仅用自然语言描述了预加载策略，缺少具体的函数接口定义。建议在 L3-7 执行时补齐 `useAudio` 的完整签名。

### 2.3 术语一致性

| 术语 | 01 | 02 | 03 | 04 | 05 | 一致？ |
|------|----|----|----|----|----|--------|
| Slices Pattern | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| wordbankSlice / sessionSlice / statsSlice / uiSlice | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| boundStore / useBoundStore | — | ✅ | ✅ | — | — | ✅ |
| computeDisplay | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| useDisplay | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| IPC_CHANNELS | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| electron-store | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| spellPhase | — | — | ✅ | ✅ | ✅ | ✅ |
| showBankNumber | — | — | ✅ | ✅ | ✅ | ✅ |

**结论**：术语一致，无冲突。

### 2.4 01-brainstorm 问题 → 04-spec 覆盖

| brainstorm 问题 | 04-spec 对应 FR | 覆盖？ |
|----------------|----------------|--------|
| Bug #1 深色模式 CSS | FR-05 | ✅ |
| Bug #2 释义点击单向 | 架构级根除（FR-02 display 单一源） | ✅ |
| Bug #3 窗口比例 | FR-07 | ✅ |
| Bug #5 拼写跳过时间 | FR-06 | ✅ |
| Bug #6 死控件 | FR-06 | ✅ |
| Bug #7 发音按钮布局 | FR-06 | ✅ |
| Bug #8 摸鱼隐藏恢复 | 不在本次范围（提案已标注） | ⚠️ |
| Bug #9 自动发音延迟 | FR-11 | ✅ |
| Bug #10 localStorage 丢失 | FR-10 | ✅ |
| Bug #11 工具栏布局 | FR-07 部分覆盖（CSS 变量体系），但无独立 FR | ⚠️ |
| Bug #12 拼写操作行 | FR-06 部分覆盖（8.2 SpellArea 布局） | ✅ |
| Bug #13 单词重复 | FR-02（复习词 10 窗口过期防御） | ✅ |
| #4 激励机制 | WS-002 独立需求 | 不适用 |
| 自定义词库缺失 | FR-08 | ✅ |
| 巨型 reducer | FR-01 | ✅ |

**发现两个未完全覆盖项**：
1. **Bug #8（摸鱼隐藏恢复）**：提案中标注为不在本次范围。但它在测试人员反馈中，建议在 L3-7 快速实现 `Ctrl+Alt+W` 全局快捷键（5 分钟即可），不扩大 scope。
2. **Bug #11（工具栏布局）**：CSS 变量体系可解决统一高度问题，但没有独立的"工具栏布局重设计"任务。建议在 8.2（SpellArea 布局）中附加高度统一调整，或在 L3-7 中顺手修。

---

## 三、风险检查

### 3.1 保留清单合理性

| 保留项 | 判断 |
|--------|------|
| `computeDisplay` 算法核心 | ✅ 合理，逻辑正确无需重写 |
| `buildSpellDiff` | ✅ 纯函数 |
| `buildFeedback` | ✅ 只改文案不改签名 |
| `useAudio` hook 架构 | ⚠️ 需增加预加载逻辑，接口可能要加 `preload(url)` 方法 |
| `CharacterFace` / `Toast` | ✅ 纯展示组件 |
| `ShortcutHints` | ✅ 只改显示条件 |
| `electron/main.ts` 窗口管理 | ⚠️ `will-resize` 逻辑需要修复，保留框架但改实现 |

### 3.2 遗漏的关键模块

| 遗漏项 | 风险 | 建议 |
|--------|------|------|
| `useAudio` 预加载的完整签名 | 中 | L3-7 执行时补齐函数签名到设计文档 |
| 工具栏 CSS 统一 | 低 | 8.2 任务中附加高度统一调整 |
| 修复后无单元测试覆盖 `computeDisplay` | 中 | L3-7 末尾加一项"为 computeDisplay / buildSpellDiff 写单元测试" |

---

## 四、任务依赖检查

### 4.1 依赖图验证

```
1.x → 2.x → 3.x → 4.x → 6.1 → 7.x → 9.x → 10.x
                   ↘
                     5.x ──────────→ 7.x
```

- 4.x 和 5.x 可并行 ✅
- 7.x 和 8.x 可并行 ✅
- 无循环依赖 ✅

### 4.2 缺失的前置任务

| 缺失任务 | 应在 | 原因 |
|----------|------|------|
| 安装 electron-store 的类型声明 | 1.1 之后 | `@types/electron-store` 或自带类型 |
| 创建 `src/types/index.ts`（聚合导出） | 1.x 组 | 方便 `import type { WordEntry, ... } from '@/types'` |

---

## 五、审核结论

### 审核项汇总

| 检查项 | 状态 | 备注 |
|--------|------|------|
| 文档完整性 | ✅ | 6 份文档全部齐全 |
| FR → Task 覆盖 | ✅ | 13 个 FR 全覆盖，1 个细节不足 |
| Design → Spec 满足 | ✅ | 12/13 完全满足，FR-11 缺函数签名 |
| 术语一致性 | ✅ | 核心术语 5 份文档一致 |
| Bug 覆盖 | ⚠️ | 2 项未完全覆盖（Bug #8, #11），可顺手修 |
| 保留清单 | ✅ | 合理，useAudio 需扩展 |
| 任务依赖 | ✅ | 无循环，可并行对正确 |
| 风险识别 | ✅ | 3 项遗漏，风险中等 |

### 审核结论

- [x] 全部通过，进入执行（阶段 7）

附带建议（不阻塞执行）：

1. **L3-7 执行时补充**：FR-11 的 `useAudio` 预加载函数签名
2. **顺手修 Bug #8**：在 `electron/main.ts` 加 `globalShortcut.register('Ctrl+Alt+W', ...)`（5 分钟）
3. **顺手修 Bug #11**：在 8.2 CSS 任务中统一工具栏按钮高度为 36px
4. **末尾加测试**：为 `computeDisplay` 和 `buildSpellDiff` 写单元测试

---

## 口语版：这个设计整体怎么样

**整体评价**：稳固。6 份文档质量均匀，没有前后矛盾或逻辑缺口。

**好在哪里**：

- 把 400 行 reducer 按领域拆成 4 个 slice，这不是拍脑袋分的。wordbank（词库数据）、session（当前学习状态）、stats（计数）、ui（主题/窗口/动画）各司其职，一个 slice 一个变化原因，符合 SOLID 的单一职责。
- display 从"两个地方各自算"变成"一个 hook 自动派生"，这是在数据流层面根治 Bug #13，不是打补丁。
- IPC 映射表的类型推导方案比简单的 `declare` 更进一步——如果拼错 channel 名，编译就报错，不会等到运行时才发现。
- 把"不在范围"的东西列得很清楚——正向激励是 WS-002、编辑器是 Phase 2。防止重构膨胀成"什么都想要"的重写。

**特别注意 3 个点**：

1. **音频预加载的设计目前只画了饼**。03-design 里说了思路，但没有函数签名。执行时得写具体：`preloadAudio(url)` 创建 Audio 并缓存，`playAudio(url)` 从缓存取或新建。不然改完还是 400ms setTimeout 的变体。
2. **复习队列 10 窗口过期是核心防御**。如果这个值设得太小（比如 5），用户可能漏掉应该复习的词；设得太大（比如 50），又回到原来的死循环风险。建议 L3-7 执行时加一个常量 `REVIEW_WINDOW = 10`，方便以后调。
3. **electron-store persist middleware 有坑**。Zustand 的 `persist` middleware 默认用 `JSON.stringify` 全量序列化，但 `Set` 和 `Date` 不能直接序列化。`favorites` 是 `Set<string>`，需要自定义 `serialize`/`deserialize`。如果在执行时卡在这里，改用 `subscribe` 手动同步是最稳的（设计文档已提了备用方案）。

**总结**：可以直接开工。上述 3 个建议加 4 个顺手修的东西，不影响架构决策，执行时处理就行。
