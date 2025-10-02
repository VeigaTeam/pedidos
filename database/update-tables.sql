-- Script para criar tabelas de marcas e fornecedores
-- Execute este SQL no Supabase Dashboard: https://supabase.com/dashboard/project/eglxlvzkrfjhfexipudj/sql

-- Criar tabela suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela brands
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas na tabela products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(is_active);
CREATE INDEX IF NOT EXISTS idx_brands_supplier ON brands(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);

-- Criar triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir alguns dados de exemplo
INSERT INTO suppliers (name, contact_name, email, phone, address) VALUES
('Fornecedor de Roupas Ltda', 'João Silva', 'joao@fornecedorroupas.com', '(11) 99999-9999', 'Rua das Roupas, 123 - São Paulo/SP'),
('Equipamentos Esportivos S.A', 'Maria Santos', 'maria@equipamentos.com', '(11) 88888-8888', 'Av. dos Esportes, 456 - São Paulo/SP'),
('Distribuidora de Acessórios', 'Pedro Costa', 'pedro@acessorios.com', '(11) 77777-7777', 'Rua dos Acessórios, 789 - São Paulo/SP')
ON CONFLICT DO NOTHING;

INSERT INTO brands (name, description, supplier_id) VALUES
('Veiga Team', 'Marca própria da academia', (SELECT id FROM suppliers WHERE name = 'Fornecedor de Roupas Ltda' LIMIT 1)),
('Nike', 'Marca internacional de esportes', (SELECT id FROM suppliers WHERE name = 'Fornecedor de Roupas Ltda' LIMIT 1)),
('Adidas', 'Marca internacional de esportes', (SELECT id FROM suppliers WHERE name = 'Fornecedor de Roupas Ltda' LIMIT 1)),
('Everlast', 'Marca especializada em equipamentos de boxe', (SELECT id FROM suppliers WHERE name = 'Equipamentos Esportivos S.A' LIMIT 1)),
('Britter', 'Marca de equipamentos de proteção', (SELECT id FROM suppliers WHERE name = 'Distribuidora de Acessórios' LIMIT 1))
ON CONFLICT DO NOTHING;
