# Changelog

## 0.1.0

- 新增 `living-init`：通过 Living MCP `project_get_bootstrap` 按固定 Commit 获取并校验 Skills，安装到项目级目录（Claude Code `.claude/skills`、Codex `.agents/skills`），初始化 `.living/` 并绑定 Living 签发的 Project ID；重复执行不覆盖已有记录或非 Living 安装的 Skills。
- 新增 `living-knowledge`：有依据的工程知识识别与渐进式构建规范。当前版本没有知识同步，只通过工程记录的显式关联引用已有知识对象。
- 新增 `living-records`：源自 Living Beta 0.1 仓库内的同名 Skill，去掉本机路径，改为从 `project_get_bootstrap` 取得本地辅助命令。
- `manifest.json` 由 `scripts/build-manifest.mjs` 生成，包含每个文件的 SHA-256 与兼容的 Living 接口版本（bootstrap 1、记录 Contract 1、同步协议 1、本地布局 1）。
- 验证：`node scripts/build-manifest.mjs --check`；安装与初始化流程在 Living 仓库中测试。未验证：Codex 实际会话。
