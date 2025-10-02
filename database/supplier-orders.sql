-- Tabela de pedidos aos fornecedores
CREATE TABLE supplier_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    delivery_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    tracking_number VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens dos pedidos aos fornecedores
CREATE TABLE supplier_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES supplier_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    purchase_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    is_pre_sale BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_supplier_orders_supplier_id ON supplier_orders(supplier_id);
CREATE INDEX idx_supplier_orders_status ON supplier_orders(status);
CREATE INDEX idx_supplier_orders_order_date ON supplier_orders(order_date);
CREATE INDEX idx_supplier_orders_delivery_date ON supplier_orders(delivery_date);
CREATE INDEX idx_supplier_order_items_order_id ON supplier_order_items(order_id);
CREATE INDEX idx_supplier_order_items_product_id ON supplier_order_items(product_id);
CREATE INDEX idx_supplier_order_items_pre_sale ON supplier_order_items(is_pre_sale);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_supplier_orders_updated_at BEFORE UPDATE ON supplier_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar o total do pedido automaticamente
CREATE OR REPLACE FUNCTION update_supplier_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    order_subtotal DECIMAL(10,2);
BEGIN
    -- Recalcular subtotal do pedido
    SELECT COALESCE(SUM(total_price), 0) INTO order_subtotal
    FROM supplier_order_items 
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);
    
    -- Atualizar o pedido principal
    UPDATE supplier_orders 
    SET 
        subtotal = order_subtotal,
        total_amount = order_subtotal + shipping_cost,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Triggers para atualizar totais quando itens são modificados
CREATE TRIGGER update_order_totals_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON supplier_order_items
    FOR EACH ROW EXECUTE FUNCTION update_supplier_order_totals();

-- Função para atualizar total quando shipping_cost é alterado
CREATE OR REPLACE FUNCTION update_supplier_order_total_on_shipping_change()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_amount = NEW.subtotal + NEW.shipping_cost;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_total_on_shipping_change
    BEFORE UPDATE ON supplier_orders
    FOR EACH ROW 
    WHEN (OLD.shipping_cost IS DISTINCT FROM NEW.shipping_cost)
    EXECUTE FUNCTION update_supplier_order_total_on_shipping_change();

-- Função para verificar se produto tem estoque suficiente antes de fazer pré-venda
CREATE OR REPLACE FUNCTION check_pre_sale_stock()
RETURNS TRIGGER AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    -- Se não é pré-venda, não precisa verificar
    IF NOT NEW.is_pre_sale THEN
        RETURN NEW;
    END IF;
    
    -- Buscar estoque atual do produto
    SELECT stock INTO current_stock 
    FROM products 
    WHERE id = NEW.product_id;
    
    -- Verificar se há estoque suficiente
    IF current_stock >= NEW.quantity THEN
        RAISE EXCEPTION 'Produto já possui estoque suficiente (%. Unidades em estoque). Não é necessário fazer pré-venda.', current_stock;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para verificar estoque em pré-vendas (opcional - pode ser removido se não quiser essa validação)
-- CREATE TRIGGER check_pre_sale_stock_trigger BEFORE INSERT ON supplier_order_items
--     FOR EACH ROW EXECUTE FUNCTION check_pre_sale_stock();
