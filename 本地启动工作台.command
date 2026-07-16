#!/bin/zsh

set -e
cd "$(dirname "$0")"

PORT=4173
URL="http://127.0.0.1:${PORT}"
LOG_FILE=".local-workbench.log"
PID_FILE=".local-workbench.pid"
DEPS_STAMP=".local-deps.sha256"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "未找到 Node.js 或 npm，无法启动工作台。"
  echo "请先安装 Node.js 22.13 或更高版本。"
  read "? 按回车键退出……"
  exit 1
fi

if ! node -e 'const [major, minor] = process.versions.node.split(".").map(Number); process.exit(major > 22 || (major === 22 && minor >= 13) ? 0 : 1)'; then
  echo "当前 Node.js 版本为 $(node --version)，低于工作台要求的 22.13。"
  echo "请升级 Node.js 后再启动。"
  read "? 按回车键退出……"
  exit 1
fi

if curl --silent --fail "$URL" >/dev/null 2>&1; then
  if curl --silent --fail "$URL" | grep -q "刑事诉讼程序与期限管理平台"; then
    open "$URL"
    echo "工作台已在运行：$URL"
    exit 0
  fi
  echo "端口 $PORT 已被其他程序占用，没有启动或打开未知网页。"
  echo "请先关闭占用该端口的程序后重试。"
  read "? 按回车键退出……"
  exit 1
fi

LOCK_HASH="$(LC_ALL=C shasum -a 256 package-lock.json | awk '{print $1}')"
SAVED_HASH="$(cat "$DEPS_STAMP" 2>/dev/null || true)"
if [[ ! -d node_modules || "$LOCK_HASH" != "$SAVED_HASH" ]]; then
  echo "正在同步经过锁定的本地组件……"
  npm ci
  echo "$LOCK_HASH" > "$DEPS_STAMP"
fi

echo "正在校验并生成本地版本……"
npm run build

echo "正在启动案件工作台……"
npm run start -- --port "$PORT" >"$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"
trap 'rm -f "$PID_FILE"' EXIT

for attempt in {1..30}; do
  if curl --silent --fail "$URL" >/dev/null 2>&1; then
    open "$URL"
    echo "已启动：$URL"
    echo "案件数据保存在本机浏览器中。请定期在‘案件库’中导出 JSON 备份。"
    echo "请保持此窗口开启；需要关闭时双击‘本地停止工作台.command’。"
    wait "$SERVER_PID"
    exit $?
  fi
  sleep 1
done

echo "启动超时。请查看 $LOG_FILE 了解原因。"
kill "$SERVER_PID" >/dev/null 2>&1 || true
read "? 按回车键退出……"
exit 1
