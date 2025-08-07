#!/bin/bash

# Backend Protection Script
# Usage: ./protect_backend.sh [enable|disable|status]

set -e

BACKEND_DIR="app"
PROTECTED_FILES=(
    "main.py"
    "core/"
    "api/"
    "services/"
    "models/"
)

function enable_protection() {
    echo "🛡️ Enabling backend protection..."
    
    # Make files read-only
    find $BACKEND_DIR -name "*.py" -exec chmod 444 {} \;
    
    # Create backup
    if [ ! -d "${BACKEND_DIR}_backup" ]; then
        cp -r $BACKEND_DIR "${BACKEND_DIR}_backup"
        echo "✅ Backup created: ${BACKEND_DIR}_backup"
    fi
    
    # Create git hook
    mkdir -p .git/hooks
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "🛡️ Checking for protected backend files..."
protected_files=("app/main.py" "app/core/" "app/api/" "app/services/" "app/models/")
for file in "${protected_files[@]}"; do
    if git diff --cached --name-only | grep -q "^$file"; then
        echo "❌ ERROR: $file is protected and cannot be modified!"
        exit 1
    fi
done
echo "✅ No protected files modified. Commit allowed."
EOF
    chmod +x .git/hooks/pre-commit
    
    echo "✅ Backend protection enabled!"
    echo "📝 Files are now read-only and protected from git commits"
}

function disable_protection() {
    echo "🔓 Disabling backend protection..."
    
    # Make files writable
    find $BACKEND_DIR -name "*.py" -exec chmod 644 {} \;
    
    # Remove git hook
    rm -f .git/hooks/pre-commit
    
    echo "✅ Backend protection disabled!"
    echo "📝 Files are now writable"
}

function show_status() {
    echo "📊 Backend Protection Status:"
    echo ""
    
    # Check file permissions
    echo "📁 File Permissions:"
    for file in "${PROTECTED_FILES[@]}"; do
        if [ -e "$BACKEND_DIR/$file" ]; then
            perms=$(ls -la "$BACKEND_DIR/$file" | awk '{print $1}')
            echo "   $file: $perms"
        fi
    done
    
    echo ""
    # Check git hook
    if [ -f ".git/hooks/pre-commit" ]; then
        echo "✅ Git hook: Active"
    else
        echo "❌ Git hook: Not active"
    fi
    
    # Check backup
    if [ -d "${BACKEND_DIR}_backup" ]; then
        echo "✅ Backup: Available (${BACKEND_DIR}_backup)"
    else
        echo "❌ Backup: Not available"
    fi
}

function restore_backup() {
    echo "🔄 Restoring from backup..."
    
    if [ -d "${BACKEND_DIR}_backup" ]; then
        rm -rf $BACKEND_DIR
        cp -r "${BACKEND_DIR}_backup" $BACKEND_DIR
        echo "✅ Backup restored!"
    else
        echo "❌ No backup found!"
    fi
}

case "${1:-status}" in
    "enable")
        enable_protection
        ;;
    "disable")
        disable_protection
        ;;
    "status")
        show_status
        ;;
    "restore")
        restore_backup
        ;;
    *)
        echo "Usage: $0 [enable|disable|status|restore]"
        echo ""
        echo "Commands:"
        echo "  enable   - Enable backend protection"
        echo "  disable  - Disable backend protection"
        echo "  status   - Show protection status"
        echo "  restore  - Restore from backup"
        ;;
esac
