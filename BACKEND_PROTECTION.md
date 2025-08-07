# 🛡️ BACKEND PROTECTION GUIDE

## ⚠️ ВАЖНО: БЭКЕНД ЗАЩИЩЕН ОТ ИЗМЕНЕНИЙ

### Защищенные файлы (НЕ ИЗМЕНЯТЬ):
- `app/main.py` - Главный файл приложения
- `app/core/` - Вся папка core
- `app/api/` - Все API endpoints
- `app/services/` - Все сервисы
- `app/models/` - Все модели

### Как защитить бэкенд:

#### 1. Git Protection
```bash
# Создать защищенную ветку
git checkout -b protected-backend
git add app/
git commit -m "Protect backend"

# Защитить ветку от изменений
git branch -m protected-backend
```

#### 2. File Permissions
```bash
# Сделать файлы только для чтения
chmod 444 app/main.py
chmod 444 app/core/*.py
chmod 444 app/api/**/*.py
chmod 444 app/services/*.py
chmod 444 app/models/*.py
```

#### 3. Git Hooks
Создать `.git/hooks/pre-commit`:
```bash
#!/bin/bash
# Проверка защищенных файлов
protected_files=(
    "app/main.py"
    "app/core/"
    "app/api/"
    "app/services/"
    "app/models/"
)

for file in "${protected_files[@]}"; do
    if git diff --cached --name-only | grep -q "^$file"; then
        echo "❌ ERROR: $file is protected and cannot be modified!"
        exit 1
    fi
done
```

#### 4. Environment Variables
```bash
# Добавить в .env
BACKEND_PROTECTED=true
ALLOW_BACKEND_CHANGES=false
```

#### 5. Runtime Protection
Добавить в `app/main.py`:
```python
import os

# Проверка защиты
if os.getenv('BACKEND_PROTECTED', 'false').lower() == 'true':
    print("🛡️ Backend is protected from modifications")
    # Дополнительные проверки
```

### Команды для защиты:

```bash
# 1. Сделать файлы только для чтения
find app/ -name "*.py" -exec chmod 444 {} \;

# 2. Создать backup
cp -r app/ app_backup/

# 3. Добавить в .gitignore
echo "app/" >> .gitignore

# 4. Создать защищенную ветку
git checkout -b backend-protected
git add .
git commit -m "Protect backend from modifications"
```

### Проверка защиты:
```bash
# Проверить права доступа
ls -la app/

# Проверить git статус
git status

# Проверить защищенные файлы
git diff HEAD~1 app/
```

### Восстановление (если нужно):
```bash
# Снять защиту
chmod 644 app/main.py
chmod 644 app/core/*.py
chmod 644 app/api/**/*.py
chmod 644 app/services/*.py
chmod 644 app/models/*.py

# Или восстановить из backup
cp -r app_backup/* app/
```

---
**ПРИМЕЧАНИЕ:** После применения защиты, изменения в бэкенде будут невозможны без явного снятия защиты.
