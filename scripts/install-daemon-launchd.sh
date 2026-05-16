#!/usr/bin/env bash
# Install Fleet daemon as a macOS LaunchAgent.
# Runs on login + restarts on crash.
set -euo pipefail

LAUNCHD_LABEL="com.biscaynedev.fleet.daemon"
PLIST_PATH="$HOME/Library/LaunchAgents/${LAUNCHD_LABEL}.plist"
FLEET_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NODE_BIN="$(command -v node)"
LOG_DIR="$HOME/.fleet/logs"

if [[ -z "$NODE_BIN" ]]; then
  echo "error: node not found on PATH" >&2
  exit 1
fi

mkdir -p "$LOG_DIR"
mkdir -p "$HOME/Library/LaunchAgents"

cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LAUNCHD_LABEL}</string>
  <key>WorkingDirectory</key>
  <string>${FLEET_DIR}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${NODE_BIN}</string>
    <string>${FLEET_DIR}/scripts/daemon.mjs</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/daemon.stdout.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/daemon.stderr.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
PLIST

echo "Wrote $PLIST_PATH"
echo ""
echo "Loading daemon..."
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"
echo "Done."
echo ""
echo "Logs:"
echo "  $LOG_DIR/daemon.log         (launcher)"
echo "  $LOG_DIR/daemon.stdout.log  (launchd stdout)"
echo "  $LOG_DIR/daemon.stderr.log  (launchd stderr)"
echo ""
echo "Stop temporarily:  launchctl unload  $PLIST_PATH"
echo "Start again:       launchctl load    $PLIST_PATH"
echo "Remove entirely:   scripts/uninstall-daemon-launchd.sh"
