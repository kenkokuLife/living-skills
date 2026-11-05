# living-skills

Living 的 Agent Skills。它们让 Claude Code / Codex 在工程项目中接入 Living、识别有依据的工程知识、积累工程记录。

| Skill | 用途 |
| --- | --- |
| [`living-init`](skills/living-init/SKILL.md) | 项目初始化与环境检查：取得 bootstrap 信息，按固定版本安装 Skills，初始化 `.living/` 并绑定 Living 签发的 Project ID |
| [`living-knowledge`](skills/living-knowledge/SKILL.md) | 有依据的工程知识（需求、策略、数据资源、能力边界）识别与渐进式构建规范 |
| [`living-records`](skills/living-records/SKILL.md) | 日常观察、验证、成果、问题、决策、假设的记录与增量同步规范 |

## 版本与兼容性

当前版本 **0.1.0**（见 [`bundle.json`](bundle.json)），兼容：

| Living 接口 | 版本 |
| --- | --- |
| Bootstrap（`project_get_bootstrap`） | 1 |
| 工程记录 Contract（`record.schema_version`） | 1 |
| 同步协议（`protocol_version`） | 1 |
| `.living/` 本地布局 | 1 |

权威 Schema 在 Living 本身（MCP `project_get_record_contract`），本仓库不维护另一份正式 JSON Schema。

## 获取方式

通常不需要手动安装。在已连接 Living MCP 的 Agent 中说「初始化当前项目的 Living」即可：

1. Living 的 `project_get_bootstrap` 返回本仓库地址、**固定的 Commit**、`manifest.json` 与每个文件的 SHA-256。
2. Living 的安装命令按该 Commit 下载文件（`https://raw.githubusercontent.com/kenkokuLife/living-skills/<commit>/<path>`），全部校验通过后才写入项目，不会获取 `main` 的最新内容。
3. 安装位置（项目级）：
   - Claude Code：`.claude/skills/<name>/`
   - Codex：`.agents/skills/<name>/`

   每个目录附带 `.living-skill.json`，记录来源 Commit 与文件哈希。已有的同名 Skill 若不是 Living 安装的，或已被本地修改，安装会停止，不会覆盖。

Living 升级所固定的 Commit 后，重新初始化即可升级未被本地修改的 Skills。

## 维护

```bash
node scripts/build-manifest.mjs           # 修改 Skill 后重新生成 manifest.json
node scripts/build-manifest.mjs --check   # 检查 manifest 是否最新、命名与版本是否一致、是否含不可发布的内容
```

- 每个 Skill 的 `metadata.version` 与 `bundle.json` 的 `version` 一致；改动 Skill 内容时提升版本并记录在 [CHANGELOG](CHANGELOG.md)。
- 不提交个人路径、真实 Project ID、项目数据或凭证（`--check` 会拦截常见情况）。
- 发布新版本后，由 Living 仓库固定新的 Commit（Living 的 `npm run skills:pin`）。
