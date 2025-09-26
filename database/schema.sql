-- Schema do banco de dados para Sistema de Pedidos da Academia

-- Tabela de produtos
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('camisetas', 'shorts', 'equipamentos')),
    description TEXT,
    purchase_price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2) NOT NULL,
    profit_margin DECIMAL(5,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    sizes JSONB,
    colors JSONB,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_offer BOOLEAN NOT NULL DEFAULT false,
    offer_price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pedidos
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    student_phone VARCHAR(20) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens do pedido
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    size VARCHAR(20),
    color VARCHAR(50),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de alertas de estoque
CREATE TABLE inventory_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    current_stock INTEGER NOT NULL,
    min_stock INTEGER NOT NULL,
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock')),
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_stock ON products(stock);
CREATE INDEX idx_products_offer ON products(is_offer);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_inventory_alerts_product_id ON inventory_alerts(product_id);
CREATE INDEX idx_inventory_alerts_resolved ON inventory_alerts(is_resolved);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular margem de lucro automaticamente
CREATE OR REPLACE FUNCTION calculate_profit_margin()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sale_price > 0 THEN
        NEW.profit_margin = ((NEW.sale_price - NEW.purchase_price) / NEW.purchase_price) * 100;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_profit_margin_trigger BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION calculate_profit_margin();

-- Função para criar alertas de estoque baixo
CREATE OR REPLACE FUNCTION check_stock_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se o estoque está baixo ou zerado
    IF NEW.stock <= NEW.min_stock AND NEW.stock > 0 THEN
        INSERT INTO inventory_alerts (product_id, current_stock, min_stock, alert_type)
        VALUES (NEW.id, NEW.stock, NEW.min_stock, 'low_stock');
    ELSIF NEW.stock = 0 THEN
        INSERT INTO inventory_alerts (product_id, current_stock, min_stock, alert_type)
        VALUES (NEW.id, NEW.stock, NEW.min_stock, 'out_of_stock');
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_stock_alerts_trigger AFTER UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION check_stock_alerts();

-- Inserir dados iniciais
INSERT INTO products (name, category, description, purchase_price, sale_price, stock, min_stock, sizes, colors) VALUES
('Camiseta Academia Veiga', 'camisetas', 'Camiseta 100% algodão com logo da academia', 25.00, 45.00, 50, 10, '["P", "M", "G", "GG"]', '["Branco", "Preto", "Vermelho"]'),
('Short de Treino', 'shorts', 'Short confortável para treinos', 30.00, 55.00, 30, 5, '["P", "M", "G", "GG"]', '["Preto", "Azul", "Cinza"]'),
('Luvas de Boxe', 'equipamentos', 'Luvas profissionais para boxe e muay thai', 80.00, 150.00, 15, 3, '["12oz", "14oz", "16oz"]', '["Preto", "Vermelho", "Azul"]'),
('Caneleiras', 'equipamentos', 'Caneleiras para muay thai', 60.00, 120.00, 20, 5, '["P", "M", "G"]', '["Preto", "Azul"]'),
('Protetor Bucal', 'equipamentos', 'Protetor bucal moldável', 15.00, 35.00, 100, 20, '["Único"]', '["Transparente", "Azul", "Rosa"]'),
('Bandagem', 'equipamentos', 'Bandagem para mãos - 4.5m', 8.00, 20.00, 200, 50, '["4.5m"]', '["Branco", "Preto", "Azul", "Vermelho"]');
