#!/usr/bin/env bash

# validate-snippets.sh
# Validates Python code snippets in public/examples/ and public/extracted-snippets/
# Runs both type checking (pyright) and style checking (ruff)
# Uses uv for dependency management

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Parse arguments
VERBOSE=false
SPECIFIC_PATH=""

for arg in "$@"; do
  case $arg in
    --verbose)
      VERBOSE=true
      shift
      ;;
    --path=*)
      SPECIFIC_PATH="${arg#*=}"
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --verbose        Show more detailed output including uv and tool logs"
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
TOTAL_FILES=$((EXAMPLES_FILES + SNIPPETS_FILES))

log $YELLOW "Found $TOTAL_FILES Python files ($EXAMPLES_FILES in examples, $SNIPPETS_FILES in snippets)"

# Install dependencies with uv
log $YELLOW "Installing dependencies with uv..."
if [ "$VERBOSE" = true ]; then
  uv pip install -e ".[mirascope-all]"
else
  uv pip install -e ".[mirascope-all]" > /dev/null 2>&1
fi
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
  RUFF_CMD="$RUFF_CMD public/examples/ public/extracted-snippets/"
fi

# Run pyright
log $YELLOW "Running pyright type checking..."
PYRIGHT_OK=true
TEMP_OUTPUT=$(mktemp)
$PYRIGHT_CMD | tee $TEMP_OUTPUT

# Check exit status from the pyright command
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  # Count errors
  ERROR_COUNT=$(grep -c "error:" $TEMP_OUTPUT || echo "0")
  WARNING_COUNT=$(grep -c "warning:" $TEMP_OUTPUT || echo "0")
  
  log $RED "❌ Type checking failed with $ERROR_COUNT errors and $WARNING_COUNT warnings"
  PYRIGHT_OK=false
else
  log $GREEN "✅ Type checking passed"
fi
rm $TEMP_OUTPUT

# Run ruff
log $YELLOW "Running ruff code style checking..."
RUFF_OK=true
if ! $RUFF_CMD; then
  log $RED "❌ Code style checking failed"
  RUFF_OK=false
else
  log $GREEN "✅ Code style checking passed"
fi

# Final result
if [ "$PYRIGHT_OK" = true ] && [ "$RUFF_OK" = true ]; then
  log $GREEN "✅ All checks passed"
  exit 0
else
  [ "$PYRIGHT_OK" = false ] && log $RED "❌ Type checking failed"
  [ "$RUFF_OK" = false ] && log $RED "❌ Code style checking failed"
  exit 1
fi