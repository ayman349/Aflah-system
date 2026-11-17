#!/bin/sh
# Wipes the TEST database + uploads and recreates schema + test admin. Never run against production data.
set -e
cd "$(dirname "$0")/.."
su postgres -c "psql -q -d aflax -c 'drop schema public cascade; create schema public; grant all on schema public to aflax; alter schema public owner to aflax;'" >/dev/null
rm -rf storage tests/.state.json
npm run -s db:migrate >/dev/null
ADMIN_EMAIL=admin@test.local ADMIN_PASSWORD='TestPass123' ADMIN_NAME='Test Admin' npm run -s admin:create
