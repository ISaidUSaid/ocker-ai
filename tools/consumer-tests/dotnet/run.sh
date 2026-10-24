#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2026 Jenko <adam@isaidusaid.com>
set -euo pipefail
root="$(cd "$(dirname "$0")/../../.." && pwd)"
dotnet_bin="${DOTNET_BIN:-dotnet}"
if [[ "$dotnet_bin" != /* ]]; then
  if [[ -x "$root/$dotnet_bin" ]]; then dotnet_bin="$root/$dotnet_bin"; else dotnet_bin="$(command -v "$dotnet_bin")"; fi
fi
work="$root/.work/consumer-dotnet"
feed="$root/.work/ocker-nuget"
cache="$root/.work/consumer-nuget-packages"
rm -rf "$work" "$cache" "$feed"
mkdir -p "$work" "$feed" "$cache"
"$dotnet_bin" build "$root/ri/c#/Ocker.sln" -c Debug
"$dotnet_bin" pack "$root/ri/c#/src/Ocker.Core/Ocker.Core.csproj" -c Debug -o "$feed" --no-build --no-restore
"$dotnet_bin" pack "$root/ri/c#/src/Ocker.Avalonia/Ocker.Avalonia.csproj" -c Debug -o "$feed" --no-build --no-restore
cp "$root/spec/examples/joe-jill.ocker.json" "$work/joe-jill.ocker.json"
cp "$root/tools/consumer-tests/dotnet/Consumer.csproj" "$work/Consumer.csproj"
cp "$root/tools/consumer-tests/dotnet/Program.cs" "$work/Program.cs"
cat > "$work/NuGet.Config" <<CONFIG
<?xml version="1.0" encoding="utf-8"?>
<configuration><packageSources><clear /><add key="ocker-local" value="$feed" /><add key="nuget.org" value="https://api.nuget.org/v3/index.json" /></packageSources><packageSourceMapping><packageSource key="ocker-local"><package pattern="Ocker.AI.*" /></packageSource><packageSource key="nuget.org"><package pattern="*" /></packageSource></packageSourceMapping></configuration>
CONFIG
export NUGET_PACKAGES="$cache"
(cd "$work"; "$dotnet_bin" run --configfile "$work/NuGet.Config" --project "$work/Consumer.csproj")
assets="$work/obj/project.assets.json"
grep -q 'Ocker.AI.Core/0.1.0' "$assets"
grep -q 'Ocker.AI.Avalonia/0.1.0' "$assets"
find "$cache" -path '*/ocker.ai.core/0.1.0/lib/net8.0/Ocker.Core.dll' -print -quit | grep -q .
find "$cache" -path '*/ocker.ai.avalonia/0.1.0/lib/net8.0/Ocker.Avalonia.dll' -print -quit | grep -q .
printf 'Consumer used local packages from %s with isolated cache %s\n' "$feed" "$cache"
