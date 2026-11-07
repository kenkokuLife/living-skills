---
name: living-knowledge
description: 在已接入 Living 的工程项目中，读取完整既有知识，依据源码、需求、实验和工程文档渐进新增或修订 Requirement、Strategy、Data Resource 及关系；表达组合方案、逻辑数据要求、条件流程与场景，保留稳定身份、来源和验证边界，并在用户明确要求时通过 MCP 校验与同步。适用于知识调查、跨会话修订、能力链路梳理与知识连携，不替代编码 Agent 或调度工作。
metadata:
  version: "0.3.0"
  bundle: "living-skills"
  living-knowledge-contract: "3"
  living-record-contract: "1"
---

# Living Knowledge

Living 记录和展示工程认知，不执行处理流程、不批准方案、不替代编码 Agent。每次围绕用户给定范围调查和修订，不重建整张图。以服务端 `project_get_record_contract({part:"knowledge"})` 返回的正式 Schema 与规则为准；旧实验 candidate JSON、原型页面和本 Skill 的字段说明都不是同步格式权威。对象、envelope、Run 的 `schema_version` 仍是 1，不能改成 3。

## 完整读取与身份

1. 从 `.living/project.json` 取得项目 ID。需要 CLI 命令时从 `project_get_bootstrap.commands.records_cli` 取得入口；初始化见 living-init。
2. 读取正式 Contract，再调用 `project_get_knowledge({project_id})` 取得全部当前对象、完整来源、Run 和 `baseline`。`project_get_context` 只是摘要，不能作修订原文。需要时用 object_id/server_revision 读取历史，用 `project_get_construction_run` 按 hash 读取原 Run。历史读取没有写入基准。
3. 将完整结果保存为 read JSON，将其中原始 `baseline` 保存成独立 JSON；CLI 也可用 `knowledge read --base-out <new-baseline-file>`。保留当次读取的不可变副本。不要从本地 sync state、标题或摘要猜测远端最新版本。
4. 按语义和来源比较已有对象；已有需求、共享策略、同一数据资源或相同端点/用途的关系优先复用。改名、增加用途或扩大适用范围通常是同一 ID 的修订。无法确认同一身份时先查历史/来源，写 Open Question，不制造近似副本。
5. 开新 Run：`run start <slug> --goal <目标> --include <路径,…> --exclude <…>`。CLI 捕获仓库与 Skill 来源；模型只从用户明确声明或真实环境取得，否则 unknown。调查隔离副本时如实记录副本与被调查仓库，不能把副本的 Git 状态伪装成原库状态。

更新原对象可用 `knowledge revise --read-file <完整读取.json> --id <原ID> --run <新RunID> --change-note <原因>`。它保留完整合法字段，保留 ID，将作者 revision 加一，拒绝覆盖本地已有草稿。导入对象无 envelope 时还需按本次调查声明 `--basis`。也可直接复制完整 object 手工准备 envelope；不得只挑已知字段重建对象，不理解但合法的扩展字段也必须保留。修改前比较本地草稿，防止丢失另一会话的工作。

新对象用 `knowledge new <kind> <slug> --title <标题> --run <run-id>` 起草；骨架中的 TODO 需要来源支持后才能提交。目录和前缀：requirements/req-、strategies/st-、data-resources/dr-、relations/al-、capabilities/cap-、architecture/arch-、open-questions/oq-、decisions/kd-；envelope kind 分别为 requirements、strategies、data_resources、alignments、capabilities、architectures、attention、decisions。

## 建模时的判断

- **Requirement** 表达用户想完成的任务（Task）或约束（Constraint），有产品、文档、入口或用户陈述来源。代码存在一个模块不自动产生正式需求。
- **Question Scenario** 是 Requirement 内的具体问题/验收情境（`question_scenarios`），不是另一条需求。区分 proposed、test_definition、typical_path 和 historical_execution；问题文本、期望、实测观察分开。
- **Open Question** 是尚待回答的工程不确定性（attention），例如端点语义、数据覆盖是否充分。不要把未确认问题写成支持范围或假装已经解决。
- **需求需要的信息** 写 `data_requirements`：为什么需要、required/conditional/quality、条件和断言；`resource_mappings` 只说明与现有资源对应。`assessment` 分开记录充分性、缺失数据与实现缺口；Unknown 保持 unknown。
- **资源分类** 使用 `resource_role`。业务数据用 RuntimeKnowledge，Prompt 与运行配置用 RuntimePrompt，测试与评估用 Evaluation，工程资料用 DevelopmentArtifact，依据不足用 Unverified。按来源核对用途，同名和调用位置不足以分类。
- **实现实际使用的数据** 用 canonical `uses` Alignment。数据被读取不证明它逻辑必需、充分或覆盖完整。`needs` 表达已确认的未满足资源需要；算法缺口不是缺少数据库。不从映射自动建立 uses/needs。
- **完整方案** 是带 `composition` 的 Strategy，成员继续是独立、可复用的 Strategy。Requirement 仍通过 `realized_by` 指向完整方案，成员只存于 `composition.members`，不为成员资格再造一组关系。不要把完整方案与同名成员重复创建。
- **逻辑步骤** 写在 `composition.processing`，表达目的、逻辑输入输出和参与的直接成员；不要求一函数一步或一成员一步。中间信息不是新 Data Resource。步骤实际取用物理资源时 `data_uses` 引用参与成员已有的 uses Alignment。
- **条件流程** 只由 transitions 定义：条件/异常边有条件，显式标识提前返回、错误和出口。不要把异常上抛写成成功降级。流程图是对源码的描述，不是执行器；没有循环执行语义。按真实来源选择粒度，不固定七步、资源数或阶段数。
- **静态典型路径** 用 `typical_paths`（kind=typical），不声称跑过。真实历史场景需具体观察、输出/报告来源和明确 component/end_to_end 范围。测试定义不是测试结果，组件检查不是当前端到端验证。
- `current_implementation` 只能显式选择本需求指向组合方案的有效 Alignment；声明当前实现不等于部署、批准、用户采纳或验证。无法确认时省略，不凭唯一候选自动选中。

需要详细字段权威、角色和认识状态时读 [references/contract3.md](references/contract3.md)。在同一原子批次中调整引用。保留语义不变的局部 ID（数据要求、场景、步骤、边、终点）；拆分/合并需要新身份及明确原因，不能靠数组顺序匹配。

## 来源与边界

每个对象、关系、局部断言都独立记录来源和确定性；子项不继承父项的验证状态。读代码可支持“代码这样做”，不能支持“能力已经验证”。

Envelope `basis`：verified_source 表示作者亲自读了来源，reported 表示转述，inferred 表示推断（对象 provenance 必须 hypothetical）。这不等同于局部 `assertion.basis`：source_inspection / reported / inferred / execution / unknown。Execution 需检查输出/报告；verification 还需该检查自己的来源及范围。假设不能改写成已验证事实。

保留已有 source_refs、evidence_ids、认识状态与验证范围；新增来源写准确 repo/ref/path/lines/note/checked_at。历史实验只支持其当时的范围，旧候选事实不能因通过 Schema/MCP 就提升为已验证。当前源码、历史运行、推断和待验收场景分开。

Git 引用仅用于该 ref 中真实存在的文件。本地未提交文件与 MCP 历史对象应在来源说明中明确访问范围、原始位置及可用哈希／Run Revision，不伪装成固定 Commit 文件；404 本身不证明历史证据不存在。找不到原文时说明当前不可复核及是否有独立支持。`verified_scope.verified_on` 保留有依据的原始执行／验证日期，method 明说原始方法和本次只读复核日期；`source_refs.checked_at` 是本次检查日。纠正已同步内容需从最新完整读取创建后续修订，不改写历史。

`implementation`（实现）、`current_use`（当前运行）和验证是独立维度。Active 需 current_use_basis。Requirement 的 supported_scope 只说明源码可确认的实现范围；verified_scope 需真正输出/报告。保留 unverified_scope、unsupported_scope、限制及风险。不能标记用户 Accepted，不能用工程记录隐式重写知识。

## 每次 Construction Run 的覆盖检查

结束调查时，将本次草稿与完整读取的既有 Knowledge 合看，按稳定 Requirement ID 核对调查范围内的业务 Task，包括本次未修订的 Task。Constraint 单独核对，适用对象只用有来源的 `applies_to`。对范围外的 Task，只摘要已读知识可确认的状态并标明「范围外／未复核」。

在交付中为每个范围内 Task 列出 ID、实现路径、信息建模与资源映射、相关 Alignment 或来源、尚待核实事项。实现和数据覆盖分别报告，同一需求可同时有实现和映射缺口：

- 有状态为 Implemented 的 `realized_by`，且有结构化 `data_requirements`。列出已映射项与覆盖、充分性仍未知的项。
- 有已实现的关系，缺少 Contract 3 数据建模。保留原实现关系，指出缺少结构化需求。没有显式 `current_implementation` 时单列当前组合 Unknown。
- 有逻辑数据要求，部分或全部缺少资源映射。逐项列出缺少映射的局部 ID。资源缺口与实现缺口仍按各自依据记录。
- 有明确未来计划且尚无可靠实现路径。分别引用计划依据和路径判断。若只有 `NoPath`，报告已记录的路径状态。若只有 `Exploring` 或 `Unknown`，按原状态报告，列明需要调查的事项。
- 实现、需求范围或映射依据不足时保留 Unknown，说明应核对的具体来源。

`status` 表达支持状态。Contract 3 没有 Requirement 生命周期字段，计划只在有来源时写入调查报告或正式对象允许的来源与断言说明。覆盖检查是 Run 的交付内容，缺口可使用现有 `unresolved` 或有来源的 Open Question 记录。发现缺口可以先报告，新增或修订仍限本次调查与授权范围。

## Validate → Sync → Receipt → 再读取

本地 `status`/`validate` 检查文件；最终引用、来源与并发检查由 MCP Validate 执行。完成覆盖检查后运行 `run finish <id>`，核对 created/updated/relations 与未解决项；Run 不是 Knowledge Revision 或 Sync Receipt。

1. `bundle --base-file <本次读取baseline.json> --knowledge-contract 3 --out <包.json>`。明确理解 Contract 3 才声明能力 3。只提交本次修改项，避免把旧默认字段哈希差异当成改动。每个修订保留原 ID、作者 revision 递增、新 run_id、change_note 和读取时 base_version。
2. 通过 `project_validate_records` 提交包内 project_id/records/knowledge/construction_runs/attachments；不要把同步专用 idempotency_key/user_requested 塞给 Validate。检查 valid 和每项计划结果及错误。
3. 仅对用户已明确授权的项目/范围调用 `project_sync_records`，使用包内相同内容、基准、幂等键和 user_requested=true。仅要求准备候选时停在 Validate，汇报差异。用户明确授权的隔离验证可以写该临时项目；不能扩展到正式项目。
4. 检查 Receipt 的 committed/no_changes/rejected 与逐项结果。只有成功回执才 `apply-receipt --file <回执.json>` 更新本地确认状态；Rejected 不标已同步。原请求网络重试保留原幂等键，内容或基准改变后重新 bundle 产生新键。
5. 再次 `project_get_knowledge`，核对对象原始内容、来源、作者/服务端 Revision、producing Run/hash 和关系；按需读取旧 server_revision，确认历史未被覆盖。保存读后快照和结果。

冲突（BASE_VERSION_REQUIRED、BASE_VERSION_CONFLICT 等）时重新完整读取，将“原读取、本地候选、新远端”三者比较，保留双方合法改动并协调同一身份，然后重新准备作者 revision、baseline、bundle 和 Validate。提高到很大的 revision 不能解决冲突。没有把握协调的语义交给用户决定，不自动换 ID 追加一个替代对象。

## 候选来源与输出

公共安装使用 Living 的正式 lock。发布前只用显式 `skills-candidate --source <本地Skill仓库> --agent <agent>` 在独立空目录安装；不改 lock，不伪造已发布 Commit。Run 应记录 local_candidate、基础 Commit、manifest/文件哈希；本地修改后重新生成 manifest 并安装新候选，不能沿用旧标记。

交付新增/修订/复用/待判断对象清单、正式 Schema 可校验的包、来源、未验证项和实际 MCP 结果。结构通过与存储成功不等于业务能力通过。
