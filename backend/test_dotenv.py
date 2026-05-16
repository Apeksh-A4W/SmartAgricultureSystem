#!/usr/bin/env python
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Test 1: Check current working directory
print(f"Current working directory: {os.getcwd()}")

# Test 2: Check if .env exists in current dir
cwd_env = Path.cwd() / ".env"
print(f".env in CWD ({cwd_env.parent}): {cwd_env.exists()}")

# Test 3: Check if .env exists in backend dir
backend_dir = Path(__file__).resolve().parent
backend_env = backend_dir / ".env"
print(f".env in backend dir ({backend_dir}): {backend_env.exists()}")

# Test 4: Load from current dir
os.environ.pop("OPENWEATHER_API_KEY", None)  # Clear any existing value
load_dotenv()
key_from_cwd = os.getenv("OPENWEATHER_API_KEY")
print(f"\nLoaded from CWD: {key_from_cwd[:20] + '...' if key_from_cwd else 'NOT FOUND'}")

# Test 5: Load from backend dir
os.environ.pop("OPENWEATHER_API_KEY", None)  # Clear again
load_dotenv(backend_env)
key_from_backend = os.getenv("OPENWEATHER_API_KEY")
print(f"Loaded from backend dir: {key_from_backend[:20] + '...' if key_from_backend else 'NOT FOUND'}")

# Test 6: Show what's in the .env file
if backend_env.exists():
    print(f"\nContent of .env (first 3 lines):")
    with open(backend_env) as f:
        for i, line in enumerate(f):
            if i < 3:
                print(f"  {line.rstrip()}")
            else:
                break

print(f"\nFinal OPENWEATHER_API_KEY: {key_from_backend if key_from_backend else 'NOT SET'}")
