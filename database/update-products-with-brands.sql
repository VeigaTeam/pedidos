-- Script para atualizar produtos existentes com marcas baseado na lista fornecida
-- Execute este SQL após criar as tabelas suppliers e brands

-- Primeiro, vamos inserir as marcas Maximum e Pulser se não existirem
INSERT INTO suppliers (name, contact_name, email, phone) VALUES
('Maximum Sports', 'Contato Maximum', 'contato@maximum.com', '(11) 99999-0001'),
('Pulser Sports', 'Contato Pulser', 'contato@pulser.com', '(11) 99999-0002')
ON CONFLICT (name) DO NOTHING;

INSERT INTO brands (name, description, supplier_id) VALUES
('Maximum', 'Marca Maximum Sports', (SELECT id FROM suppliers WHERE name = 'Maximum Sports' LIMIT 1)),
('Pulser', 'Marca Pulser Sports', (SELECT id FROM suppliers WHERE name = 'Pulser Sports' LIMIT 1))
ON CONFLICT (name) DO NOTHING;

-- Atualizar produtos com marca Maximum
UPDATE products SET 
  brand_id = (SELECT id FROM brands WHERE name = 'Maximum' LIMIT 1),
  supplier_id = (SELECT id FROM suppliers WHERE name = 'Maximum Sports' LIMIT 1)
WHERE name IN (
  'Luva MXM BLUE 10 Oz',
  'Luva CBLACK 10 Oz',
  'Luva CWhite 10 Oz',
  'Luva MXM ALL COLORS',
  'Luva CBLACK / CWHITE',
  'Luva OzGold / OzPrata',
  'Luva ProOld 10 Oz',
  'Luva Pro',
  'Luva Popó Series',
  'Caneleira Classic',
  'Caneleira Pro',
  'Bandagem 3 Metros',
  'Bandagem 5 Metros',
  'Protetor Bucal Simples',
  'Protetor Bucal Duplo',
  'Higienizador 300ml'
);

-- Atualizar produtos com marca Pulser
UPDATE products SET 
  brand_id = (SELECT id FROM brands WHERE name = 'Pulser' LIMIT 1),
  supplier_id = (SELECT id FROM suppliers WHERE name = 'Pulser Sports' LIMIT 1)
WHERE name IN (
  'Luva PU-Sintetico 14/16 Oz',
  'Luva PU-Sintetico 10/12 Oz',
  'Luva Couro c/ Palma Microfibra 14/16 Oz',
  'Luva Couro c/ Palma Microfibra 10/12 Oz',
  'Luva Couro 14/16 Oz Profissional',
  'Luva Couro 10/12 Oz Profissional',
  'Luva MicroFibra 14/16 Oz Profissional',
  'Luva MicroFibra 10/12 Oz Profissional',
  'Caneleira 35mm M e G',
  'Caneleira 20mm M e G',
  'Caneleira 30mm M e G Tira Ajustavel',
  'Caneleira 30mm M e G Bordada',
  'Protetor Bucal sem Caixa (Britter)',
  'Protetor Bucal com Caixa (Britter)',
  'Bandagem Elastica 5m',
  'Bandagem Elastica 4m',
  'Bandagem Elastica 3m'
);

-- Verificar produtos que foram atualizados
SELECT 
  p.name as produto,
  b.name as marca,
  s.name as fornecedor
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.brand_id IS NOT NULL
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

-- Verificar produtos sem marca (caso existam)
SELECT 
  name as produto_sem_marca,
  category as categoria
FROM products 
WHERE brand_id IS NULL
ORDER BY name;
