#!/usr/bin/env python3
"""Script to regenerate all test snapshots."""

import subprocess
import sys
from pathlib import Path


def run_command(cmd: list[str], description: str) -> bool:
    """Run a command and report success/failure."""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(e.stderr)
        return False


def main() -> int:
    """Regenerate all snapshots."""
    print("🚀 Regenerating all api2mdx snapshots...")

    # Get the project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent

    commands = [
        # Regenerate mirascope v2 llm example
        (
            [
                "uv",
                "run",
                "-m",
                "api2mdx.main",
                "--source-path",
                "./snapshots",
                "--package",
                "mirascope_v2_llm",
                "--output",
                "./snapshots/mdx",
                "--output-directives",
                "./snapshots/directives",
            ],
            "Regenerating mirascope_v2_llm snapshot",
        ),
    ]

    success_count = 0
    for cmd, description in commands:
        if run_command(cmd, description):
            success_count += 1

    total = len(commands)
    if success_count == total:
        print(f"\n🎉 All {total} snapshots regenerated successfully!")
        print("\n💡 Use 'git diff' to see what changed")
        return 0
    else:
        print(f"\n💥 {total - success_count}/{total} snapshots failed to regenerate")
        return 1


if __name__ == "__main__":
    sys.exit(main())
