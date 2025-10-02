-- Tabela para gerenciar lotes de produtos com custos diferentes (sistema FIFO)
CREATE TABLE inventory_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    supplier_order_id UUID REFERENCES supplier_orders(id) ON DELETE SET NULL,
    original_quantity INTEGER NOT NULL CHECK (original_quantity > 0),
    current_quantity INTEGER NOT NULL CHECK (current_quantity >= 0),
    unit_cost DECIMAL(10,2) NOT NULL CHECK (unit_cost >= 0), -- Custo real por unidade (incluindo frete proporcional)
    purchase_price DECIMAL(10,2) NOT NULL CHECK (purchase_price >= 0), -- Preço original de compra
    freight_cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0, -- Frete por unidade
    lot_number VARCHAR(50), -- Número do lote para identificação
    received_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE, -- Data de validade (se aplicável)
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT current_quantity_not_greater_than_original CHECK (current_quantity <= original_quantity)
);

-- Índices para performance
CREATE INDEX idx_inventory_lots_product_id ON inventory_lots(product_id);
CREATE INDEX idx_inventory_lots_received_date ON inventory_lots(received_date);
CREATE INDEX idx_inventory_lots_current_quantity ON inventory_lots(current_quantity);
CREATE INDEX idx_inventory_lots_supplier_order_id ON inventory_lots(supplier_order_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_inventory_lots_updated_at BEFORE UPDATE ON inventory_lots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular custo real por item do pedido (incluindo frete proporcional)
CREATE OR REPLACE FUNCTION calculate_real_item_cost(
    item_quantity INTEGER,
    item_purchase_price DECIMAL(10,2),
    total_order_items_value DECIMAL(10,2),
    shipping_cost DECIMAL(10,2)
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    item_value DECIMAL(10,2);
    freight_proportion DECIMAL(10,2);
    freight_per_unit DECIMAL(10,2);
    real_cost_per_unit DECIMAL(10,2);
BEGIN
    -- Calcular valor total do item
    item_value := item_quantity * item_purchase_price;
    
    -- Se não há frete ou valor total é zero, retornar preço original
    IF shipping_cost = 0 OR total_order_items_value = 0 THEN
        RETURN item_purchase_price;
    END IF;
    
    -- Calcular proporção do frete para este item
    freight_proportion := item_value / total_order_items_value;
    
    -- Calcular frete por unidade do item
    freight_per_unit := CASE 
        WHEN item_quantity > 0 THEN (freight_proportion * shipping_cost) / item_quantity
        ELSE 0
    END;
    
    -- Calcular custo real por unidade (preço de compra + frete proporcional)
    real_cost_per_unit := item_purchase_price + freight_per_unit;
    
    RETURN real_cost_per_unit;
END;
$$ LANGUAGE plpgsql;

-- Função para processar entrega de pedido e criar lotes no estoque
CREATE OR REPLACE FUNCTION process_supplier_order_delivery(order_id UUID)
RETURNS TEXT AS $$
DECLARE
    order_rec RECORD;
    item_rec RECORD;
    total_items_value DECIMAL(10,2) := 0;
    real_cost_per_unit DECIMAL(10,2);
    lot_record RECORD;
    result_message TEXT := '';
BEGIN
    -- Buscar dados do pedido
    SELECT * INTO order_rec FROM supplier_orders WHERE id = order_id;
    
    IF NOT FOUND THEN
        RETURN 'Pedido não encontrado';
    END IF;
    
    -- Calcular valor total dos itens para cálculo proporcional do frete
    SELECT COALESCE(SUM(total_price), 0) INTO total_items_value
    FROM supplier_order_items 
    WHERE supplier_order_items.order_id = order_id;
    
    -- Processar cada item do pedido
    FOR item_rec IN 
        SELECT * FROM supplier_order_items 
        WHERE order_id = order_id
    LOOP
        -- Calcular custo real por unidade (incluindo frete proporcional)
        real_cost_per_unit := calculate_real_item_cost(
            item_rec.quantity,
            item_rec.purchase_price,
            total_items_value,
            order_rec.shipping_cost
        );
        
        -- Criar lote no estoque
        INSERT INTO inventory_lots (
            product_id,
            supplier_order_id,
            original_quantity,
            current_quantity,
            unit_cost,
            purchase_price,
            freight_cost_per_unit,
            lot_number,
            received_date,
            notes
        ) VALUES (
            item_rec.product_id,
            order_id,
            item_rec.quantity,
            item_rec.quantity,
            real_cost_per_unit,
            item_rec.purchase_price,
            CASE 
                WHEN item_rec.quantity > 0 THEN (real_cost_per_unit - item_rec.purchase_price)
                ELSE 0
            END,
            'SO-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(EXTRACT(DOY FROM NOW())::TEXT, 3, '0') || '-' || SUBSTRING(order_id::TEXT, 1, 8),
            NOW(),
            'Entrada via pedido ao fornecedor ' || order_id || ' - Item: ' || item_rec.quantity || ' unidades'
        );
        
        -- Atualizar estoque total do produto
        UPDATE products 
        SET stock = stock + item_rec.quantity,
            purchase_price = real_cost_per_unit -- Atualizar preço médio ponderado como referência
        WHERE id = item_rec.product_id;
        
        result_message := result_message || 'Lote criado para produto ' || item_rec.product_id || ' com ' || item_rec.quantity || ' unidades. ';
    END LOOP;
    
    -- Atualizar status do pedido para 'delivered'
    UPDATE supplier_orders 
    SET status = 'delivered',
        delivery_date = NOW()
    WHERE id = order_id;
    
    RETURN 'Entregue processada com sucesso. ' || result_message;
END;
$$ LANGUAGE plpgsql;

-- Função para consumir produtos do estoque aplicando FIFO (First In, First Out)
CREATE OR REPLACE FUNCTION consume_inventory_by_fifo(
    target_product_id UUID,
    quantity_to_consume INTEGER,
    consumption_purpose TEXT DEFAULT 'sale',
    consumption_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TEXT AS $$
DECLARE
    lot_rec RECORD;
    remaining_to_consume INTEGER := quantity_to_consume;
    consumed_from_lot INTEGER;
    result_message TEXT := '';
    total_available INTEGER := 0;
BEGIN
    -- Verificar se há estoque suficiente
    SELECT COALESCE(SUM(current_quantity), 0) INTO total_available
    FROM inventory_lots 
    WHERE product_id = target_product_id AND current_quantity > 0;
    
    IF total_available < quantity_to_consume THEN
        RETURN 'Estoque insuficiente. Disponível: ' || total_available || ', Necessário: ' || quantity_to_consume;
    END IF;
    
    -- Consumir lotes em ordem FIFO (recebimento mais antigo primeiro)
    FOR lot_rec IN
        SELECT * FROM inventory_lots 
        WHERE product_id = target_product_id 
        AND current_quantity > 0
        ORDER BY received_date ASC, created_at ASC
    LOOP
        IF remaining_to_consume <= 0 THEN
            EXIT;
        END IF;
        
        -- Calcular quanto consumir deste lote
        consumed_from_lot := LEAST(remaining_to_consume, lot_rec.current_quantity);
        
        -- Atualizar quantidade do lote
        UPDATE inventory_lots 
        SET current_quantity = current_quantity - consumed_from_lot,
            updated_at = NOW()
        WHERE id = lot_rec.id;
        
        -- Registro de consumo (poderia ser uma tabela de movimentações se necessário)
        result_message := result_message || 'Consumido ' || consumed_from_lot || 
                         ' unidades do lote ' || lot_rec.lot_number || 
                         ' (custo R$ ' || lot_rec.unit_cost || '/unidade). ';
        
        remaining_to_consume := remaining_to_consume - consumed_from_lot;
    END LOOP;
    
    -- Atualizar estoque total do produto
    UPDATE products 
    SET stock = stock - quantity_to_consume
    WHERE id = target_product_id;
    
    RETURN 'Consumo FIFO realizado. ' || result_message;
END;
$$ LANGUAGE plpgsql;

-- Função para obter custo médio atual de um produto considerando todos os lotes
CREATE OR REPLACE FUNCTION get_product_average_cost(target_product_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_value DECIMAL(10,2) := 0;
    total_quantity INTEGER := 0;
    avg_cost DECIMAL(10,2);
BEGIN
    SELECT 
        COALESCE(SUM(unit_cost * current_quantity), 0),
        COALESCE(SUM(current_quantity), 0)
    INTO total_value, total_quantity
    FROM inventory_lots
    WHERE product_id = target_product_id AND current_quantity > 0;
    
    IF total_quantity = 0 THEN
        RETURN 0;
    END IF;
    
    avg_cost := total_value / total_quantity;
    
    RETURN avg_cost;
END;
$$ LANGUAGE plpgsql;