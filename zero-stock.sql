-- Script SQL para zerar o estoque de todos os produtos
-- Execute este script no painel do Supabase ou em qualquer cliente SQL

-- Mostrar produtos antes da atualização
SELECT id, name, stock, updated_at 
FROM products 
ORDER BY name;

-- Zerar o estoque de todos os produtos
UPDATE products 
SET stock = 0, updated_at = NOW();

-- Verificar se o estoque foi zerado
SELECT id, name, stock, updated_at 
FROM products 
ORDER BY name;

-- Verificar se algum produto ainda tem estoque (deve retornar 0 linhas)
SELECT id, name, stock 
FROM products 
WHERE stock > 0;
