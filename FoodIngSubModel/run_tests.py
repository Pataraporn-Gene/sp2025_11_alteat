#!/usr/bin/env python3
"""
Quick test runner script for FoodIngSubModel backend API tests.

Usage:
    python run_tests.py                 # Run all tests
    python run_tests.py substitute      # Run /substitute tests only
    python run_tests.py -v              # Run with verbose output
    python run_tests.py --coverage      # Run with coverage report
"""

import subprocess
import sys
import os

def run_tests(args=None):
    """Run pytest with provided arguments."""
    cmd = ["pytest", "test_backend_api.py"]
    # cmd = ["python", "-m", "pytest", "test_backend_api.py", "-v"]
    
    if args:
        if isinstance(args, list):
            cmd.extend(args)
        else:
            cmd.append(args)
    
    # Always add verbose by default
    if "-v" not in cmd and "--verbose" not in cmd:
        cmd.append("-v")
    
    print(f"Running: {' '.join(cmd)}\n")
    result = subprocess.run(cmd, cwd=os.path.dirname(__file__) or ".")
    return result.returncode

if __name__ == "__main__":
    # Parse arguments
    args = sys.argv[1:] if len(sys.argv) > 1 else []
    
    # Handle endpoint shortcuts
    if args and args[0].startswith("test_"):
        endpoint = args[0]
        args = [f"::Test{endpoint.title()}Endpoint"]
    elif args and not args[0].startswith("-"):
        endpoint = args[0]
        args = [f"::Test{endpoint.title()}Endpoint", "-v"]
    
    exit_code = run_tests(args)
    sys.exit(exit_code)
