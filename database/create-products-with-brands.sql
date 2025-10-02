-- Script para criar produtos com marcas baseado na lista fornecida
-- Execute este SQL no Supabase Dashboard: https://supabase.com/dashboard/project/eglxlvzkrfjhfexipudj/sql

-- Primeiro, vamos inserir as marcas Maximum e Pulser se não existirem
INSERT INTO suppliers (name, contact_name, email, phone) VALUES
('Maximum Sports', 'Contato Maximum', 'contato@maximum.com', '(11) 99999-0001'),
('Pulser Sports', 'Contato Pulser', 'contato@pulser.com', '(11) 99999-0002')
ON CONFLICT (name) DO NOTHING;

INSERT INTO brands (name, description, supplier_id) VALUES
('Maximum', 'Marca Maximum Sports', (SELECT id FROM suppliers WHERE name = 'Maximum Sports' LIMIT 1)),
('Pulser', 'Marca Pulser Sports', (SELECT id FROM suppliers WHERE name = 'Pulser Sports' LIMIT 1))
ON CONFLICT (name) DO NOTHING;

-- Criar produtos da marca Maximum
INSERT INTO products (name, category, description, brand_id, supplier_id, purchase_price, sale_price, stock, min_stock, is_active) VALUES
('Luva MXM BLUE 10 Oz', 'equipamentos', 'Luva Iniciante 10 Oz cor azul', (SELECT id FROM brands WHERE name = 'Maximum'), (SELECT id FROM suppliers WHERE name = ' Maximum Sports'), 80.00, 150.00, 0, 5, true),
('Luva CBLACK 10 Oz', 'equipamentos', 'Luva Iniciante 10 Oz cor preto', (SELECT id FROM brands WHERE name = 'Maximum'), (SELECT id FROM suppliers WHERE name = ' Maximum Sports'), 80.00, 150.00, 0, 5, true),
('Luva CWhite 10 Oz', 'equipamentos', 'Luva Iniciante 10 Oz cor branca', (SELECT id FROM brands WHERE name = 'Maximum'), (SELECT id FROM suppliers WHERE name = ' Maximum Sports'), 80.00, 150.00, 0, 5, true),
('Luva MXM ALL COLORS', 'equipamentos', 'Luva Iniciante todas as cores', (SELECT id FROM brands WHERE name = 'Maximum'), (SELECT id FROM suppliers WHERE name = ' Maximum Sports'), 80.00, 150.00, 0, 5, true),
('Luva CBLACK / CWHITE', 'equipamentos', 'Luva Iniciante preto e branco', (SELECT id FROM brands WHERE name = 'Maximum'), (SELECT id FROM suppliers WHERE name = ' Maximum Sports'), 80.00, 150.00, 0, 5, true),
('Luva OzGold / OzPrata', 'equipamentos', 'Luva Intermediaria dourada e prata', (SELECT id FROM brands WHERE name = 'Maximum'), (SELECT id FROM suppliers WHERE name = ' Maximum Sports'), 80.00, 150.00, 0, 5, true),
('Luva ProOld 10 Oz', 'equipamentos', 'Luva Profissional 10 Oz vintage', (SELECT id FROM brands WHERE name = 'Maximum'), (SELECT id FROM suppliers WHERE name = ' Maximum Sports'), 80.00, 150.00, 0, 5, true),
('Luva Pro', 'equipamentos', 'Luva Profissional série', (SELECT id FROM brands WHERE name = 'Maximum'), (SELECT id FROM suppliers WHERE name = ' Maximum Sports'), 80.00, 150.00, 0, 5, true),
('Luva Popó Series', 'equipamentos', 'Luva Profissional série Popó', (SELECT id FROM brands WHERE name = 'Maximum'), (SELECT id FROM suppliers WHERE name = ' Maximum Sports'), 80.00, 150.00, 0, 5, true),
('Caneleira Classic', 'equipamentos', 'Caneleira clássica', (SELECT id FROM brands WHERE name = 'Maximum'), (SELECT id FROM suppliers WHERE name = ' Maximum Sports'), 60.00, 120.00, 0, 5, true),
('Caneleira Pro', 'equipamentos', 'Caneleira profissional', (SELECT id FROM brands WHERE name = 'Maximum'), (SELECT id FROM suppliers WHERE name = ' Maximum Sports'), 60.00, 120.00, 0, 5, true),
('Bandagem 3 Metros', 'equipamentos', 'Bandagem de 3 metros', (SELECT id FROM brands WHERE name = 'Maximum'), (SELECT id FROM suppliers WHERE name = ' Maximum Sports'), 8.00, 20.00, 0, 10, true),
('Bandagem 5 Metros', 'equipamentos', 'Bandagem de 5 metros', (SELECT id FROM brands WHERE name = 'Maximum'), (SELECT id FROM suppliers WHERE name = ' Maximum Sports'), 8.00, 20.00, 0, 10, true),
('Protetor Bucal Simples', 'equipamentos', 'Protetor Bucal simples', (SELECT id FROM brands WHERE name = 'Maximum'), (SELECT id FROM suppliers WHERE name = ' Maximum Sports'), 15.00, 35.00, 0, 10, true),
('Protetor Bucal Duplo', 'equipamentos', 'Protetor Bucal duplo', (SELECT id FROM brands WHERE name = 'Maximum'), (SELECT id FROM suppliers WHERE name = ' Maximum Sports'), 15.00, 35.00, 0, 10, true),
('Higienizador 300ml', 'equipamentos', 'Higienizador 300ml', (SELECT id FROM brands WHERE name = 'Maximum'), (SELECT id FROM suppliers WHERE name = ' Maximum Sports'), 20.00, 40.00, 0, 5, true);

-- Criar produtos da marca Pulser
INSERT INTO products (name, category, description, brand_id, supplier_id, purchase_price, sale_price, stock, min_stock, is_active) VALUES
('Luva PU-Sintetico 14/16 Oz', 'equipamentos', 'Luva Iniciante PU Sintético 14/16 Oz', (SELECT id FROM brands WHERE name = 'Pulser'), (SELECT id FROM suppliers WHERE name = 'Pulser Sports'), 80.00, 150.00, 0, 5, true),
('Luva PU-Sintetico 10/12 Oz', 'equipamentos', 'Luva Iniciante PU Sintético 10/12 Oz', (SELECT id FROM brands WHERE name = 'Pulser'), (SELECT id FROM suppliers WHERE name = 'Pulser Sports'), 80.00, 150.00, 0, 5, true),
('Luva Couro c/ Palma Microfibra 14/16 Oz', 'equipamentos', 'Luva Profissional Couro c/ Palma Microfibra 14/16 Oz', (SELECT id FROM brands WHERE name = 'Pulser'), (SELECT id FROM suppliers WHERE name = 'Pulser Sports'), 80.00, 150.00, 0, 5, true),
('Luva Couro c/ Palma Microfibra 10/12 Oz', 'equipamentos', 'Luva Profissional Couro c/ Palma Microfibra 10/12 Oz', (SELECT id FROM brands WHERE name = 'Pulser'), (SELECT id FROM suppliers WHERE name = 'Pulser Sports'), 80.00, 150.00, 0, 5, true),
('Luva Couro 14/16 Oz Profissional', 'equipamentos', 'Luva Profissional Couro 14/16 Oz', (SELECT id FROM brands WHERE name = 'Pulser'), (SELECT id FROM suppliers WHERE name = 'Pulser Sports'), 80.00, 150.00, 0, 5, true),
('Luva Couro 10/12 Oz Profissional', 'equipamentos', 'Luva Profissional Couro 10/12 Oz', (SELECT id FROM brands WHERE name = 'Pulser'), (SELECT id FROM suppliers WHERE name = 'Pulser Sports'), 80.00, 150.00, 0, 5, true),
('Luva MicroFibra 14/16 Oz Profissional', 'equipamentos', 'Luva Profissional MicroFibra 14/16 Oz', (SELECT id FROM brands WHERE name = 'Pulser'), (SELECT id FROM suppliers WHERE name = 'Pulser Sports'), 80.00, 150.00, 0, 5, true),
('Luva MicroFibra 10/12 Oz Profissional', 'equipamentos', 'Luva Profissional MicroFibra 10/12 Oz', (SELECT id FROM brands WHERE name = 'Pulser'), (SELECT id FROM suppliers WHERE name = 'Pulser Sports'), 80.00, 150.00, 0, 5, true),
('Caneleira 35mm M e G', 'equipamentos', 'Caneleira 35mm tamanhos M e G', (SELECT id FROM brands WHERE name = 'Pulser'), (SELECT id FROM suppliers WHERE name = 'Pulser Sports'), 60.00, 120.00, 0, 5, true),
('Caneleira 20mm M e G', 'equipamentos', 'Caneleira 20mm tamanhos M e G', (SELECT id FROM brands WHERE name = 'Pulser'), (SELECT id FROM suppliers WHERE name = 'Pulser Sports'), 60.00, 120.00, 0, 5, true),
('Caneleira 30mm M e G Tira Ajustavel', 'equipamentos', 'Caneleira 30mm M e G c/ tira ajustável', (SELECT id FROM brands WHERE name = 'Pulser'), (SELECT id FROM suppliers WHERE name = 'Pulser Sports'), 60.00, 120.00, 0, 5, true),
('Caneleira 30mm M e G Bordada', 'equipamentos', 'Caneleira 30mm M e G bordada', (SELECT id FROM brands WHERE name = 'Pulser'), (SELECT id FROM suppliers WHERE name = 'Pulser Sports'), 60.00, 120.00, 0, 5, true),
('Protetor Bucal sem Caixa (Britter)', 'equipamentos', 'Protetor Bucal sem caixa marca Britter', (SELECT id FROM brands WHERE name = 'Pulser'), (SELECT id FROM suppliers WHERE name = 'Pulser Sports'), 15.00, 35.00, 0, 10, true),
('Protetor Bucal com Caixa (Britter)', 'equipamentos', 'Protetor Bucal com caixa marca Britter', (SELECT id FROM brands WHERE name = 'Pulser'), (SELECT id FROM suppliers WHERE name = 'Pulser Sports'), 15.00, 35.00, 0, 10, true),
('Bandagem Elastica 5m', 'equipamentos', 'Bandagem Elástica 5 metros', (SELECT id FROM brands WHERE name = 'Pulser'), (SELECT id FROM suppliers WHERE name = 'Pulser Sports'), 8.00, 20.00, 0, 10, true),
('Bandagem Elastica 4m', 'equipamentos', 'Bandagem Elástica 4 metros', (SELECT id FROM brands WHERE name = 'Pulser'), (SELECT id FROM suppliers WHERE name = 'Pulser Sports'), 8.00, 20.00, 0, 10, true),
('Bandagem Elastica 3m', 'equipamentos', 'Bandagem Elástica 3 metros', (SELECT id FROM brands WHERE name = 'Pulser Sports'), (SELECT id FROM suppliers WHERE name = 'Pulser Sports'), 8.00, 20.00, 0, 10, true);

-- Verificar produtos criados
SELECT 
  p.name as produto,
  b.name as marca,
  s.name as fornecedor,
  p.category as categoria,
  p.purchase_price as preco_compra,
  p.sale_price as preco_venda
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
ORDER BY b.name, p.name;

-- Contar produtos por marca
SELECT 
  b.name as marca,
  COUNT(p.id) as total_produtos,
  s.name as fornecedor
FROM brands b
LEFT JOIN products p ON b.id = p.brand_id
LEFT JOIN suppliers s ON b.supplier_id = s.id
GROUP BY b.name, s.name
ORDER BY b.name;
