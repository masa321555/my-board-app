#!/bin/bash

# React Query (TanStack Query) のインストール
echo "Installing React Query..."
npm install @tanstack/react-query @tanstack/react-query-devtools

# Socket.io クライアントのインストール（既にリストにあるが念のため）
echo "Installing Socket.io client..."
npm install socket.io-client

# 開発用ツール
echo "Installing development tools..."
npm install --save-dev @faker-js/faker

echo "Installation complete!"