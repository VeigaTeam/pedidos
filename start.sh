#!/bin/bash

echo "🚀 Iniciando Sistema de Pedidos - Academia Veiga"
echo "================================================"

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js primeiro."
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Por favor, instale o npm primeiro."
    exit 1
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Iniciar o servidor de desenvolvimento
echo "🌐 Iniciando servidor de desenvolvimento..."
echo "📍 Acesse: http://localhost:5173"
echo "📍 Painel Admin: http://localhost:5173/admin"
echo ""
echo "Pressione Ctrl+C para parar o servidor"
echo ""

npm run dev
