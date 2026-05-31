# 04-Spec：WordSteps 架构重构需求规格

> 日期：2026-05-31
> 需求级别：L3
> 阶段：L3-4
> 状态：通过

---

## 背景 (Background)

WordSteps 当前处于原型阶段，所有状态挤在一个 400+ 行的 `useReducer` 中。测试人员反馈了 13 个 Bug，涉及显示冻结、深色模式对比度不足、拼写模式交互缺陷、窗口缩放失效等。根因是架构层面：display 被双写、动画与业务状态耦合、IPC 类型不安全、自定义词库缺失。

重构目标不是增加功能，而是把现有功能搬到可维护的架构上，同时根治架构层面的 Bug。

---

## 问题陈述 (Problem Statement)

1. 30+ 种 action 塞在一个 reducer 里，改任何行为都要读完整 400 行
2. `computeDisplay` 在 `animateThen` 和 `useEffect` 中各算一次，旧数据覆盖新数据导致单词切换卡死（Bug #13）
3. 全部组件挂在一个 Context 下，任何 state 变化都触发全量重渲染
4. 深色模式覆盖不全，`.modal-box` 文字与背景对比度不足（Bug #1）
5. 拼写模式"隐藏释义"按钮无效果已是死控件（Bug #6），跳过停留时间过短（Bug #5）
6. 用户无法添加自定义词库，旧原型已有的 `custom-w*` 数据无处导入
7. `(window as any).electronAPI` 散落 4 处，IPC channel 是裸字符串

---

## 目标 (Goals)

- 将 400 行 reducer 拆为 4 个 Zustand slice，每个 50-100 行
- display 由 `useDisplay` hook 单一派生，消除双写竞态
- 14 个组件各自通过 selector 按需订阅 store，消除无意义重渲染
- 深色模式下所有 UI 元素对比度 ≥ 4.5:1（WCAG AA）
- 自定义词库通过文件夹层级加载，用户建文件夹 + `words.json` 即可
- IPC 通过 `IPC_CHANNELS` 映射表实现完全类型安全，零 `any`
- `strict: true` 通过，`npm run build` 成功

---

## 非目标 (Non-Goals)

- 内置词库编辑器（WS-002 之后考虑）
- 正向激励机制改进（WS-002 独立需求）
- 多窗口同步
- IndexedDB 替代 wordbanks-enriched.json（文件直读性能够用）
- 离线音频包下载
- 旧原型同步维护（归档）

---

## 功能需求

### FR-01：Zustand Slices 状态管理

**需求**：将 `WordState.tsx` 的巨型 reducer 拆为 4 个 Zustand slice（wordbank / session / stats / ui），组合成一个 bound store。

#### 场景：词库加载
- **当** 应用启动 → **则** `wordbankSlice.loadBanks()` 并行加载内置词库和用户词库，`loading` 从 `true` 变为 `false`，`wordBanks` 不为 `null`

#### 场景：切换词库
- **当** 用户在 BankSelector 中选择另一个等级词库 → **则** `switchLib(key)` 更新 `allWords`、`words`，重置 `index` 为 0，`isSearching` 为 `false`

#### 场景：跨 slice 读取（复习队列访问词库）
- **当** `sessionSlice.markDontKnow()` 需要从 `wordbankSlice.allWords` 查找单词 → **则** 通过 `get().allWords` 读取，不产生循环依赖

#### 边界：词库加载失败
- **当** `fetch('./wordbanks-enriched.json')` 网络错误 → **则** `error` 设置为错误消息，`loading` 为 `false`，页面显示"加载失败"

---

### FR-02：Display 单一派生源

**需求**：`currentDisplay` 不再作为 store 中的独立字段，而是由 `useDisplay()` hook 从 `(reviewQueue, words, index, allWords)` 四元组派生。`animateThen` 及其它位置不再手动计算 display。

#### 场景：正常单词切换
- **当** 用户点击"下一个" → `nextWord()` 使 `index++` → **则** `useDisplay()` 自动返回 `words[index % words.length]` 对应的 `DisplayData`

#### 场景：复习词插入
- **当** 复习队列中存在 `insertAfter <= index` 且 `index - insertAfter < 10` 的词 → **则** `useDisplay()` 优先返回该复习词

#### 场景：复习词过期窗口（修复 Bug #13）
- **当** 复习队列中存在 `insertAfter <= index` 但 `index - insertAfter >= 10` 的词 → **则** 该复习词被视为过期，跳过，返回 `words[index % words.length]`

#### 场景：搜索过滤
- **当** 用户在搜索框中输入 "inter" → **则** `words` 更新为过滤结果，`index` 重置为 0，`useDisplay()` 返回 `words[0]`

#### 边界：words 数组为空
- **当** `words.length === 0`（搜索无结果） → **则** `useDisplay()` 返回 `null`，WordCard 显示"没有匹配的单词"

#### 边界：index 越界
- **当** `index` 递增后 `index % words.length` 正常回绕 → **则** 不会出现 undefined 或崩溃

---

### FR-03：动画与业务状态解耦

**需求**：`isAnimating`、`animDir` 归 `uiSlice` 管理。`useAnimation().animateThen()` 只调用传入的业务 fn，不再读取业务 state 或调用 `computeDisplay`。

#### 场景：点击"认识"触发动画
- **当** 用户点击"认识" → `animateThen('right', () => store.getState().markKnow())` → **则** `isAnimating` 变为 `true`，CSS class 为 `swipe-out swipe-right`，250ms 后执行 `markKnow()`，再 350ms 后 `isAnimating` 变为 `false`

#### 场景：动画期间拦截重复操作
- **当** `isAnimating === true` → **则** `animateThen()` 直接 return，不执行新动画

#### 边界：快速连击
- **当** 用户在 600ms 内连续点击 3 次"下一个" → **则** 只执行第一次，后两次被 `isAnimating` 守卫拦截

---

### FR-04：组件按需订阅

**需求**：14 个组件不再使用 `useWordState()` 获取全部 state，改用 `useBoundStore(selector)` 只订阅需要的字段。

#### 场景：WordCard 只订阅 display 相关字段
- **当** `WordCard` 渲染 → **则** 仅订阅 `reviewQueue, words, index, allWords, mode, favorites, settings` 的变化；`darkTheme` 或 `toastMsg` 变化不会触发 WordCard 重渲染

#### 场景：StatsBar 只订阅统计字段
- **当** 用户切换深色主题 → **则** StatsBar 不重渲染（未订阅 `darkTheme`）

---

### FR-05：深色模式 CSS 修复

**需求**：所有 UI 组件在深色模式下对比度 ≥ 4.5:1。重点修复 `.modal-box`、`.settings-box` 的背景和文字颜色。

#### 场景：深色模式下打开设置面板
- **当** `darkTheme === true` 时用户打开设置 → **则** `.settings-box` 背景为 `#1e1e36`，文字为 `#e4e4e4`，对比度 11.2:1

#### 场景：深色模式下确认弹窗
- **当** 切换词库触发确认弹窗 → **则** `.modal-box` 背景和文字颜色与设置面板一致

#### 场景：深色模式下按钮可辨
- **当** 深色模式下查看任意按钮 → **则** 按钮边框或背景色与周围元素有明显区分，无"隐形按钮"

---

### FR-06：拼写模式交互修正

**需求**：修复拼写模式下的 3 个交互缺陷。

#### 场景：死控件消除（修复 Bug #6）
- **当** `mode === 'spell'` → **则** "👁 隐藏释义"/"👁 显示释义"按钮不渲染

#### 场景：跳过停留时间延长（修复 Bug #5）
- **当** 用户点击"跳过"或查看答案 → **则** 正确答案显示至少 2000ms 后才自动跳到下一个词

#### 场景：自主控制学习节奏
- **当** 用户看到正确答案 → **则** 可点击任意位置或按 Enter 立即跳转，也可等待 2000ms 自动跳转

#### 场景：发音按钮位置（修复 Bug #7）
- **当** 拼写模式下单词释义可见 → **则** 发音按钮显示在释义文字右侧，而非独立上方的提示行

#### 场景：拼写模式下快捷键提示精简（修复 Bug #7）
- **当** `mode === 'spell'` → **则** ShortcutHints 不显示"← 不认识"和"→ 认识"（拼写模式下这些按键不可用）

---

### FR-07：窗口比例显式选择与缩放修复

**需求**：比例切换从循环切换改为显式下拉选择。修复 `will-resize` 的等比缩放逻辑。

#### 场景：显式比例选择
- **当** 用户点击 TitleBar 的比例按钮 → **则** 弹出下拉列表显示所有预设比例 + "自由"选项，当前比例高亮

#### 场景：选择预设比例
- **当** 用户选择"3:4" → **则** 窗口立刻按 3:4 调整大小，后续拖拽维持该比例

#### 场景：选择"自由"
- **当** 用户选择"自由" → **则** 窗口拖拽不再强制等比，可任意拉伸

#### 场景：窗口拖拽等比缩放（修复 Bug #3）
- **当** 非自由模式下拖拽窗口边缘 → **则** 窗口按当前比例等比缩放，不出现比例跳变

#### 边界：最小尺寸
- **当** 窗口缩小到 `minWidth` 或 `minHeight` → **则** 不再缩小，保持该尺寸

---

### FR-08：自定义词库文件夹加载

**需求**：用户可在 `%APPDATA%/WordSteps/user-banks/` 下创建文件夹层级，每个叶子文件夹放 `words.json`，应用启动时自动扫描并合并到词库列表。

#### 场景：单层文件夹
- **当** `user-banks/编程词汇/` 下仅有 `words.json` → **则** "我的词库"菜单中出现一项"编程词汇"

#### 场景：多层文件夹（父子级联）
- **当** `user-banks/` 下结构为：
  ```
  E-W001-编程词汇/
    Day1-基础名词/words.json
    Day2-基础动词/words.json
  ```
  → **则** 菜单渲染为：
  ```
  我的词库 ▾
  ├── 📁 E-W001-编程词汇 (10词)
  │   ├── Day1-基础名词 (5词)
  │   └── Day2-基础动词 (5词)
  ```

#### 场景：父级选中则学全部后代单词
- **当** 用户选择"E-W001-编程词汇" → **则** `allWords` 包含 Day1 5 词 + Day2 5 词 = 10 词

#### 场景：子级选中只学该子级
- **当** 用户选择"Day1-基础名词" → **则** `allWords` 仅包含 Day1 的 5 词

#### 场景：编号前缀显示控制
- **当** `showBankNumber === true` → **则** 菜单显示"E-W001 编程词汇"；`showBankNumber === false` → **则** 菜单显示"编程词汇"

#### 场景：打开词库文件夹
- **当** 用户点击"📂 打开词库文件夹" → **则** 系统资源管理器打开 `%APPDATA%/WordSteps/user-banks/`

#### 场景：首次使用引导
- **当** `user-banks/` 目录为空且非 Electron 环境（开发模式） → **则** 自动创建 `示例词库/words.json` 模板文件

#### 边界：words.json 格式错误
- **当** 某 `words.json` JSON 解析失败 → **则** 该文件夹被跳过，不影响其他词库加载，toast 提示"N 个词库加载失败"

#### 边界：空文件夹
- **当** 某文件夹下既无 `words.json` 也无子文件夹 → **则** 该文件夹不在菜单中出现

#### 边界：words.json 中单词格式缺失
- **当** 某单词缺少必填字段 `s`（拼写）或 `p`（释义） → **则** 该单词被跳过，不中断加载

---

### FR-09：IPC 类型安全

**需求**：所有 IPC 通信通过 `IPC_CHANNELS` 映射表进行类型推导，消除 `as any`。

#### 场景：渲染进程调用主进程
- **当** 渲染进程需要最小化窗口 → **则** 调用 `window.electronAPI.invoke('window:minimize', undefined)`，编译期检查 channel 名拼写和参数类型

#### 场景：channel 名拼写错误编译失败
- **当** 代码中写 `window.electronAPI.invoke('window:minimise', ...)` → **则** TypeScript 编译报错

#### 场景：参数类型错误编译失败
- **当** `window:set-ratio` 要求 `{ idx: number }` 但传了 `string` → **则** TypeScript 编译报错

#### 边界：preload 未注入
- **当** 在非 Electron 环境（浏览器开发模式）中运行 → **则** `window.electronAPI` 为 `undefined`，调用方需要 `?.` 安全访问

---

### FR-10：localStorage → electron-store 迁移

**需求**：应用启动时自动检测 localStorage 中是否有旧数据，如有则迁移到 electron-store 并清除旧 key。

#### 场景：首次迁移
- **当** 旧版本用户升级到新版本，localStorage 中存在 `wordsteps_mastered` 等 7 个 key → **则** 启动时自动将数据写入 electron-store，清除 localStorage 旧 key

#### 场景：已完成迁移
- **当** localStorage 中无旧 key → **则** 直接从 electron-store 加载，不执行迁移

#### 场景：迁移后数据一致
- **当** 迁移完成 → **则** 用户看到的学习进度（已掌握单词数、收藏列表、连续打卡天数）与升级前完全一致

#### 边界：electron-store 写入失败
- **当** 文件系统权限不足 → **则** toast 提示"数据保存失败，请检查磁盘空间和权限"，不丢失内存中的数据

---

### FR-11：自动发音预加载

**需求**：取消 400ms 固定延迟，改为 Audio 预加载策略。

#### 场景：单词切换后自动发音
- **当** `useDisplay()` 返回新 display 且 `settings.autoAudio === true` → **则** 立即创建 `new Audio(url)`，设置 `preload = 'auto'`，在 `requestAnimationFrame` 回调中调用 `play()`

#### 场景：快速切词
- **当** 用户在音频加载完成前切换到下一个单词 → **则** 取消上一个 Audio 的加载（`audio.src = ''`），加载新单词音频

#### 边界：音频加载失败
- **当** `audio.onerror` 触发 → **则** 静默失败，不阻塞 UI，不影响单词切换

---

### FR-12：按钮禁用逻辑修正

**需求**：按钮禁用状态反映真实的可用性（修复 Bug #1 中的禁用逻辑问题）。

#### 场景：拼写模式下的导航按钮
- **当** `mode === 'spell'` 且 `spellPhase === 'input'` → **则** "← 不认识"和"→ 认识"禁用；"↓ 下一个"可用
- **当** `mode === 'spell'` 且 `spellPhase === 'submitted'` → **则** "↓ 下一个"变为"→ 下一个词"，所有三个按钮都可用

#### 场景：浏览/回忆模式下的导航按钮
- **当** `mode !== 'spell'` → **则** 三个按钮始终可用（动画期间通过 `isAnimating` 守卫）

#### 场景：动画期间键盘拦截
- **当** `isAnimating === true` → **则** 键盘快捷键被拦截，但不影响按钮的视觉禁用状态

---

### FR-13：反馈文案修正

**需求**：修正 `buildFeedback` 中语义错误的文案（不改变激励体系本身）。

#### 场景：连续正确
- **当** `currentStreak >= 5` → **则** 反馈："🔥 连续 5 次正确，状态不错！"（而非"这个词稳了"）
- **当** `currentStreak === 3 或 4` → **则** 反馈："😎 连续 N 次正确，渐入佳境！"
- **当** `currentStreak === 1 或 2` → **则** 反馈："🎯 答对了！"

#### 场景：答错
- **当** `charState === 'thinking'` → **则** 反馈："💪 没关系，多见几次就记住了。"

---

## 验收标准

| # | 标准 | 验证方式 |
|---|------|----------|
| AC-01 | 4 个 slice 文件各自不超过 150 行 | `wc -l src/store/*Slice.ts` |
| AC-02 | `computeDisplay` 在项目中被调用次数 ≤ 1（仅 `useDisplay.ts` 内） | `grep -r "computeDisplay" src/` |
| AC-03 | "认识"/"不认识"/"下一个"连续点击 50 轮单词不重复卡死 | 手动测试 |
| AC-04 | 深色模式下 `.modal-box` 对比度 ≥ 4.5:1 | Chrome DevTools → Accessibility |
| AC-05 | 拼写模式下"隐藏释义"按钮不渲染 | DOM 检查 |
| AC-06 | 拼写跳过后正确答案显示 ≥ 2000ms | 手动计时 |
| AC-07 | 比例选择为下拉而非循环，包含"自由"选项 | UI 检查 |
| AC-08 | `user-banks/` 下新建 `测试词库/words.json` 后刷新应用即出现在菜单 | 手动测试 |
| AC-09 | 父子菜单正确：选父级后 `allWords.length === 各子级单词数之和` | 控制台检查 |
| AC-10 | `window.electronAPI.invoke()` 的参数类型编译期验证 | `npm run typecheck` 通过 |
| AC-11 | localStorage 旧数据迁移后学习进度不变 | 迁移前后截图对比 |
| AC-12 | `npm run build` 成功 | CI |
| AC-13 | `tsc --noEmit` 零错误，含 `strict: true` | `npm run typecheck` |
| AC-14 | 音频预加载后发音延迟 < 200ms（非网络延迟） | 手动测试 |

---

## 风险与备注

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Zustand persist middleware 与 electron-store 集成有坑 | 中 | 先用 subscribe 手动同步，不依赖 persist middleware |
| 用户旧数据迁移失败导致进度丢失 | 高 | 迁移前先备份 localStorage 数据到临时变量，迁移失败则回滚 |
| Slice 跨依赖导致循环引用 | 中 | 严格遵守单向依赖：uiSlice 不依赖其他 slice，sessionSlice 通过 `get()` 读 wordbankSlice |
| 大量文件重命名导致 git diff 不可读 | 低 | 第一次重构用 `git mv` 保留历史，后续再调整 |
| 打包后 wordbanks-enriched.json 路径变化 | 中 | 使用 Vite 的 `public/` 目录，Electron 构建后路径与开发环境一致 |

---

> **下一阶段**：L3-5 任务清单（`05-tasks.md`），按依赖排序拆分为可独立执行的任务项。
