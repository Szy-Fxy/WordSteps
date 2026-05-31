AI 请按 Aegis/skills/dev-workflow/SKILL.md 加载规则。

## Aegis 强制启动检查

每次对话开始必须执行：
1. 读取 `Aegis/rules/DevLogs/` 下最新 DevLog，恢复上次进度
2. 读取 `specs/INDEX.md`，确认当前是否有 🔨 implementing 的需求
3. 告知用户当前进度（哪个需求的哪个阶段）

## 每次涉及需求时必须执行
- 新需求 → 登记 `specs/INDEX.md`
- 完成需求阶段 → 更新 INDEX.md 状态
- L3 完成全部 7 阶段后 → 执行收尾仪式（写 DevLog + 5 维审视 + 经验沉淀）
