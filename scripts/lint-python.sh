#!/usr/bin/env bash

# lint-python.sh
# Validates Python code in the repository:
# 1. Code snippets in public/examples/ and public/extracted-snippets/
# 2. API documentation generation code in scripts/api_docs/
# Runs both type checking (pyright) and style checking/formatting (ruff)
# Uses uv for dependency management

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Parse arguments
SPECIFIC_PATH=""

for arg in "$@"; do
  case $arg in
    --path=*)
      SPECIFIC_PATH="${arg#*=}"
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --path=<path>    Check only a specific file or directory"
      echo "  --help           Show this help message"
      exit 0
      ;;
  esac
done

# Function to log with timestamp and color
log() {
  local color=$1
  local message=$2
  echo -e "${color}[$(date +'%Y-%m-%d %H:%M:%S')] ${message}${NC}"
}

# Function to verify if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check if uv is installed
if ! command_exists uv; then
  log $RED "Error: 'uv' is not installed. Please install it first: https://github.com/astral-sh/uv"
  exit 1
fi

# Count Python files to typecheck
EXAMPLES_FILES=$(find "public/examples" -name "*.py" | wc -l | tr -d ' ')
SNIPPETS_FILES=$(find "public/extracted-snippets" -name "*.py" | wc -l | tr -d ' ')
API_DOCS_FILES=$(find "scripts/api_docs" -name "*.py" | wc -l | tr -d ' ')
TOTAL_FILES=$((EXAMPLES_FILES + SNIPPETS_FILES + API_DOCS_FILES))

log $YELLOW "Found $TOTAL_FILES Python files ($EXAMPLES_FILES in examples, $SNIPPETS_FILES in snippets, $API_DOCS_FILES in api_docs)"

# Check for and create a virtual environment if needed
if [ ! -d ".venv" ]; then
  log $YELLOW "No virtual environment found, creating one with 'uv venv'..."
  uv venv
  log $GREEN "Virtual environment created"
fi

# Install dependencies with uv
log $YELLOW "Installing dependencies with uv..."
uv pip install -e ".[providers]"
log $GREEN "Dependencies installed"

# Prepare tool commands
PYRIGHT_CMD="uv run pyright"
RUFF_CMD="uv run ruff check"

# Add specific path if provided
if [ -n "$SPECIFIC_PATH" ]; then
  if [ -f "$SPECIFIC_PATH" ] || [ -d "$SPECIFIC_PATH" ]; then
    PYRIGHT_CMD="$PYRIGHT_CMD $SPECIFIC_PATH"
    RUFF_CMD="$RUFF_CMD $SPECIFIC_PATH"
    log $YELLOW "Checking only path: $SPECIFIC_PATH"
  else
    log $RED "Error: The specified path '$SPECIFIC_PATH' does not exist."
    exit 1
  fi
else
  PYRIGHT_CMD="$PYRIGHT_CMD"
  RUFF_CMD="$RUFF_CMD public/examples/ public/extracted-snippets/ scripts/api_docs/"
fi

# Run pyright
log $YELLOW "Running pyright type checking..."
$PYRIGHT_CMD
PYRIGHT_STATUS=$?

if [ $PYRIGHT_STATUS -eq 0 ]; then
  log $GREEN "✅ Type checking passed"
else
  log $RED "❌ Type checking failed"
fi

# Run ruff
log $YELLOW "Running ruff code style checking..."
$RUFF_CMD
RUFF_STATUS=$?

if [ $RUFF_STATUS -eq 0 ]; then
  log $GREEN "✅ Code style checking passed"
else
  log $RED "❌ Code style checking failed"
fi

# Final result
if [ $PYRIGHT_STATUS -eq 0 ] && [ $RUFF_STATUS -eq 0 ]; then
  log $GREEN "✅ All checks passed"
  exit 0
else
  log $RED "❌ Some checks failed"
  exit 1
fi
