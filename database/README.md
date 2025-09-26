# Configuração do Banco de Dados

## PostgreSQL

### 1. Instalação
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
```

### 2. Configuração Inicial
```bash
# Iniciar o serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Criar usuário e banco
sudo -u postgres psql
```

### 3. Criar Banco e Usuário
```sql
-- Conectar como postgres
CREATE DATABASE pedidos_academia;
CREATE USER pedidos_user WITH PASSWORD 'sua_senha_aqui';
GRANT ALL PRIVILEGES ON DATABASE pedidos_academia TO pedidos_user;
\q
```

### 4. Executar Schema
```bash
# Executar o schema
psql -h localhost -U pedidos_user -d pedidos_academia -f schema.sql
```

## Docker (Alternativa)

### 1. Criar docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: pedidos_academia
      POSTGRES_USER: pedidos_user
      POSTGRES_PASSWORD: sua_senha_aqui
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./schema.sql:/docker-entrypoint-initdb.d/schema.sql

volumes:
  postgres_data:
```

### 2. Executar
```bash
docker-compose up -d
```

## Estrutura das Tabelas

### products
- Catálogo de produtos
- Preços de compra e venda
- Controle de estoque
- Categorias e variações

### orders
- Pedidos dos alunos
- Dados de contato
- Status do pedido
- Valor total

### order_items
- Itens dos pedidos
- Quantidades e variações
- Preços unitários

### inventory_alerts
- Alertas de estoque baixo
- Controle de níveis mínimos

## Triggers Automáticos

- **update_updated_at_column**: Atualiza timestamp automaticamente
- **calculate_profit_margin**: Calcula margem de lucro
- **check_stock_alerts**: Cria alertas de estoque

## Backup e Restore

### Backup
```bash
pg_dump -h localhost -U pedidos_user -d pedidos_academia > backup.sql
```

### Restore
```bash
psql -h localhost -U pedidos_user -d pedidos_academia < backup.sql
```

## Monitoramento

### Verificar Status
```sql
-- Verificar tabelas
\dt

-- Verificar dados
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM orders;

-- Verificar alertas
SELECT * FROM inventory_alerts WHERE is_resolved = false;
```

### Logs
```bash
# Ver logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```
