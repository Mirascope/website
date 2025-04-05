#!/usr/bin/env bash

# typecheck-snippets.sh
# Typechecks Python code snippets in public/examples/ and public/extracted-snippets/
# Uses uv for dependency management and pyright for typechecking

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Parse arguments
CHECK_MODE=false
VERBOSE=false
SPECIFIC_PATH=""

for arg in "$@"; do
  case $arg in
    --check)
      CHECK_MODE=true
      shift
      ;;
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
      echo "  --check          Only check if typechecking passes, don't show detailed errors"
      echo "  --verbose        Show more detailed output including uv and pyright logs"
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
  uv pip install -e ".[providers]"
else
  uv pip install -e ".[providers]" > /dev/null 2>&1
fi
log $GREEN "Dependencies installed"

# Run pyright for typechecking
log $YELLOW "Running pyright typechecking..."

# Prepare pyright command
PYRIGHT_CMD="uv run pyright"

# Add specific path if provided
if [ -n "$SPECIFIC_PATH" ]; then
  if [ -f "$SPECIFIC_PATH" ] || [ -d "$SPECIFIC_PATH" ]; then
    PYRIGHT_CMD="$PYRIGHT_CMD $SPECIFIC_PATH"
    log $YELLOW "Checking only path: $SPECIFIC_PATH"
  else
    log $RED "Error: The specified path '$SPECIFIC_PATH' does not exist."
    exit 1
  fi
fi

if [ "$CHECK_MODE" = true ]; then
  # Only check for errors without showing details
  if $PYRIGHT_CMD > /dev/null 2>&1; then
    log $GREEN "✅ Typechecking passed"
    exit 0
  else
    log $RED "❌ Typechecking failed, run without --check flag to see details"
    exit 1
  fi
else
  # Show detailed errors
  TEMP_OUTPUT=$(mktemp)
  $PYRIGHT_CMD | tee $TEMP_OUTPUT
  
  # Check exit status from the pyright command
  if [ ${PIPESTATUS[0]} -eq 0 ]; then
    log $GREEN "✅ Typechecking passed"
    rm $TEMP_OUTPUT
    exit 0
  else
    # Count errors
    ERROR_COUNT=$(grep -c "error:" $TEMP_OUTPUT || echo "0")
    WARNING_COUNT=$(grep -c "warning:" $TEMP_OUTPUT || echo "0")
    
    log $RED "❌ Typechecking failed with $ERROR_COUNT errors and $WARNING_COUNT warnings"
    rm $TEMP_OUTPUT
    exit 1
  fi
fi