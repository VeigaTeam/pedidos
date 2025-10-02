-- Script para adicionar campo CNPJ na tabela suppliers
-- Execute este script se a tabela suppliers já existir no banco

-- Adicionar coluna CNPJ se ela não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'suppliers' AND column_name = 'cnpj') THEN
        ALTER TABLE suppliers ADD COLUMN cnpj VARCHAR(18);
        
        -- Adicionar comentário sobre a coluna
        COMMENT ON COLUMN suppliers.cnpj IS 'CNPJ do fornecedor no formato XX.XXX.XXX/XXXX-XX';
    END IF;
END $$;

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'suppliers' 
ORDER BY ordinal_position;
