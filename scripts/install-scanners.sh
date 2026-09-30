#!/usr/bin/env bash
set -euo pipefail

SEMGREP_VERSION=1.178.0
CHECKOV_VERSION=3.3.20
GITLEAKS_VERSION=8.30.1
TRIVY_VERSION=0.74.0
CONFTEST_VERSION=0.71.0

GITLEAKS_SHA256=551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb
TRIVY_SHA256=2ae6fe3ee734b7fdf11335663e18c75ea12dccc76062f09f164a3b0f8be4371a
CONFTEST_SHA256=765dfefdf0730693d7541ea0147e10d530a54ed257bbfec055ff34c837ffdf72

BIN_DIR=${BIN_DIR:-/usr/local/bin}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

fetch() {
  local url=$1 sha=$2 bin=$3
  curl -fsSL -o "$TMP/pkg.tgz" "$url"
  echo "$sha  $TMP/pkg.tgz" | sha256sum -c --quiet
  tar -xzf "$TMP/pkg.tgz" -C "$TMP" "$bin"
  install -m 0755 "$TMP/$bin" "$BIN_DIR/$bin"
  rm -f "$TMP/pkg.tgz" "$TMP/$bin"
}

fetch "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" \
  "$GITLEAKS_SHA256" gitleaks
fetch "https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VERSION}/trivy_${TRIVY_VERSION}_Linux-64bit.tar.gz" \
  "$TRIVY_SHA256" trivy
fetch "https://github.com/open-policy-agent/conftest/releases/download/v${CONFTEST_VERSION}/conftest_${CONFTEST_VERSION}_Linux_x86_64.tar.gz" \
  "$CONFTEST_SHA256" conftest

pipx install "semgrep==${SEMGREP_VERSION}"
pipx install "checkov==${CHECKOV_VERSION}"

gitleaks version
trivy --version | head -1
conftest --version | head -1
semgrep --version
checkov --version
