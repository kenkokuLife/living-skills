# Changelog

## 0.2.0

- `living-knowledge`：从「规范说明」改为正式的知识构建流程，共 9 步：范围 → Run → 最小资料 → 去重 → 实现 / 候选 / 未知 → 有来源的关系 → 未知项 → 结束 Run → 等待连携。说明 `.living/knowledge/` 目录、ID 前缀、envelope、三种依据类型、跨会话修订和常见错误。模型身份只在用户声明时记录。
- `living-records`：同步改为一次覆盖记录、知识与 Construction Run；补充记录不改写知识的边界。
- `living-init`：兼容检查加入知识 Contract 1，并说明从 0.1.0 原地升级的方式。
- `requires` 增加 `knowledge_contract: [1]`。
- 验证：`node scripts/build-manifest.mjs --check`；Living 仓库的安装器与同步测试。未验证：真实 Agent 会话中的知识构建、Codex。

## 0.1.0

- 新增 `living-init`：通过 Living MCP `project_get_bootstrap` 按固定 Commit 获取并校验 Skills，安装到项目级目录（Claude Code `.claude/skills`、Codex `.agents/skills`），初始化 `.living/` 并绑定 Living 签发的 Project ID；重复执行不覆盖已有记录或非 Living 安装的 Skills。
- 新增 `living-knowledge`：有依据的工程知识识别与渐进式构建规范。当前版本没有知识同步，只通过工程记录的显式关联引用已有知识对象。
- 新增 `living-records`：源自 Living Beta 0.1 仓库内的同名 Skill，去掉本机路径，改为从 `project_get_bootstrap` 取得本地辅助命令。
- `manifest.json` 由 `scripts/build-manifest.mjs` 生成，包含每个文件的 SHA-256 与兼容的 Living 接口版本（bootstrap 1、记录 Contract 1、同步协议 1、本地布局 1）。
- 验证：`node scripts/build-manifest.mjs --check`；安装与初始化流程在 Living 仓库中测试。未验证：Codex 实际会话。
