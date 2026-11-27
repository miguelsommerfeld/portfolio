#!/bin/sh
set -eu

ESCAPED_API_BASE_URL=$(printf '%s' "${API_BASE_URL:-}" | sed 's/\\/\\\\/g; s/"/\\"/g')
printf 'window.__ENV__ = { API_BASE_URL: "%s" };\n' "$ESCAPED_API_BASE_URL" > /usr/share/nginx/html/env.js
