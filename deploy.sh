#!/bin/bash

# Deploy script para GitHub Pages
echo "🚀 Iniciando proceso de deploy..."

# Verificar que estamos en la rama main
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "❌ Error: Debes estar en la rama 'main' para hacer deploy"
    exit 1
fi

# Verificar que no hay cambios sin commit
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Hay cambios sin commit. Agregando archivos..."
    git add .
    
    # Pedir mensaje de commit o usar uno por defecto
    if [ -z "$1" ]; then
        commit_message="Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    else
        commit_message="$1"
    fi
    
    echo "💾 Haciendo commit: $commit_message"
    git commit -m "$commit_message"
fi

# Construir el proyecto
echo "🔨 Construyendo el proyecto..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error en la construcción del proyecto"
    exit 1
fi

# Hacer push a GitHub
echo "📤 Subiendo cambios a GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Deploy completado exitosamente!"
    echo "🌐 El sitio estará disponible en: https://orpira.github.io/orpira-portfolio"
    echo "⏱️  Espera 2-3 minutos para que GitHub Pages procese los cambios"
else
    echo "❌ Error al hacer push a GitHub"
    exit 1
fi
