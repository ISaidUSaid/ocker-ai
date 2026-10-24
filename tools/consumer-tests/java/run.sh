#!/bin/sh
# SPDX-License-Identifier: Apache-2.0
# Author: Jenko <adam@isaidusaid.com>
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
MAVEN="${MAVEN_BIN:-mvn}"
REPOSITORY="$ROOT/.work/consumer-m2"
WORK="$ROOT/.work/consumer-java"
TMP="$ROOT/.work/tmp"
rm -rf "$REPOSITORY" "$WORK"
mkdir -p "$REPOSITORY" "$WORK" "$TMP"
cp "$ROOT/tools/consumer-tests/java/pom.xml" "$WORK/pom.xml"
cp -R "$ROOT/tools/consumer-tests/java/src" "$WORK/src"
mkdir -p "$WORK/src/test/resources"
cp "$ROOT/spec/examples/joe-jill.ocker.json" "$WORK/src/test/resources/joe-jill.ocker.json"
TMPDIR="$TMP" "$MAVEN" --batch-mode -Dmaven.repo.local="$REPOSITORY" -f "$ROOT/ri/java/pom.xml" -DskipTests install
TMPDIR="$TMP" "$MAVEN" --batch-mode -Dmaven.repo.local="$REPOSITORY" -Dconsumer.repository="$REPOSITORY" -f "$WORK/pom.xml" test
