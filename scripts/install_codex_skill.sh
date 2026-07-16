#!/usr/bin/env bash

set -euo pipefail

SKILL_NAME="calculate-criminal-deadlines"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SOURCE="${REPOSITORY_ROOT}/codex-skill/${SKILL_NAME}"
CODEX_ROOT="${CODEX_HOME:-${HOME}/.codex}"
TARGET_PARENT="${CODEX_ROOT}/skills"
TARGET="${TARGET_PARENT}/${SKILL_NAME}"
FORCE=false

if [[ "${1:-}" == "--force" ]]; then
  FORCE=true
elif [[ $# -gt 0 ]]; then
  echo "用法：bash scripts/install_codex_skill.sh [--force]" >&2
  exit 2
fi

if [[ ! -f "${SOURCE}/SKILL.md" ]]; then
  echo "错误：仓库内 Skill 不完整：${SOURCE}" >&2
  exit 1
fi

if [[ -e "${TARGET}" && "${FORCE}" != "true" ]]; then
  echo "错误：目标已存在：${TARGET}" >&2
  echo "如确认更新，请运行：bash scripts/install_codex_skill.sh --force" >&2
  exit 1
fi

mkdir -p "${TARGET_PARENT}"

if [[ -e "${TARGET}" ]]; then
  rm -rf "${TARGET}"
fi

cp -R "${SOURCE}" "${TARGET}"
chmod +x "${TARGET}/scripts/deadline-cli.mjs"

if command -v node >/dev/null 2>&1; then
  node --experimental-strip-types "${TARGET}/scripts/deadline-cli.mjs" help >/dev/null
else
  echo "提示：Skill 已复制，但当前找不到 Node.js；期限计算需要 Node.js 22.13 或更高版本。" >&2
fi

echo "已安装：${TARGET}"
echo '请在新的 Codex 任务中使用：$calculate-criminal-deadlines'
