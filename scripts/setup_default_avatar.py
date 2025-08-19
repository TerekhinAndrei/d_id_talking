#!/usr/bin/env python3
"""
Script to copy default avatar from frontend to backend
"""

import os
import shutil
import sys
from pathlib import Path

def setup_default_avatar():
    """Copy default avatar from frontend to backend"""
    
    # Get project root directory
    project_root = Path(__file__).parent.parent
    frontend_avatar_path = project_root / "frontend" / "public" / "default_avatar.jpg"
    backend_avatar_dir = project_root / "uploads" / "avatar"
    backend_avatar_path = backend_avatar_dir / "default_avatar.jpg"
    
    print(f"Project root: {project_root}")
    print(f"Frontend avatar path: {frontend_avatar_path}")
    print(f"Backend avatar path: {backend_avatar_path}")
    
    # Check if frontend avatar exists
    if not frontend_avatar_path.exists():
        print(f"Error: Frontend avatar not found at {frontend_avatar_path}")
        return False
    
    # Create backend avatar directory if it doesn't exist
    backend_avatar_dir.mkdir(parents=True, exist_ok=True)
    
    # Copy avatar file
    try:
        shutil.copy2(frontend_avatar_path, backend_avatar_path)
        print(f"Successfully copied default avatar to {backend_avatar_path}")
        return True
    except Exception as e:
        print(f"Error copying avatar: {e}")
        return False

if __name__ == "__main__":
    success = setup_default_avatar()
    sys.exit(0 if success else 1)
