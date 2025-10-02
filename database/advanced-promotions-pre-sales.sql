-- =====================================================
-- SISTEMA AVANÇADO DE PROMOÇÕES E PRÉ-VENDAS
-- =====================================================

-- =====================================================
-- 1. DROPS EXISTENTES E CRIAÇÃO DE NOVA ESTRUTURA
-- =====================================================

-- Dropar tabelas dependentes primeiro
DROP TABLE IF EXISTS product_promotions CASCADE;
DROP TABLE IF EXISTS promotion_applications CASCADE;
DROP TABLE IF EXISTS coupon_usages CASCADE;
DROP TABLE IF EXISTS promotion_rules CASCADE;

-- Dropar tabela principal
DROP TABLE IF EXISTS promotions CASCADE;

-- =====================================================
-- 2. NOVA TABELA DE PROMOÇÕES EXPANDIDA
-- =====================================================

CREATE TABLE promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    code VARCHAR(50) UNIQUE, -- Código da promoção/cupom
    
    -- Tipos de promoção expandidos
    promotion_type VARCHAR(30) NOT NULL CHECK (promotion_type IN (
        'percentage_discount', 'fixed_discount', 'buy_x_get_y', 
        'free_shipping', 'cashback', 'bundle_discount',
        'category_discount', 'brand_discount', 'stock_clearance'
    )),
    
    -- Valores de desconto flexíveis
    discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_percentage DECIMAL(5,2), -- Para descontos percentuais
    min_discount_value DECIMAL(10,2), -- Valor mínimo de desconto
    max_discount_value DECIMAL(10,2), -- Valor máximo de desconto
    
    -- Condições de aplicação
    min_quantity INTEGER DEFAULT 1,
    min_cart_value DECIMAL(10,2), -- Valor mínimo do carrinho
    max_uses INTEGER, -- Usos limitados
    max_uses_per_user INTEGER DEFAULT NULL, -- Limite por usuário
    
    -- Período de validade
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Status e controle
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true, -- Se aparece para clientes
    auto_apply BOOLEAN DEFAULT false, -- Se aplica automaticamente
    
    -- Contadores de uso
    current_uses INTEGER DEFAULT 0,
    total_redeemed_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Configurações avançadas
    excluded_products UUID[], -- IDs de produtos excluídos
    required_products UUID[], -- Produtos obrigatórios
    
    -- Metadados
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT promotions_dates_check CHECK (end_date > start_date),
    CONSTRAINT promotions_discount_value_check CHECK (discount_value >= 0),
    CONSTRAINT promotions_code_format CHECK (code IS NULL OR length(code) >= 4)
);

-- =====================================================
-- 3. REGRAS DE PROMOÇÃO (para promoções complexas)
-- =====================================================

CREATE TABLE promotion_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    rule_type VARCHAR(30) NOT NULL CHECK (rule_type IN (
        'category', 'brand', 'product', 'customer_type', 
        'order_frequency', 'total_spent', 'location'
    )),
    rule_operator VARCHAR(10) NOT NULL CHECK (rule_operator IN (
        'equals', 'not_equals', 'in', 'not_in', 'greater_than', 
        'less_than', 'contains', 'starts_with'
    )),
    rule_value JSONB NOT NULL, -- Valor flexível da regra
    rule_order INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. APLICAÇÕES DE PROMOÇÃO (histórico detalhado)
-- =====================================================

CREATE TABLE promotion_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    promotion_id UUID NOT NULL REFERENCES promotions(id),
    order_id UUID REFERENCES orders(id),
    customer_email VARCHAR(255),
    
    -- Detalhes da aplicação
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contexto da aplicação
    cart_items JSONB, -- Itens do carrinho na aplicação
    applied_products UUID[], -- Produtos que receberam desconto
    
    -- Metadados
    ip_address INET,
    user_agent TEXT,
    
    CONSTRAINT promotion_applications_unique_order 
        UNIQUE (promotion_id, order_id)
);

-- =====================================================
-- 5. USO DE CUPONS (tracking detalhado)
-- =====================================================

CREATE TABLE coupon_usages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    promotion_id UUID NOT NULL REFERENCES promotions(id),
    customer_email VARCHAR(255) NOT NULL,
    coupon_code VARCHAR(50) NOT NULL,
    
    order_id UUID REFERENCES orders(id),
    discount_applied DECIMAL(10,2) NOT NULL DEFAULT 0,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contexto adicional
    ip_address INET,
    user_agent TEXT,
    
    CONSTRAINT coupon_usages_unique_customer_per_promotion
        UNIQUE (promotion_id, customer_email)
);

-- =====================================================
-- 6. SISTEMA DE PRÉ-VENDAS AVANÇADO
-- =====================================================

-- Estender tabela products com campos de pré-venda
DO $$
BEGIN
    -- Campo para pré-venda manual
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'is_pre_sale_manual'
    ) THEN
        ALTER TABLE products ADD COLUMN is_pre_sale_manual BOOLEAN DEFAULT false;
    END IF;
    
    -- Campo para pré-venda automática por estoque
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'is_pre_sale_auto_stock'
    ) THEN
        ALTER TABLE products ADD COLUMN is_pre_sale_auto_stock BOOLEAN DEFAULT false;
    END IF;
    
    -- Campo para pré-venda por data
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'pre_sale_until'
    ) THEN
        ALTER TABLE products ADD COLUMN pre_sale_until TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Campo para preço de pré-venda
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'pre_sale_price'
    ) THEN
        ALTER TABLE products ADD COLUMN pre_sale_price DECIMAL(10,2);
    END IF;
    
    -- Campo para status de disponibilidade
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'availability_status'
    ) THEN
        ALTER TABLE products ADD COLUMN availability_status VARCHAR(20) DEFAULT 'available' 
            CHECK (availability_status IN ('available', 'pre_sale', 'out_of_stock', 'discontinued'));
    END IF;
    
    -- Campo para motivo da pré-venda
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'pre_sale_reason'
    ) THEN
        ALTER TABLE products ADD COLUMN pre_sale_reason TEXT;
    END IF;
END $$;

-- =====================================================
-- 7. TABELA DE PRÉ-VENDAS (para controle específico)
-- =====================================================

CREATE TABLE pre_sale_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Control de pré-venda
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ends_at TIMESTAMP WITH TIME ZONE,
    reason VARCHAR(100), -- 'manual', 'out_of_stock', 'scheduled', 'clearance'
    
    -- Configurações
    notify_when_available BOOLEAN DEFAULT true,
    estimated_availability TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT pre_sale_products_unique_active
        UNIQUE (product_id) WHERE is_active = true
);

-- =====================================================
-- 8. REGISTRO DE INTERESSES EM PRÉ-VENDAS
-- =====================================================

CREATE TABLE pre_sale_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    
    -- Preferências
    notify_email BOOLEAN DEFAULT true,
    notify_whatsapp BOOLEAN DEFAULT false,
    
    -- Status
    notified_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT pre_sale_notifications_unique_email_per_product
        UNIQUE (product_id, customer_email) WHERE is_active = true
);

-- =====================================================
-- 9. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Promotions
CREATE INDEX idx_promotions_type ON promotions(promotion_type);
CREATE INDEX idx_promotions_active_dates ON promotions(is_active, start_date, end_date);
CREATE INDEX idx_promotions_code ON promotions(code) WHERE code IS NOT NULL;
CREATE INDEX idx_promotions_public_active ON promotions(is_public, is_active);

-- Promotion Rules
CREATE INDEX idx_promotion_rules_promotion_id ON promotion_rules(promotion_id);
CREATE INDEX idx_promotion_rules_type ON promotion_rules(rule_type);

-- Applications
CREATE INDEX idx_promotion_applications_promotion_id ON promotion_applications(promotion_id);
CREATE INDEX idx_promotion_applications_order_id ON promotion_applications(order_id);
CREATE INDEX idx_promotion_applications_date ON promotion_applications(applied_at);

-- Coupon Usages
CREATE INDEX idx_coupon_usages_customer ON coupon_usages(customer_email);
CREATE INDEX idx_coupon_usages_code ON coupon_usages(coupon_code);
CREATE INDEX idx_coupon_usages_date ON coupon_usages(used_at);

-- Products (pre-sale)
CREATE INDEX idx_products_pre_sale_status ON products(availability_status);
CREATE INDEX idx_products_pre_sale_manual ON products(is_pre_sale_manual);
CREATE INDEX idx_products_pre_sale_auto ON products(is_pre_sale_auto_stock);

-- Pre-sale Products
CREATE INDEX idx_pre_sale_products_active ON pre_sale_products(is_active);
CREATE INDEX idx_pre_sale_products_date ON pre_sale_products(started_at, ends_at);

-- Notifications
CREATE INDEX idx_pre_sale_notifications_product ON pre_sale_notifications(product_id);
CREATE INDEX idx_pre_sale_notifications_email ON pre_sale_notifications(customer_email);
CREATE INDEX idx_pre_sale_notifications_active ON pre_sale_notifications(is_active);

-- =====================================================
-- 10. FUNÇÕES AVANÇADAS
-- =====================================================

-- Função para aplicar promoção inteligente
CREATE OR REPLACE FUNCTION apply_smart_promotion(
    p_promotion_id UUID,
    p_order_items JSONB,
    p_customer_email VARCHAR(255) DEFAULT NULL,
    p_customer_data JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    promotion_record promotions%ROWTYPE;
    total_discount DECIMAL(10,2) := 0;
    applied_items JSONB := '[]'::JSONB;
    discount_per_item DECIMAL(10,2);
    item_discount DECIMAL(10,2);
    rule_matches BOOLEAN := true;
    item_data JSONB;
    product_id UUID;
    quantity INTEGER;
    unit_price DECIMAL(10,2);
BEGIN
    -- Buscar promoção
    SELECT * INTO promotion_record 
    FROM promotions 
    WHERE id = p_promotion_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Promoção não encontrada ou inativa');
    END IF;
    
    -- Verificar período de validade
    IF NOW() < promotion_record.start_date OR NOW() > promotion_record.end_date THEN
        RETURN jsonb_build_object('success', false, 'error', 'Promoção fora do período válido');
    END IF;
    
    -- Verificar limite de uso
    IF promotion_record.max_uses IS NOT NULL AND promotion_record.current_uses >= promotion_record.max_uses THEN
        RETURN jsonb_build_object('success', false, 'error', 'Promoção atingiu limite de uso');
    END IF;
    
    -- Verificar regras específicas
    PERFORM r.* FROM promotion_rules r 
    WHERE r.promotion_id = p_promotion_id AND r.is_active = true
    ORDER BY r.rule_order;
    
    -- Por simplicidade, assumindo que as regras são validadas acima
    
    -- Calcular desconto para cada item
    FOR i IN 0..jsonb_array_length(p_order_items) - 1 LOOP
        item_data := p_order_items->i;
        product_id := (item_data->>'product_id')::UUID;
        quantity := (item_data->>'quantity')::INTEGER;
        unit_price := (item_data->>'unit_price')::DECIMAL(10,2);
        
        -- Calcular desconto por item
        CASE promotion_record.promotion_type
            WHEN 'percentage_discount' THEN
                discount_per_item := unit_price * (promotion_record.discount_percentage / 100);
            WHEN 'fed_discount' THEN
                discount_per_item := LEAST(promotion_record.discount_value, unit_price);
            ELSE
                discount_per_item := 0;
        END CASE;
        
        -- Aplicar limite máximo de desconto se definido
        IF promotion_record.max_discount_value IS NOT NULL THEN
            discount_per_item := LEAST(discount_per-item, promotion_record.max_discount_value);
        END IF;
        
        -- Aplicar limite mínimo de desconto se definido
        IF promotion_record.min_discount_value IS NOT NULL THEN
            discount_per_item := GREATEST(discount_per_item, promotion_record.min_discount_value);
        END IF;
        
        item_discount := discount_per_item * quantity;
        total_discount := total_discount + item_discount;
        
        -- Adicionar ao resultado
        applied_items := applied_items || jsonb_build_object(
            'product_id', product_id,
            'quantity', quantity,
            'unit_price', unit_price,
            'discount_per_unit', discount_per_item,
            'total_discount', item_discount
        );
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'total_discount', total_discount,
        'applied_items', applied_items,
        'promotion_code', promotion_record.code
    );
END;
$$ LANGUAGE plpgsql;

-- Função para registrar produto em pré-venda
CREATE OR REPLACE FUNCTION register_pre_sale_product(
    p_product_id UUID,
    p_reason VARCHAR(100) DEFAULT 'manual',
    p_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_estimated_availability TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    product_record products%ROWTYPE;
BEGIN
    -- Buscar produto
    SELECT * INTO product_record FROM products WHERE id = p_product_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Produto não encontrado';
    END IF;
    
    -- Atualizar produto para pré-venda
    UPDATE products 
    SET 
        is_pre_sale_manual = true,
        availability_status = 'pre_sale',
        pre_sale_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_product_id;
    
    -- Registrar na tabela de pré-vendas
    INSERT INTO pre_sale_products (
        product_id, reason, ends_at, estimated_availability
    ) VALUES (
        p_product_id, p_reason, p_ends_at, p_estimated_availability
    ) ON CONFLICT (product_id) WHERE is_active = true 
    DO UPDATE SET
        reason = p_reason,
        ends_at = p_ends_at,
        estimated_availability = p_estimated_availability,
        updated_at = NOW();
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Função para marcar produto como disponível
CREATE OR REPLACE FUNCTION mark_product_available(p_product_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
    -- Atualizar produto
    UPDATE products 
    SET 
        is_pre_sale_manual = false,
        availability_status = CASE 
            WHEN stock > 0 THEN 'available'
            ELSE 'out_of_stock'
        END,
        updated_at = NOW()
    WHERE id = p_product_id;
    
    -- Desativar pré-venda
    UPDATE pre_sale_products 
    SET is_active = false, updated_at = NOW()
    WHERE product_id = p_product_id AND is_active = true;
    
    -- Notificar interessados
    INSERT INTO promotion_applications (
        promotion_id, customer_email, 
        discount_amount, applied_at, 
        applied_products, cart_items
    )
    SELECT 
        gen_random_uuid() as promotion_id,  -- Para fins de notificação
        psn.customer_email,
        0 as discount_amount,
        NOW() as applied_at,
        ARRAY[p_product_id] as applied_products,
        jsonb_build_object('notification_type', 'product_available') as cart_items
    FROM pre_sale_notifications psn
    WHERE psn.product_id = p_product_id 
    AND psn.is_active = true 
    AND psn.notified_at IS NULL;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Função para aplicar desconto de pré-venda
CREATE OR REPLACE FUNCTION apply_pre_sale_pricing(p_product_id UUID) 
RETURNS DECIMAL(10,2) AS $$
DECLARE
    product_record products%ROWTYPE;
    final_price DECIMAL(10,2);
BEGIN
    SELECT * INTO product_record FROM products WHERE id = p_product_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Se tem preço de pré-venda específico, usar ele
    IF product_record.pre_sale_price IS NOT NULL THEN
        final_price := product_record.pre_sale_price;
    ELSE 
        -- Senão, aplicar desconto padrão (exemplo: 10% menos)
        final_price := product_record.sale_price * 0.9;
    END IF;
    
    RETURN final_price;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. TRIGGERS AUTOMÁTICOS
-- =====================================================

-- Trigger para aplicar preço de pré-venda automaticamente
CREATE OR REPLACE FUNCTION trigger_apply_pre_sale_pricing()
RETURNS TRIGGER AS $$
BEGIN
    -- Se produto está em pré-venda e não tem preço específico
    IF NEW.is_pre_sale_manual = true AND NEW.pre_sale_price IS NULL THEN
        NEW.pre_sale_price := apply_pre_sale_pricing(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_pre_sale_price
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW 
    WHEN (NEW.is_pre_sale_manual = true)
    EXECUTE FUNCTION trigger_apply_pre_sale_pricing();

-- Trigger para auto-marcar como pré-venda quando estoque zerar
CREATE OR REPLACE FUNCTION trigger_auto_pre_sale_on_zero_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Se estoque chegou a zero e produto tem auto-pre-sale habilitado
    IF NEW.stock = 0 AND OLD.stock > 0 AND NEW.is_pre_sale_auto_stock = true THEN
        PERFORM register_pre_sale_product(
            NEW.id, 
            'out_of_stock',
            NULL, 
            NOW() + INTERVAL '30 days' -- Estimativa de 30 dias
        );
        
        NEW.availability_status := 'pre_sale';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_pre_sale_stock
    AFTER UPDATE OF stock ON products
    FOR EACH ROW 
    WHEN (NEW.stock = 0 AND OLD.stock > 0 AND NEW.is_pre_sale_auto_stock = true)
    EXECUTE FUNCTION trigger_auto_pre_sale_on_zero_stock();

-- Triggers para updated_at
CREATE TRIGGER trigger_promotions_updated_at
    BEFORE UPDATE ON promotions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_promotion_rules_updated_at
    BEFORE UPDATE ON promotion_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_pre_sale_products_updated_at
    BEFORE UPDATE ON pre_sale_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 12. VIEWS ÚTEIS
-- =====================================================

-- View para promoções ativas disponíveis
CREATE VIEW active_promotions_view AS
SELECT 
    p.*,
    CASE 
        WHEN p.is_public = true AND NOW() BETWEEN p.start_date AND p.end_date THEN true
        ELSE false
    END as is_currently_active,
    p.current_uses / CASE WHEN p.max_uses > 0 THEN p.max_uses ELSE 1 END as usage_percentage
FROM promotions p
WHERE p.is_active = true;

-- View para produtos em pré-venda
CREATE VIEW pre_sale_products_view AS
SELECT 
    pr.*,
    p.name as product_name,
    p.sale_price as original_price,
    CASE 
        WHEN p.pre_sale_price IS NOT NULL THEN p.pre_sale_price
        ELSE p.sale_price * 0.9
    END as pre_sale_price,
    ps.estimated_availability,
    ps.reason as pre_sale_reason
FROM products pr
JOIN pre_sale_products ps ON ps.product_id = pr.id
WHERE ps.is_active = true 
AND pr.availability_status = 'pre_sale';

-- View para estatísticas de promoções
CREATE VIEW promotion_statistics AS
SELECT 
    p.id,
    p.name,
    p.discount_value,
    COALESCE(pa.total_applied, 0) as total_applications,
    COALESCE(pa.total_discount_amount, 0) as total_discount_given,
    COALESCE(cu.total_users, 0) as unique_users,
    p.current_uses,
    p.max_uses,
    CASE 
        WHEN p.max_uses > 0 THEN (p.current_uses::DECIMAL / p.max_uses) * 100
        ELSE NULL
    END as usage_percentage
FROM promotions p
LEFT JOIN (
    SELECT 
        promotion_id,
        COUNT(*) as total_applied,
        SUM(discount_amount) as total_discount_amount
    FROM promotion_applications
    GROUP BY promotion_id
) pa ON pa.promotion_id = p.id
LEFT JOIN (
    SELECT 
        promotion_id,
        COUNT(DISTINCT customer_email) as total_users
    FROM coupon_usages
    GROUP BY promotion_id
) cu ON cu.promotion_id = p.id;

-- =====================================================
-- ✅ MIGRAÇÃO CONCLUÍDA!
-- =====================================================

SELECT 
    '🎉 Sistema avançado de promoções e pré-vendas criado!' as status,
    'Executando migração de dados...' as next_step;
