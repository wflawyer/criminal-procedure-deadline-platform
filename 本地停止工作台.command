#!/bin/zsh

cd "$(dirname "$0")"
PID_FILE=".local-workbench.pid"
PORT=4173

stop_tree() {
  local parent="$1"
  local child
  for child in $(pgrep -P "$parent" 2>/dev/null); do
    stop_tree "$child"
  done
  kill "$parent" >/dev/null 2>&1 || true
}

if [[ -f "$PID_FILE" ]]; then
  PID="$(cat "$PID_FILE")"
  if kill -0 "$PID" >/dev/null 2>&1; then
    stop_tree "$PID"
    echo "已停止本地案件工作台。"
  else
    echo "记录的工作台进程已不存在。"
  fi
  rm -f "$PID_FILE"
else
  # 兼容旧启动器：仅清理由本项目 vinext 启动且监听固定端口的遗留进程。
  PID="$(lsof -tiTCP:$PORT -sTCP:LISTEN 2>/dev/null | head -1)"
  if [[ -n "$PID" ]] && ps -p "$PID" -o command= | grep -q "vinext"; then
    kill "$PID"
    echo "已停止旧版启动器遗留的本地工作台。"
  else
    echo "未发现正在运行的本地工作台。"
  fi
fi
