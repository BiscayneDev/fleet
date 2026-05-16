#!/usr/bin/env bash
# Remove the Fleet daemon LaunchAgent.
set -euo pipefail

LAUNCHD_LABEL="com.biscaynedev.fleet.daemon"
PLIST_PATH="$HOME/Library/LaunchAgents/${LAUNCHD_LABEL}.plist"

if [[ -f "$PLIST_PATH" ]]; then
  launchctl unload "$PLIST_PATH" 2>/dev/null || true
  rm -f "$PLIST_PATH"
  echo "Removed $PLIST_PATH"
else
  echo "No plist found at $PLIST_PATH — nothing to remove."
fi

echo ""
echo "Logs at ~/.fleet/logs/ are preserved. Delete with:"
echo "  rm -rf ~/.fleet/logs"
