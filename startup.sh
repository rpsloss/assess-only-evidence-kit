#!/bin/sh
# Local assembler workbench. Packs stay in the browser. Bind loopback only.
set -eu
cd "$(dirname "$0")"
exec npm run dev
