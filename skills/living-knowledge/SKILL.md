---
name: living-knowledge
description: 在接入 Living 的工程项目中，调查源码、需求、实验与工程文档，渐进地构建有来源的工程知识（需求、实现策略、数据资源、能力、组件及其关系），先判断用户需求、主要匹配策略、领域数据与技术机制的工程角色，再建立关系并写清能力边界，保存到 `.living/knowledge/`，并用 Construction Run 记录每次调查的范围、Agent、模型、Skills 与代码版本；在用户要求时随工程记录一起 MCP 连携到 Living。适用于「调查并整理这个项目的需求 / 策略 / 数据」「梳理人物简介的实现链路」「修正这个关系」「把最近的项目工程知识 MCP 连携到 Living」。不一次性生成完整三层图，不把调用链上出现的每个机制都连到需求上，不把推断写成事实，不在没有来源时建立关系，不自动同步。
compatibility: 需要已连接的 Living MCP（project_get_context、project_get_record_contract part=knowledge、project_sync_records）与已初始化的 `.living/`（见 living-init）。Living 知识 Contract 2、同步协议 1。
metadata:
  version: "0.2.1"
  bundle: "living-skills"
  living-knowledge-contract: "2"
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
- **状态分清楚。** 已实现 ≠ 已验证 ≠ 候选 ≠ 历史 ≠ 当前运行。找到代码不等于能力已验证，数据可用也不等于能力已验证。
- **先定角色，再连线。** 目标不是追踪调用链并生成节点，而是说明：用户要完成什么、哪条方案直接完成它、它读取哪些领域数据、哪些只是支撑机制或横向控制、能力边界在哪里。
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
| 策略 Strategy | `strategies/` | `st-` | `strategy_role`：Primary / Supporting / CrossCutting / Unknown，并写 `role_basis`（见「识别顺序」）；`implementation`：Implemented / Partial / Designing / Candidate / Retired / Unknown；`current_use`：Active / Inactive / Unknown。写 Active 必须同时写 `current_use_basis`，因为分支上的代码不等于线上部署 |
| 数据资源 Data Resource | `data-resources/` | `dr-` | `resource_role`：RuntimeKnowledge（领域数据与派生知识）/ RuntimePrompt（Prompt、模板、运行配置）/ Evaluation / DevelopmentArtifact / Unverified；`resource_type` 区分原文 Text、结构化 Structured、派生 Derived；`coverage` 写覆盖范围；`role_usage` 记录同一资源的不同用途。数据库、索引、服务是组件，不是数据资源 |
| 关系 Alignment | `relations/` | `al-` | `realized_by`（需求 → 策略）、`uses`（策略 → 数据）、`needs`（缺少的数据）、`validated_by`（→ 评测资源）。`realized_by` 与 `uses` 必须写 `relation_role`：primary / supporting / control。每条关系有自己的 `source_refs`；停止使用的关系改为 `Superseded`，不删除 |
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

## 识别顺序（先判断角色，再建立关系）

按下面的顺序判断。每一步都依据项目自己的语义（产品说明、入口、调用方式、数据实际用途），**不使用固定的名称黑名单**：同样叫「检查」的步骤，在一个项目里可能是主要方案，在另一个项目里只是横向控制。

### 1. 需求：用户真正要完成什么

- `Task`：用户希望完成的任务，要有自己的来源（产品文档、界面入口、README 目标、用户陈述）。
- `Constraint`：适用于任务的运行、质量或预算约束（例如「回答只依据检索到的资料」「每次最多一次模型调用」），用 `applies_to` 指向它约束的任务。
- **当前实现细节不是需求。** 不要因为代码里有某个模块、某个开关、某个函数，就推导出一个新的正式用户需求。
- 需求范围要有来源；来源不足时 `status: Unknown` 或 `Exploring`，并写进 `unverified_scope`。

### 2. 主要匹配策略：谁直接把需求变成处理流程

| `strategy_role` | 判断问题 | 默认显示 |
| --- | --- | --- |
| `Primary` | 去掉它，这项需求的答案就无法按当前方式产生吗？它是否直接决定「读什么、怎么组织、怎么生成」？ | 三层主图 |
| `Supporting` | 它是主要方案内部的步骤、组件访问、存储读取、格式解析或配置装载吗？对需求真实必要，但本身不是「解决这项需求的方案」？ | 详情 |
| `CrossCutting` | 它是否同样作用于多项需求，处理的是准入、配额、并发、安全、预算、监控？ | 详情 |
| `Unknown` | 读过来源仍无法判断 | 主图（标明未确定） |

- 每个角色都写 `role_basis`：一两句依据，例如「对所有提问生效，与问题类型无关」「只在主要检索内部调用，负责按 ID 读取」。
- **出现在调用链上，不等于是主要策略。** 先问它解决的是哪项需求；横向门禁不是某一项需求独有的主要策略。
- **被多项需求共用，不等于是支撑机制或横向控制。** 同一套检索或生成方案同时服务几项需求时，它对每一项仍可以是 Primary；判断依据是它是否直接决定「读什么、怎么组织、怎么生成」，而不是它是否专属于一项需求。CrossCutting 只用于准入、配额、安全、预算、监控这类与回答内容无关的控制。
- 检索与生成是两个可分别替换的方案时，分别建策略并各自标 Primary；不要把检索并入生成后再把检索单独标成 Supporting。
- 支撑机制和横向控制是有用的工程知识，照样建对象、写来源，只是关系角色不同。也可以只写进主要策略的 `steps` 与 `architecture_ids`，不必为每个内部步骤单独建策略。

### 3. 数据资源：它在执行时实际提供什么

依次判断：提供业务事实吗？是派生知识吗？只提供处理指令吗？只用于评测吗？是技术设施吗？真的在当前执行链路中被读取吗？

| 实际用途 | 写法 |
| --- | --- |
| 原文、业务事实、领域记录 | `resource_role: RuntimeKnowledge`，`resource_type: Text` / `Structured` |
| 由原始数据生成的摘要、画像、抽取结果 | `resource_role: RuntimeKnowledge`，`resource_type: Derived`，`quality_gaps` 写清派生方式是否核实 |
| Prompt、模板、规则表、运行配置 | `resource_role: RuntimePrompt`（运行配置，不是领域事实） |
| 测试集、评测集、验收题 | `resource_role: Evaluation`，只用 `validated_by` 关联 |
| 实验记录、研究资料 | `resource_role: DevelopmentArtifact` |
| 还不存在、计划中的数据 | `availability: Missing`，用 `needs` 关联；或 `inferred` 的候选 |
| 数据库、检索引擎、缓存、消息队列 | **不是数据资源**，建 `architecture`（`layer: Data`），数据资源用 `architecture_ids` 指向它 |

同一个物理文件可能承担多个角色（例如既进入回答上下文，又用于引用核对）：按实际用法写进 `role_usage`，不要只凭文件名分类。

### 4. 最后建立关系

对每一条关系逐项写清：来源对象、目标对象、关系类型、`relation_role`、证据出处（调用点、加载代码）、当前状态。

| `relation_role` | 含义 | 例 |
| --- | --- | --- |
| `primary` | 目标直接实现这项需求（`realized_by` → Primary 策略），或是策略的领域内容输入（`uses` → RuntimeKnowledge） | 「订单状态查询」→「按订单号检索订单记录」；该检索 → 订单记录 |
| `supporting` | 真实依赖，但只支撑实现：内部步骤、查找表、配置、核验时读取的数据 | 检索 → 字段映射配置；生成 → Prompt；核验步骤 → 原文（只用于对照引用） |
| `control` | 请求路径上的横向控制（只用于 `realized_by`，目标是 CrossCutting 策略） | 「订单状态查询」→「公开接口限流与配额」 |

- **同一调用链 ≠ 直接业务实现关系。** 两个对象出现在同一条链上，只说明可能有依赖；关系类型由用途决定。
- 不确定是不是主要关系时，写 `supporting` 并在 `limitation` 说明，或建 `oq-` 待判断事项，不要默认 `primary`。
- Living 校验一致性：任务的 `primary` 必须指向 Primary 策略，`control` 必须指向 CrossCutting 策略，`primary` 的 `uses` 必须指向 RuntimeKnowledge。

### 主图与详情

三层主图默认只画「需求 → 主要匹配策略 → 运行时知识」的 primary 关系；支撑机制、横向控制和运行配置留在详情和「显示支撑机制」开关里。**不要为了让图简洁而删除真实的工程知识**，也不要为了让图完整而把每个机制都连到需求上。

## 能力边界

需求对象要分开写下面几项。不知道的保持未知，不推测。

| 字段 | 写什么 |
| --- | --- |
| `supported_scope` | 已确认的代码路径支持的范围（实现层面）。**不写「已验证」** |
| `verified_scope` | 真正检查过的范围：`[{scope, method, result, verified_on, source_refs}]`。来源必须是测试输出、评测报告或数据（`report` / `data`），只读代码、只看到测试文件都不算。没有就留空 |
| `unverified_scope` | 已实现或看起来可行但没有检查的部分 |
| `unsupported_scope` | 当前路径或数据做不到的 |
| `limiting_factors` | 现在边界为什么在这里（数据覆盖、模型、预算、身份识别 …），写 `certainty` |
| `expansion_risks` | 扩大范围时可能出现的问题，通常 `certainty: "inferred"`。假设不能把当前策略改成 Retired |
| 数据覆盖 | 写在各数据资源的 `coverage`；Living 会汇总主要路径数据的覆盖范围 |

候选研究方向写 `research_questions`（`provenance: "hypothetical"`）或 `Candidate` 策略，保持假设状态。

## 知识构建流程

1. **确定目标与范围。** 和用户确认这次调查什么，例如「人物简介从问题到回答的链路」，以及不调查什么。
2. **开始 Run。** 运行 `living-records run start <slug> --goal "<目标>" --include <路径,…> --exclude <…>`。
   - CLI 自动记录 Git Commit、工作树是否有未提交修改、已安装的 Skills，以及能从运行环境识别的 Agent。
   - **模型身份**：只有用户在对话中明确说了模型，才加 `--model <id> --model-provider <provider>`，记为 `user_declared`。不要根据自己的认知填写模型；不知道就保持 `unknown`。
3. **读最小必要资料。** 从入口（README、路由、主流程函数）顺着调用链读。只读与目标相关的文件，读过的写进 run 的 `sources_consulted`。
4. **先查已有知识，再识别对象。** 调用 `project_get_context` 看 `knowledge.<kind>`，再看本地 `.living/knowledge/`。
   - 已有同义对象：修订它（`revision + 1`，更新 `run_id` 与 `change_note`），不要新建近似对象。
   - 确实是新对象：用 `living-records knowledge new <kind> <slug> --title … --run <run-id>` 生成骨架，然后填写。
5. **按「识别顺序」判断角色。** 先需求，再主要策略，再数据，最后关系；每个策略写 `strategy_role` 与 `role_basis`，每条 `realized_by` / `uses` 写 `relation_role`。
6. **区分实现、候选与未知。**
   - 代码里真实存在并被调用的，才写 `Implemented`。
   - 文档中的设计目标写 `Designing` 或 `Candidate`。
   - 历史实现写 `Retired`，并用 `superseded_by` 指向替代者。
   - 运行状态不确定时，`current_use` 写 `Unknown`。
7. **建立有依据的关系。** 每条关系是一个 `al-` 对象，`source_refs` 指向证明这条关系的位置，例如调用点、数据加载代码。只凭相似名称、时间先后或「在同一调用链上」，不建主要关系。缺数据用 `needs`；评测集用 `validated_by`，不用 `uses`。
8. **写清能力边界与未知。** 按「能力边界」分开写已实现范围、已验证范围、未验证范围、限制与扩展风险。不能确认的内容写进 `unverified_scope`、`key_gaps` 和 run 的 `unresolved`，必要时建 `oq-` 待判断事项。宁可留空，也不猜。
9. **结束 Run。** 运行 `living-records run finish <run-id>`，自动填写新建、修订的对象和关系。如果做过检查，例如跑了测试，在 run 的 `verification` 中写方法与结果。
10. **检查本地状态并汇报，等待用户触发连携。** 运行 `living-records status`，修正 `invalid` 和 `needs_revision_bump`。然后告诉用户：建立或修订了哪些对象、依据类型、未确认的内容。不要自动同步。

## 跨会话修订

- 新会话先读 `project_get_context` 的 `knowledge` 与 `construction_runs`，以及本地 `.living/knowledge/`。
- 修正对象或关系时，开一个新 Run，在原文件上改：`revision + 1`，`run_id` 改为新 Run，`change_note` 写明修正依据。Living 保留旧版本以及产生它的 Run。
- 关系不再成立：`status: "Superseded"`，写 `superseded_by` 或 `limitation`，不要删除文件。
- 用户或独立审计指出的错误：修订对象，并在对应 Run 的 `corrections[]` 里追加一条（`by: "user"` 或 `"independent_audit"`）。改动已同步的 run 时要 `revision + 1`。
- **补充角色分类也是修订。** 旧对象没有 `strategy_role` / `relation_role` 时，读过它的来源后再分类：同一 ID、`revision + 1`、`change_note` 说明依据。不要因为分类变了就删除对象或改用新 ID；一条原先被当成主要实现的关系，改为 `supporting` 或 `control` 即可，仍然保留。

## 常见错误（必须避免）

- 把 README 里的设计目标写成当前实现。
- 把历史实现写成当前运行状态，或者把当前分支等同于线上部署。
- 把测试集或评测数据写成运行时知识依赖（`uses`）。
- 把模型生成的解释写成已验证事实。
- 把文件存在当成运行时使用，或者把有引用当成语义正确。
- 因为「120 回可能需要新策略」这类假设，就把当前策略标成 Retired。正确的做法是写 hypothesis 记录，或者建一个 `inferred` 的候选策略。
- 把调用链上出现的每个机制（准入、配额、数据库访问、格式解析、结果核验）都写成需求的主要实现策略。
- 把 Prompt、模板或运行配置写成领域数据，或用 `primary` 的 `uses` 连接它。
- 把数据库、检索引擎当成数据资源；它们是组件。
- 只凭名称分类：例如名字里有「检查」就当横向控制，名字里有「数据」就当运行时知识。
- 把「数据可用」「代码存在」「测试文件存在」写成 `verified_scope`。
- 从代码模块推导出新的正式用户需求。

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

- 属于 `living-skills` 0.2.1，要求 Living 知识 Contract 2（Living 0.1.3 起）、记录 Contract 1、同步协议 1。知识 Contract 2 只增加可选字段（`strategy_role`、`role_basis`、`relation_role`、`verified_scope`、`expansion_risks`）与一致性规则；Contract 1 写的旧知识仍然有效，显示为「角色未分类」。
- 字段、ID 规则与 JSON Schema 以 `project_get_record_contract`（`part: "knowledge"`）为准。
