---
name: living-records
description: 在接入了 Living 的工程项目中，把正常开发过程里值得长期保留的工程认知（测试观察、验证、工程问题、设计决策、研究假设、完成的成果）写成 `.living/records/` 中的结构化记录，并在用户明确要求时增量同步到 Living。适用于「把这次测试记下来」「记录这个问题 / 假设」「把最近的工程记录 MCP 连携到 Living」。不用于每句话都生成记录、不自动同步、不生成完整三层图、不替用户做决定。
compatibility: 需要已连接的 Living MCP（project_get_context、project_get_record_contract、project_validate_records、project_sync_records）与已初始化的 `.living/`（见 living-init）。
metadata:
  version: "0.2.0"
  bundle: "living-skills"
  living-record-contract: "1"
  living-knowledge-contract: "1"
  living-sync-protocol: "1"
---

# Living Records

## 用途与边界

让工程认知跨会话积累：记录在工程项目自己的 `.living/` 中持续存在，同步时只提交增量。Living 不要求每次连携前重新整理项目历史。

- **记录事实，不升级结论。** 观察 ≠ 验证通过；研究假设 ≠ 决策；Agent 判断 ≠ 用户批准。
- **未知保持未知。** 不知道的日期、版本、原因、关联就不写，不用写记录的时间代替发生时间。
- **不编造关系。** 只关联到 `project_get_context.link_targets` 中真实存在的对象或已有记录；证据不足时留空（Living 显示为“待关联”）。
- **不自动同步。** 只有用户在当前对话中明确要求时才调用 `project_sync_records`（`user_requested: true`）。
- **不写凭证。** `.living/` 不保存 MCP 凭证、API Key、令牌或 `.env` 内容；Living 与 `living-records` 都会拒绝看起来像凭证的内容。
- 不修改项目原有 `AGENTS.md` / `CLAUDE.md`，除非用户同意（可以建议加入下方的“项目约定片段”）。

## 输入与前提

- 工程项目已由 Living 创建并取得 Project ID（`prj_…`，或演示项目 `demo_…`）。**Project ID 由 Living 生成，Agent 不得自行生成。**
- 可用的 Living MCP 工具：`project_get_context`、`project_get_record_contract`、`project_validate_records`、`project_sync_records`。
- 本地辅助命令 `living-records`：实际命令取自 `project_get_bootstrap` 返回的 `commands.records_cli`（Living 本机安装路径因机器而异，本 Skill 不写死）。在工程根目录执行，或加 `--dir <工程目录>`。

## 初始化（每个工程项目一次）

由 `living-init` 完成（「初始化当前项目的 Living」）。写第一条记录前：

1. `project_get_context(project_id)` 确认项目存在，并取得可关联的对象（`link_targets`）。
2. `project_get_record_contract` 读取字段规则与 JSON Schema。

## 什么时候写记录

只有出现值得跨会话保留的工程认知时才写：

| 情况 | 记录类型 | 要点 |
| --- | --- | --- |
| 跑了一次测试 / 实际使用，看到了结果 | `observation` | `facts` 只写看到的；判断写进 `interpretations` 并注明 `by`；`verification_state` 只能是 `unverified` / `partially_verified`；写出 `unverified_aspects` 与 `generalization_limits` |
| 按明确标准做了检查 | `verification` | `method`、`criteria`、`scope`、`result`；`pass` / `fail` / `partial` 必须有 `inspected` 的证据 |
| 发现明确问题 | `issue` | `area`；`indicates_capability_failure` 说清这是否反映能力本身（前端呈现问题通常为 `false`） |
| 形成新的研究方向 | `hypothesis` | `statement`、`proposed_by`、`validation_plan`；`possible_implications` 是条件性的，不是计划 |
| 明确采用 / 否决方案 | `decision` | Agent 只能记 `proposed`；`accepted` / `rejected` 需要 `approval.by = "user"` 和一条 `user_statement` 证据 |
| 完成一项工作并有实际结果 | `outcome` | `actual_result`、`result_status`；不知道发生日期就不写 `occurred_on` |

一次活动可以产生多条记录，让事实、判断和假设各自可追踪。不为每句话建记录。

## 怎样写

- 文件：`.living/records/<类型目录>/<id>.json`，`id` 形如 `obs-2026-11-05-login-timeout`（前缀 `obs/ver/out/iss/dec/hyp`），永不改变、永不复用。可用 `living-records new <type> <slug> --title …` 生成骨架。
- `project_id` 从 `.living/project.json` 复制。
- `source.recorded_by` 是写记录的人（通常 `agent`）；`source.kind` 说明来源（`agent_session` / `user_report` / `test_run` …）。用户口述的结果写 `user_report`，并附 `user_statement` 证据。
- **证据**：`access` 说明内容能否获取（`inline` 摘录 / `attached` 附件 / `project_local` / `external` / `unavailable`）；`inspected` 说明引用者是否真的检查过（引用 ≠ 检查）。附件放在 `.living/evidence/`，用 `local_file` 引用，同步时由 `living-records bundle` 随请求提交（Living 不读取你机器上的路径）。
- **关联**：`links[].target` 是需求 / 策略 / 数据资源 / 决策 / 待判断事项的 ID，或另一条记录的 ID；`relation` 用 `observes`、`verifies`（仅 verification）、`affects`、`concerns`、`supports`、`challenges`、`derived_from`、`supersedes`（同类型）、`relates_to`。拿不准就不连。

## 更新已有记录

- 改内容时 `revision + 1` 并更新 `updated_at`；不改 `id`、`type`、`project_id`、`created_at`。
- Living 保留每个已同步的版本。若旧结论在当时成立、现在被新事实修正，优先新建一条记录并用 `supersedes` / `derived_from` 关联，而不是改写旧观察。

## 同步（仅在用户明确要求时）

用户说「把最近的工程记录 MCP 连携到 Living」或「把最近的项目工程知识 MCP 连携到 Living」时，两者走同一个流程：一次授权覆盖所有待同步的记录、知识对象（`.living/knowledge/`）和构建 Run，不需要逐项确认。

1. `living-records status` —— 依据 ID + revision + 内容哈希与上次回执比对（不看文件修改时间），分别列出记录、知识与 Run 的 new / changed / needs_revision_bump / invalid。先修正本地错误。
2. `living-records bundle --out /tmp/living-payload.json` —— 只打包新增与修改的条目（records、knowledge、construction_runs），附件内联，生成确定的 `idempotency_key`。
3. （可选）`project_validate_records` 预检，参数与 payload 相同。
4. `project_sync_records`，参数取自 payload（`records`、`knowledge`、`construction_runs`、`attachments`、`idempotency_key`），并传 `user_requested: true`。
5. 把返回的回执保存为文件，运行 `living-records apply-receipt --file <回执>`：
   - `committed` / `no_changes`：更新 `.living/sync/state.json`；
   - `rejected`：整批未写入，本地状态不变；按 `items[].errors` 修正后重试。
6. Living 后端不可用（`BACKEND_UNAVAILABLE`）时什么也没有提交；记录与 `state.json` 保持不变，稍后重试即可。重试同一批会得到原回执（幂等）。

向用户汇报：提交了哪些记录 / 知识 / Run（回执 `items[].item_type`），哪些未变化，哪些被拒绝及原因。不要把 `committed` 说成“已验证”。

记录与知识分开：观察、问题、假设记录只能用 `links` 关联到知识对象，不会改变需求状态或策略状态。要改变知识，按 living-knowledge 写一个有来源的知识修订。

## 输出

- `.living/records/` 中新增或更新的记录文件；
- 同步时：Living 回执（`.living/sync/receipts/`）与更新后的 `.living/sync/state.json`；
- 给用户的简短说明：记录了什么、刻意没有断言什么。

## 项目约定片段（征得用户同意后加入 AGENTS.md / CLAUDE.md）

```md
## Living 工程记录
本项目接入 Living（Project ID 见 .living/project.json）。出现值得跨会话保留的测试观察、验证、工程问题、决策或研究假设时，按 living-records Skill 写入 .living/records/。区分事实、推断与假设；未知保持未知。只有在我明确要求时才同步到 Living。
```

## 兼容策略

- 本 Skill 属于 `living-skills` 0.2.0，适用于记录 `schema_version` 1 与同步协议 1。`project_get_record_contract` 返回 Living 实际支持的版本与 JSON Schema（权威定义，本仓库不复制）。字段只做向后兼容的可选扩展；不兼容变化会提升版本号，并由 Living 固定新的 Skills 版本。
- 同步协议不依赖服务端文件路径：将来 Living 改为远程 HTTP MCP 时，本 Skill 的步骤不变，只是 MCP 配置不同。
