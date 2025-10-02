-- Schema para sistema de variações de produtos
-- Este arquivo cria as tabelas necessárias para gerenciar variações de produtos (tamanho, cor, etc.)

-- Tabela para atributos de variação (cores, tamanhos, materiais, etc.)
CREATE TABLE variation_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE, -- Ex: "cor", "tamanho", "material"
    display_name VARCHAR(255) NOT NULL, -- Ex: "Cor", "Tamanho", "Material"
    description TEXT,
    data_type VARCHAR(20) NOT NULL DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'color')),
    is_required BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para valores dos atributos (ex: Azul, Vermelho para cor; P, M, G para tamanho)
CREATE TABLE variation_attribute_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attribute_id UUID NOT NULL REFERENCES variation_attributes(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL, -- Ex: "Azul", "P", "Algodão"
    display_value VARCHAR(255), -- Ex: "Azul Claro", "Pequeno", "100% Algodão"
    color_code VARCHAR(7), -- Código hexadecimal para cores (ex: "#FF0000")
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(attribute_id, value)
);

-- Tabela para variações específicas de produtos
CREATE TABLE product_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(255) UNIQUE, -- Código único da variação (ex: P001-AZUL-P)
    attributes JSONB NOT NULL DEFAULT '{}', -- Combinação de atributos em JSON
    purchase_price DECIMAL(10,2),
    sale_price DECIMAL(10,2),
    profit_margin DECIMAL(5,2),
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para relacionar produtos com atributos obrigatórios
CREATE TABLE product_required_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute_id UUID NOT NULL REFERENCES variation_attributes(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, attribute_id)
);

-- Índices para melhor performance
CREATE INDEX idx_variation_attributes_active ON variation_attributes(is_active);
CREATE INDEX idx_variation_attributes_sort_order ON variation_attributes(sort_order);
CREATE INDEX idx_variation_attribute_values_attribute ON variation_attribute_values(attribute_id);
CREATE INDEX idx_variation_attribute_values_active ON variation_attribute_values(is_active);
CREATE INDEX idx_variation_attribute_values_sort_order ON variation_attribute_values(sort_order);
CREATE INDEX idx_product_variations_product ON product_variations(product_id);
CREATE INDEX idx_product_variations_sku ON product_variations(sku);
CREATE INDEX idx_product_variations_available ON product_variations(is_available);
CREATE INDEX idx_product_required_attributes_product ON product_required_attributes(product_id);
CREATE INDEX idx_product_required_attributes_attribute ON product_required_attributes(attribute_id);

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_variation_attributes_updated_at BEFORE UPDATE ON variation_attributes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variation_attribute_values_updated_at BEFORE UPDATE ON variation_attribute_values
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variations_updated_at BEFORE UPDATE ON product_variations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular margem de lucro nas variações
CREATE OR REPLACE FUNCTION calculate_variation_profit_margin()
RETURNS TRIGGER AS $$
BEGIN
    -- Se não há preços específicos na variação, usar os preços do produto base
    IF NEW.purchase_price IS NULL OR NEW.sale_price IS NULL THEN
        SELECT p.purchase_price, p.sale_price 
        INTO NEW.purchase_price, NEW.sale_price
        FROM products p WHERE p.id = NEW.product_id;
    END IF;
    
    -- Calcular margem de lucro
    IF NEW.sale_price > 0 AND NEW.purchase_price > 0 THEN
        NEW.profit_margin = ((NEW.sale_price - NEW.purchase_price) / NEW.purchase_price) * 100;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_variation_profit_margin_trigger BEFORE INSERT OR UPDATE ON product_variations
    FOR EACH ROW EXECUTE FUNCTION calculate_variation_profit_margin();

-- Função para criar alertas de estoque baixo nas variações
CREATE OR REPLACE FUNCTION check_variation_stock_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se o estoque está baixo ou zerado
    IF NEW.stock <= NEW.min_stock AND NEW.stock > 0 THEN
        -- Verificar se já existe alerta ativo para esta variação
        IF NOT EXISTS (
            SELECT 1 FROM inventory_alerts 
            WHERE product_id = NEW.product_id 
            AND additional_info->>'variation_id' = NEW.id::text
            AND alert_type = 'low_stock' 
            AND is_resolved = false
        ) THEN
            INSERT INTO inventory_alerts (product_id, current_stock, min_stock, alert_type, additional_info)
            VALUES (NEW.product_id, NEW.stock, NEW.min_stock, 'low_stock', jsonb_build_object('variation_id', NEW.id));
        END IF;
    ELSIF NEW.stock = 0 THEN
        -- Verificar se já existe alerta ativo para esta variação
        IF NOT EXISTS (
            SELECT 1 FROM inventory_alerts 
            WHERE product_id = NEW.product_id 
            AND additional_info->>'variation_id' = NEW.id::text
            AND alert_type = 'out_of_stock' 
            AND is_resolved = false
        ) THEN
            INSERT INTO inventory_alerts (product_id, current_stock, min_stock, alert_type, additional_info)
            VALUES (NEW.product_id, NEW.stock, NEW.min_stock, 'out_of_stock', jsonb_build_object('variation_id', NEW.id));
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_variation_stock_alerts_trigger AFTER UPDATE ON product_variations
    FOR EACH ROW EXECUTE FUNCTION check_variation_stock_alerts();

-- Adicionar campo additional_info à tabela inventory_alerts se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory_alerts' 
        AND column_name = 'additional_info'
    ) THEN
        ALTER TABLE inventory_alerts ADD COLUMN additional_info JSONB;
    END IF;
END $$;

-- Atualizar tabela order_items para suportar variações
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'variation_id'
    ) THEN
        ALTER TABLE order_items ADD COLUMN variation_id UUID REFERENCES product_variations(id);
    END IF;
END $$;

-- Dados iniciais para atributos de variação
INSERT INTO variation_attributes (name, display_name, description, data_type, is_required, sort_order) VALUES
('size', 'Tamanho', 'Tamanho da roupa', 'string', true, 1),
('color', 'Cor', 'Cor do produto', 'color', true, 2),
('material', 'Material', 'Tipo de material', 'string', false, 3)
ON CONFLICT (name) DO NOTHING;

-- Dados iniciais para valores de tamanhos
INSERT INTO variation_attribute_values (attribute_id, value, display_value, sort_order) 
SELECT 
    va.id,
    sizes.value,
    CASE 
        WHEN sizes.value = 'P' THEN 'Pequeno'
        WHEN sizes.value = 'M' THEN 'Médio'
        WHEN sizes.value = 'G' THEN 'Grande'
        WHEN sizes.value = 'GG' THEN 'Extra Grande'
        WHEN sizes.value = 'PP' THEN 'Extra Pequeno'
        ELSE sizes.value
    END,
    sizes.sort_order
FROM variation_attributes va
CROSS JOIN (
    VALUES 
    ('PP', 1),
    ('P', 2),
    ('M', 3),
    ('G', 4),
    ('GG', 5),
    ('XG', 6),
    ('XXG', 7)
) AS sizes(value, sort_order)
WHERE va.name = 'size'
ON CONFLICT (attribute_id, value) DO NOTHING;

-- Dados iniciais para cores comuns
INSERT INTO variation_attribute_values (attribute_id, value, display_value, color_code, sort_order)
SELECT 
    va.id,
    colors.value,
    colors.display_value,
    colors.color_code,
    colors.sort_order
FROM variation_attributes va
CROSS JOIN (
    VALUES 
    ('preto', 'Preto', '#000000', 1),
    ('branco', 'Branco', '#FFFFFF', 2),
    ('azul', 'Azul', '#0000FF', 3),
    ('vermelho', 'Vermelho', '#FF0000', 4),
    ('verde', 'Verde', '#00FF00', 5),
    ('amarelo', 'Amarelo', '#FFFF00', 6),
    ('rosa', 'Rosa', '#FFC0CB', 7),
    ('cinza', 'Cinza', '#808080', 8)
) AS colors(value, display_value, color_code, sort_order)
WHERE va.name = 'color'
ON CONFLICT (attribute_id, value) DO NOTHING;

-- Dados iniciais para materiais comuns
INSERT INTO variation_attribute_values (attribute_id, value, display_value, sort_order)
SELECT 
    va.id,
    materials.value,
    materials.display_value,
    materials.sort_order
FROM variation_attributes va
CROSS JOIN (
    VALUES 
    ('algodao', '100% Algodão', 1),
    ('polyester', '100% Poliéster', 2),
    ('modal', 'Modal', 3),
    ('mixed', 'Algodão + Poliéster', 4)
) AS materials(value, display_value, sort_order)
WHERE va.name = 'material'
ON CONFLICT (attribute_id, value) DO NOTHING;
