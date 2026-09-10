#!/bin/sh
# Builds the Chrome Web Store upload from the last commit: dist/unleash-focus-<version>.zip
# Files marked export-ignore in .gitattributes (store assets, docs, scripts) are left out.
set -e
cd "$(dirname "$0")/.."

if [ -n "$(git status --porcelain)" ]; then
  echo "Commit your changes first; the zip is built from HEAD." >&2
  exit 1
fi

version=$(node -p 'require("./manifest.json").version')
mkdir -p dist
out="dist/unleash-focus-$version.zip"
rm -f "$out"
git archive --format=zip -o "$out" HEAD
unzip -l "$out"
echo "Built $out"
