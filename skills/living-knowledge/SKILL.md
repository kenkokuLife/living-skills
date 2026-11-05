---
name: living-knowledge
description: 在接入 Living 的工程项目中，调查源码、需求、实验与工程文档，渐进地构建有来源的工程知识（需求、实现策略、数据资源、能力、组件及其关系），保存到 `.living/knowledge/`，并用 Construction Run 记录每次调查的范围、Agent、模型、Skills 与代码版本；在用户要求时随工程记录一起 MCP 连携到 Living。适用于「调查并整理这个项目的需求 / 策略 / 数据」「梳理人物简介的实现链路」「修正这个关系」「把最近的项目工程知识 MCP 连携到 Living」。不一次性生成完整三层图，不把推断写成事实，不在没有来源时建立关系，不自动同步。
compatibility: 需要已连接的 Living MCP（project_get_context、project_get_record_contract part=knowledge、project_sync_records）与已初始化的 `.living/`（见 living-init）。Living 知识 Contract 1、同步协议 1。
metadata:
  version: "0.2.0"
  bundle: "living-skills"
  living-knowledge-contract: "1"
  living-record-contract: "1"
---

# Living Knowledge

## 用途与边界

Living 的「系统与能力」三层图（需求 → 实现策略 → 数据资源）是**有来源的结构化知识**的投影。本 Skill 规定 Agent 怎样在真实工程里逐步建立并修订这些知识。

- **有依据才成立。** 每个对象、每条关系都要能指回来源：代码位置 + Commit、文档、数据文件、测试输出、用户陈述。
- **渐进，不重建。** 每次只调查一个明确范围，例如「人物简介的实现链路」。不读全仓库，不在每次会话或同步时重新生成整张图。
- **三种依据不混用**（envelope 的 `basis` 字段）：
  - `verified_source`：自己读过所引的源码 / 文档 / 数据 / 测试输出；
  - `reported`：他人报告，例如用户描述、工程报告、截图，没有独立复核；
  - `inferred`：推断或假设，例如未来成本、候选方案、只看到部分代码时推测的关系。必须用 `provenance: "hypothetical"`。
- **状态分清楚。** 已实现 ≠ 已验证 ≠ 候选 ≠ 历史 ≠ 当前运行。找到代码不等于能力已验证。
- **用户决定。** Agent 不能把知识标为「用户已采纳」（`human_acceptance`），不能替用户批准决策或范围。
- **记录不改写知识。** 观察、问题、假设记录只能关联到知识对象。知识状态的改变必须是独立的、有来源的知识修订。
- **不自动同步。** 只在用户明确要求时连携。

## 输入与前提

- `.living/project.json` 已存在。没有就先用 living-init 初始化。
- 本地辅助命令 `living-records`：实际命令取自 `project_get_bootstrap` 返回的 `commands.records_cli`，在工程根目录执行。
- 正式 Schema 与规则：`project_get_record_contract`，传 `part: "knowledge"`。本 Skill 不复制 Schema。

## 知识对象与目录

| 对象 | 目录（`.living/knowledge/…`） | ID 前缀 | 要点 |
| --- | --- | --- | --- |
| 需求 Requirement | `requirements/` | `req-` | `requirement_kind`：`Task`（业务任务）或 `Constraint`（质量约束）；`status`：Supported / Partial / Exploring / NoPath / Unknown；`supported_scope`、`unverified_scope`、`unsupported_scope` 分开写。候选或未确认的需求用 `Exploring` 或 `Unknown` |
| 策略 Strategy | `strategies/` | `st-` | `implementation`：Implemented / Partial / Designing / Candidate / Retired / Unknown；`current_use`：Active / Inactive / Unknown。写 Active 必须同时写 `current_use_basis`，因为分支上的代码不等于线上部署 |
| 数据资源 Data Resource | `data-resources/` | `dr-` | `resource_role`：RuntimeKnowledge / RuntimePrompt / Evaluation / DevelopmentArtifact / Unverified；`role_usage` 记录同一资源的不同用途；评测数据不是运行时来源 |
| 关系 Alignment | `relations/` | `al-` | `realized_by`（需求 → 策略）、`uses`（策略 → 运行时数据）、`needs`（缺少的数据）、`validated_by`（→ 评测资源）。每条关系有自己的 `source_refs`；停止使用的关系改为 `Superseded`，不删除 |
| 能力 Capability | `capabilities/` | `cap-` | 能力边界；需求用 `capability_ids` 指向它。`verified_on` 只能由测试或验证报告支持 |
| 组件 Architecture | `architecture/` | `arch-` | 技术组件，不混入数据资源；策略用 `architecture_ids` 指向它 |
| 知识决策 Decision | `decisions/` | `kd-` | 当前采用的工程选择及其理由，是结构化状态；某次带用户批准的决策事件写成 decision **记录** |
| 待判断事项 | `open-questions/` | `oq-` | 无法确认、需要用户或实验回答的问题 |
| 构建 Run | `runs/` | `run-` | 一次调查的元数据（见下） |

每个文件是一个 envelope：

```json
{ "schema_version": 1, "kind": "requirements", "project_id": "<.living/project.json>", "run_id": "run-…",
  "basis": "verified_source", "change_note": "（从第 2 版起必填）改了什么、依据什么",
  "object": { "schema_version": 1, "id": "req-…", "revision": 1, "title": "…", "summary": "…", "provenance": "recorded",
              "evidence_ids": [], "basis": "一句话：依据什么", "source_refs": [{ "kind": "code", "repo": "<owner/repo>", "ref": "<branch>@<commit>", "path": "src/…", "lines": "120-180", "note": "看到了什么", "checked_at": "YYYY-MM-DD" }], "…": "按 kind 的字段" } }
```

`source_refs[].kind` 取值：`code` / `document` / `report` / `commit` / `data`。`object.basis` 是给人看的一句依据说明，所有对象都要写。

## 知识构建流程

1. **确定目标与范围。** 和用户确认这次调查什么，例如「人物简介从问题到回答的链路」，以及不调查什么。
2. **开始 Run。** 运行 `living-records run start <slug> --goal "<目标>" --include <路径,…> --exclude <…>`。
   - CLI 自动记录 Git Commit、工作树是否有未提交修改、已安装的 Skills，以及能从运行环境识别的 Agent。
   - **模型身份**：只有用户在对话中明确说了模型，才加 `--model <id> --model-provider <provider>`，记为 `user_declared`。不要根据自己的认知填写模型；不知道就保持 `unknown`。
3. **读最小必要资料。** 从入口（README、路由、主流程函数）顺着调用链读。只读与目标相关的文件，读过的写进 run 的 `sources_consulted`。
4. **先查已有知识，再识别对象。** 调用 `project_get_context` 看 `knowledge.<kind>`，再看本地 `.living/knowledge/`。
   - 已有同义对象：修订它（`revision + 1`，更新 `run_id` 与 `change_note`），不要新建近似对象。
   - 确实是新对象：用 `living-records knowledge new <kind> <slug> --title … --run <run-id>` 生成骨架，然后填写。
5. **区分实现、候选与未知。**
   - 代码里真实存在并被调用的，才写 `Implemented`。
   - 文档中的设计目标写 `Designing` 或 `Candidate`。
   - 历史实现写 `Retired`，并用 `superseded_by` 指向替代者。
   - 运行状态不确定时，`current_use` 写 `Unknown`。
6. **建立有依据的关系。** 每条关系是一个 `al-` 对象，`source_refs` 指向证明这条关系的位置，例如调用点、数据加载代码。只凭相似名称或时间先后，不建关系。缺数据用 `needs`；评测集用 `validated_by`，不用 `uses`。
7. **写清未知。** 不能确认的内容写进对象的 `unverified_scope` 和 `key_gaps`，以及 run 的 `unresolved`，必要时建 `oq-` 待判断事项。宁可留空，也不猜。
8. **结束 Run。** 运行 `living-records run finish <run-id>`，自动填写新建、修订的对象和关系。如果做过检查，例如跑了测试，在 run 的 `verification` 中写方法与结果。
9. **检查本地状态并汇报，等待用户触发连携。** 运行 `living-records status`，修正 `invalid` 和 `needs_revision_bump`。然后告诉用户：建立或修订了哪些对象、依据类型、未确认的内容。不要自动同步。

## 跨会话修订

- 新会话先读 `project_get_context` 的 `knowledge` 与 `construction_runs`，以及本地 `.living/knowledge/`。
- 修正对象或关系时，开一个新 Run，在原文件上改：`revision + 1`，`run_id` 改为新 Run，`change_note` 写明修正依据。Living 保留旧版本以及产生它的 Run。
- 关系不再成立：`status: "Superseded"`，写 `superseded_by` 或 `limitation`，不要删除文件。
- 用户或独立审计指出的错误：修订对象，并在对应 Run 的 `corrections[]` 里追加一条（`by: "user"` 或 `"independent_audit"`）。改动已同步的 run 时要 `revision + 1`。

## 常见错误（必须避免）

- 把 README 里的设计目标写成当前实现。
- 把历史实现写成当前运行状态，或者把当前分支等同于线上部署。
- 把测试集或评测数据写成运行时知识依赖（`uses`）。
- 把模型生成的解释写成已验证事实。
- 把文件存在当成运行时使用，或者把有引用当成语义正确。
- 因为「120 回可能需要新策略」这类假设，就把当前策略标成 Retired。正确的做法是写 hypothesis 记录，或者建一个 `inferred` 的候选策略。

## 同步（仅在用户明确要求时）

用户说「把最近的项目工程知识 MCP 连携到 Living」或「把最近的工程记录 MCP 连携到 Living」时，按 living-records 的同步步骤执行。`bundle` 会把新增或修改的知识对象、Run 和工程记录放进同一批，一次用户授权即可。

Living 做的事：
- 校验 Schema、来源规则和引用完整性。
- 整批原子写入：有任何错误就什么都不写，按回执修正后重试。
- 保存历史，更新三层图。

## 输出

- `.living/knowledge/` 中新增或修订的对象，以及本次调查的 `runs/run-….json`。
- 给用户的简短说明：建立 / 修订了什么，依据类型，刻意没有断言什么，哪些仍未知。

## 兼容策略

- 属于 `living-skills` 0.2.0，要求 Living 知识 Contract 1、记录 Contract 1、同步协议 1。
- 字段、ID 规则与 JSON Schema 以 `project_get_record_contract`（`part: "knowledge"`）为准。
