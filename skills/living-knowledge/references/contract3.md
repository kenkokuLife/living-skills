# Contract 3 authoring reference

正式 JSON Schema 从 project_get_record_contract(part=knowledge) 获取；这里仅说明决策，不复制 Schema。

## 字段权威

| 权威对象 | 字段 | 意义 |
| --- | --- | --- |
| Requirement | data_requirements | 本需求局部稳定身份的信息需要，必要性和来源；映射不代表充分 |
| Requirement | question_scenarios | 具体问题、预期或有范围的历史观察 |
| Requirement | current_implementation | 自己的 realized_by Alignment ID；该 Alignment 指向组合 Strategy |
| Strategy | composition.members | 独立策略成员与各自来源/条件；可共享，不成环 |
| Strategy | composition.processing | steps、transitions、terminals、entry_step_id、exit_step_ids、typical_paths |
| Step | strategy_ids / data_uses | 直接成员；引用该成员有效 uses Alignment，不另存资源关系权威 |
| Transition | from_step_id / to | to={kind:step或terminal,id}；kind=sequence/conditional/exception，后两者需 condition |
| Assertion | basis / source_refs / verification | 每条局部知识自己的依据和验证范围 |

处理图需无环、入口可达、无未标记死端；典型路径用有序 transition_ids，从入口到显式出口/终点。步骤与终点/边/典型路径共用所属 processing 的局部 ID 命名空间。步骤的 inputs/outputs 和边 carries 是普通逻辑信息，不是端口类型或物理数据对象。

## 角色不由名称或调用顺序决定

Primary 直接决定如何取材、组织和生成；Supporting 是内部访问/加载等支撑；CrossCutting 是与内容无关的准入/并发/配额等控制。共享不自动变 Supporting；成员身份也不改变角色。每个 Strategy 的 strategy_role 需 role_basis。

Task 的 primary realized_by 指向 Primary；control 指向 CrossCutting。uses 的 primary 指向 RuntimeKnowledge；配置/Prompt 用 RuntimePrompt，通常 supporting；Evaluation 通过 validated_by，不能 uses。数据库/索引是 Architecture，领域内容才是 Data Resource。同一物理数据多用途放 role_usage，不复制新对象。

## 版本

knowledge_contract_version=3 是作者能力；object/envelope/Run schema_version=1 是格式；object.revision 是作者版本；server_revision 是服务端历史序号；base_version 是完整读取时服务端返回的序号/hash；Run 有独立 revision/hash；Receipt 是原子批次结果。它们不能互换。

来源检查 verified_source 不等于运行验证；局部 source_inspection 与 execution 不同。历史 scenario 必须 observation、execution 来源及 verification 范围；其他 origin 不得有 observation 或 execution。发现测试文件只能 test_definition，不是 historical_execution。
