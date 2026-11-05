---
name: living-init
description: 把当前工程目录接入一个已存在的 Living 项目：通过 Living MCP 的 project_get_bootstrap 取得初始化信息，按固定版本获取并校验 Living Skills，安装到当前项目的 Skill 目录，初始化 `.living/` 并绑定 Living 签发的 Project ID，最后验证结果。也用于检查 Living 环境、重复初始化与升级 Living Skills。适用于「初始化当前项目的 Living」「检查 Living 环境」「升级 Living Skills」。不创建 Living 项目，不自行生成 Project ID，不覆盖已有 Skills 或已绑定其他项目的 `.living/`，不同步记录，不修改 AGENTS.md / CLAUDE.md。
compatibility: 需要已连接的 Living MCP（提供 project_get_bootstrap，bootstrap_version 1）、可执行 shell 命令的 Agent（Claude Code 或 Codex）、Node.js ≥ 24 与访问 GitHub 的网络。
metadata:
  version: "0.2.1"
  bundle: "living-skills"
  living-bootstrap-version: "1"
  living-record-contract: "1"
  living-knowledge-contract: "2"
---

# Living Init

## 用途与边界

让一句「初始化当前项目的 Living」完成：取得初始化信息 → 获取并校验 Skills → 安装到项目级 Skill 目录 → 初始化 `.living/` → 绑定已有 Project ID → 验证。

- **Project ID 由 Living 签发。** 只使用 `.living/project.json`、用户在对话中给出的 ID / 项目名，或 MCP 绑定的项目。不生成、不猜测、不替用户创建项目。
- **只装固定版本。** Skills 的仓库、Commit 与每个文件的 SHA-256 由 `project_get_bootstrap` 给出；不要改去拉取 `main` 或最新版本，不要手动改哈希。
- **不覆盖。** 同名 Skill 目录已存在且不是 Living 安装的、或安装后被本地修改过，安装会停止并说明原因；`.living/` 已绑定其他项目时也会停止。已有记录永不被改写。
- **初始化不是同步。** 不调用 `project_sync_records`，不写工程记录，不提交知识对象。
- **不改项目约定文件。** 是否在 AGENTS.md / CLAUDE.md 中加入 Living 约定，先问用户。

## 输入与前提

- Living MCP 已连接，工具中有 `project_get_bootstrap` 与 `project_get_context`。没有这些工具时停止：告诉用户需要先在 Claude Code / Codex 中配置 Living MCP。
- 当前工作目录是工程项目根目录。若不确定（例如当前目录只是若干仓库的父目录），先向用户确认要接入哪个目录。
- Living 后端在运行；不可达时 MCP 返回 `BACKEND_UNAVAILABLE`，此时停止，什么也不会被写入。

## 步骤

1. **确定项目。** 若 `.living/project.json` 已存在，读取其中的 `project_id`。否则看用户这句话里有没有 Project ID 或项目名。
2. **取得初始化信息。** 调用 `project_get_bootstrap`，传入第 1 步得到的 `project_id` 或 `project_name`（都没有就不传），并传 `agent`（`claude-code` / `codex`）。
3. **按 `status` 处理：**
   - `ready`：继续。
   - `project_required`：把 `candidates` 列给用户，请用户指明项目，然后停止。只有一个候选也要确认。没有候选时，告诉用户先在 Living 页面创建项目。
   - `project_not_found`、`incompatible`、`skills_unavailable`：停止，原样转述 `reason`。
4. **安装与初始化。** 在项目根目录执行返回的 `commands.bootstrap`，命令保持原样。它会：
   - 按 Commit 下载 Skills；
   - 校验 `manifest.json` 与每个文件的 SHA-256，以及与 Living Contract 的兼容性；
   - 全部通过后才写入 Skill 目录；
   - 运行 `.living/` 初始化。

   任何一步失败都会以非零状态退出，输出 `error.code` 与说明。此时什么都不会被半写入：停止，并把原因告诉用户。不要改用其他来源，也不要手动复制文件。
5. **验证。**
   - 调用 `project_get_context(project_id)`，确认 `.living/project.json` 引用的项目在 Living 中真实存在。
   - 执行 `commands.verify`，确认 Skills 与 `.living/` 结构完整。
6. **汇报。**
   - 安装或沿用了哪些 Skills（名称、版本、目录、Commit）。
   - `.living/` 是新建还是沿用，绑定的项目名与 ID。
   - 明确没有做的事：没有同步、没有写记录、没有修改 AGENTS.md / CLAUDE.md。
   - 新安装的 Skills 可能要在新会话中才会被自动发现。

## 重复初始化与升级

- 再次执行同一命令是安全的：
  - 版本与文件哈希一致的 Skills 记为 `unchanged`；
  - `.living/` 已绑定同一项目时只做检查；
  - `records/`、`evidence/`、`sync/` 不会被改动。
- Living 固定了更新的 Skills 版本时：Living 安装且未被本地修改的 Skill 会被升级；被修改过的 Skill 会让安装停止，由用户决定。

## 停止条件（安全停止并说明原因）

| 情况 | 说明 |
| --- | --- |
| 没有 Living MCP 工具 | 需要先配置 Living MCP |
| `project_required` / `project_not_found` | 需要用户指明 Living 中已存在的项目 |
| `incompatible` / `INCOMPATIBLE_*` | Skills 与当前 Living Contract / 同步协议版本不兼容 |
| `DOWNLOAD_FAILED` / `CHECKSUM_MISMATCH` | 网络或内容校验失败；稍后重试，不要换来源 |
| `SKILL_CONFLICT` | 同名 Skill 已存在且不是 Living 安装或已被修改 |
| `PROJECT_MISMATCH` | `.living/` 已绑定其他项目 |

## 输出

- 项目级 Skill 目录中的 `living-init`、`living-knowledge`、`living-records`。每个目录带 `.living-skill.json`，记录来源 Commit 与文件哈希。
- `.living/`：`project.json`、`records/<type>/`、`knowledge/<kind>/` 与 `knowledge/runs/`、`evidence/`、`sync/state.json`、`sync/receipts/`、`README.md`。
- 给用户的简短报告（见第 6 步）。

## 兼容策略

- 本 Skill 属于 `living-skills` 0.2.1，要求 Living bootstrap 版本 1、记录 Contract 1、知识 Contract 2、同步协议 1、本地目录布局 1。Living 固定了哪个版本由 `project_get_bootstrap` 决定；版本不符时它返回 `incompatible`，安装命令返回 `INCOMPATIBLE_*`，都会安全停止。
- 从 0.1.0 升级：再次说「初始化当前项目的 Living」或「升级 Living Skills」即可。Living 安装且未修改的 Skills 会原地升级（`upgraded`），`.living/` 与已有记录不变，并补建 `.living/knowledge/` 目录。权威 Schema 在 Living 自身（`project_get_record_contract`），本仓库不维护另一份。
- 安装位置：
  - Claude Code：`.claude/skills/<name>/`
  - Codex：`.agents/skills/<name>/`
  - 两者都用时可同时安装。
- 将来 Living 改为远程 MCP 时，步骤不变，只是 `commands` 的来源不同。
