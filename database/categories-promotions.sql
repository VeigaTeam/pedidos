-- =====================================================
-- SISTEMA DE CATEGORIAS E PROMOÇÕES
-- =====================================================

-- =====================================================
-- 1. CATEGORIAS
-- =====================================================

-- Criar tabela de categorias
DROP TABLE IF EXISTS categories CASCADE;
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT categories_name_unique UNIQUE (name)
);

-- Índices para categorias
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

-- =====================================================
-- 2. PROMOÇÕES
-- =====================================================

-- Criar tabela de promoções
DROP TABLE IF EXISTS promotions CASCADE;
CREATE TABLE promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    promotion_type VARCHAR(20) NOT NULL CHECK (promotion_type IN ('percentage', 'fixed', 'buy_x_get_y')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_quantity INTEGER DEFAULT 1,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT promotions_dates_check CHECK (end_date > start_date),
    CONSTRAINT promotions_discount_value_check CHECK (discount_value >= 0)
);

-- Índices para promoções
CREATE INDEX idx_promotions_type ON promotions(promotion_type);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_promotions_active ON promotions(is_active);

-- =====================================================
-- 3. PRODUTOS EM PROMOÇÃO
-- =====================================================

-- Criar tabela de associação produto-promoção
DROP TABLE IF EXISTS product_promotions CASCADE;
CREATE TABLE product_promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT product_promotions_unique UNIQUE (product_id, promotion_id)
);

-- Índices para produto-promoções
CREATE INDEX idx_product_promotions_product ON product_promotions(product_id);
CREATE INDEX idx_product_promotions_promotion ON product_promotions(promotion_id);

-- =====================================================
-- 4. CATEGORIZAÇÃO DE PRODUTOS
-- =====================================================

-- Adicionar categoria_id aos produtos se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE products ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
        CREATE INDEX idx_products_category ON products(category_id);
    END IF;
END $$;

-- =====================================================
-- 5. PRÉ-VENDAS
-- =====================================================

-- Adicionar campos de pré-venda aos produtos se não existirem
DO $$
BEGIN
    -- Campo para marcar como pré-venda
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'is_pre_sale'
    ) THEN
        ALTER TABLE products ADD COLUMN is_pre_sale BOOLEAN DEFAULT false;
        CREATE INDEX idx_products_pre_sale ON products(is_pre_sale);
    END IF;
    
    -- Campo para preço original (antes da promoção)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'original_price'
    ) THEN
        ALTER TABLE products ADD COLUMN original_price DECIMAL(10,2);
        CREATE INDEX idx_products_original_price ON products(original_price);
    END IF;
    
    -- Campo para marca o produto como fora de estoque
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'auto_pre_sale_when_out_of_stock'
    ) THEN
        ALTER TABLE products ADD COLUMN auto_pre_sale_when_out_of_stock BOOLEAN DEFAULT false;
        CREATE INDEX idx_products_auto_pre_sale ON products(auto_pre_sale_when_out_of_stock);
    END IF;
END $$;

-- =====================================================
-- 6. FUNÇÕES ÚTEIS
-- =====================================================

-- Função para aplicar promoção a um produto
CREATE OR REPLACE FUNCTION apply_promotion_to_product(
    p_product_id UUID,
    p_promotion_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    promotion_record promotions%ROWTYPE;
    current_price DECIMAL(10,2);
    original_price DECIMAL(10,2);
    discount_amount DECIMAL(10,2);
    new_price DECIMAL(10,2);
BEGIN
    -- Buscar dados da promoção
    SELECT * INTO promotion_record 
    FROM promotions 
    WHERE id = p_promotion_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Promoção não encontrada ou inativa';
    END IF;
    
    -- Verificar se a promoção está válida
    IF NOW() < promotion_record.start_date OR NOW() > promotion_record.end_date THEN
        RAISE EXCEPTION 'Promoção fora do período válido';
    END IF;
    
    -- Verificar limite de uso
    IF promotion_record.max_uses IS NOT NULL AND promotion_record.current_uses >= promotion_record.max_uses THEN
        RAISE EXCEPTION 'Promoção atingiu limite de uso';
    END IF;
    
    -- Buscar preço atual do produto
    SELECT price INTO current_price FROM products WHERE id = p_product_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Produto não encontrado';
    END IF;
    
    -- Salvar preço original se não existir
    SELECT COALESCE(original_price, current_price) INTO original_price FROM products WHERE id = p_product_id;
    
    -- Calcular desconto
    CASE promotion_record.promotion_type
        WHEN 'percentage' THEN
            discount_amount := original_price * (promotion_record.discount_value / 100);
        WHEN 'fixed' THEN
            discount_amount := promotion_record.discount_value;
        ELSE
            RAISE EXCEPTION 'Tipo de promoção não suportado';
    END CASE;
    
    -- Calcular novo preço (não pode ser negativo)
    new_price := GREATEST(original_price - discount_amount, 0);
    
    -- Aplicar desconto ao produto
    UPDATE products 
    SET 
        price = new_price,
        original_price = original_price,
        updated_at = NOW()
    WHERE id = p_product_id;
    
    -- Associar produto com promoção
    INSERT INTO product_promotions (product_id, promotion_id)
    VALUES (p_product_id, p_promotion_id)
    ON CONFLICT (product_id, promotion_id) DO NOTHING;
    
    -- Incrementar uso da promoção
    UPDATE promotions 
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE id = p_promotion_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Função para remover promoção de um produto
CREATE OR REPLACE FUNCTION remove_promotion_from_product(
    p_product_id UUID,
    p_promotion_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    -- Restaurar preço original
    UPDATE products 
    SET 
        price = COALESCE(original_price, price),
        original_price = NULL,
        updated_at = NOW()
    WHERE id = p_product_id AND original_price IS NOT NULL;
    
    -- Remover associação produto-promoção
    DELETE FROM product_promotions 
    WHERE product_id = p_product_id AND promotion_id = p_promotion_id;
    
    -- Decrementar uso da promoção
    UPDATE promotions 
    SET current_uses = GREATEST(current_uses - 1, 0),
        updated_at = NOW()
    WHERE id = p_promotion_id AND current_uses > 0;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Função para marcar produtos automaticamente como pré-venda quando estoque zerado
CREATE OR REPLACE FUNCTION auto_mark_pre_sale_when_out_of_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Se estoque chegou a zero e produto tem auto_pre_sale_when_out_of_stock = true
    IF NEW.total_quantity = 0 AND NEW.total_quantity < OLD.total_quantity THEN
        UPDATE products 
        SET is_pre_sale = true,
            updated_at = NOW()
        WHERE id = NEW.product_id 
        AND auto_pre_sale_when_out_of_stock = true 
        AND is_pre_sale = false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para marcar produtos como pré-venda quando estoque zerado
DROP TRIGGER IF EXISTS trigger_auto_pre_sale_out_of_stock 
ON inventory_lots CASCADE;

CREATE TRIGGER trigger_auto_pre_sale_out_of_stock
    AFTER UPDATE OF total_quantity ON inventory_lots
    FOR EACH ROW 
    WHEN (NEW.total_quantity = 0 AND OLD.total_quantity > 0)
    EXECUTE FUNCTION auto_mark_pre_sale_when_out_of_stock();

-- =====================================================
-- 7. TRIGGERS DE AUDITORIA
-- =====================================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS trigger_update_categories_updated_at ON categories;
CREATE TRIGGER trigger_update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_promotions_updated_at ON promotions;
CREATE TRIGGER trigger_update_promotions_updated_at
    BEFORE UPDATE ON promotions
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. DADOS INICIAIS
-- =====================================================

-- Inserir categorias padrão
INSERT INTO categories (name, description, sort_order) VALUES
('Eletrônicos', 'Produtos eletrônicos e tecnológicos', 1),
('Roupas', 'Vestimentas e acessórios', 2),
('Casa e Jardim', 'Produtos para casa e jardinagem', 3),
('Esportes', 'Artigos esportivos e fitness', 4),
('Livros', 'Livros e material educativo', 5),
('Beleza', 'Produtos de beleza e cuidados pessoais', 6),
('Automotivo', 'Peças e acessórios automotivos', 7),
('Outros', 'Outros produtos diversos', 8)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- ✅ MIGRAÇÃO CONCLUÍDA!
-- =====================================================

SELECT '🎉 Sistema de categorias e promoções criado com sucesso!' as status,
       'Execute agora os componentes React' as next_step;
