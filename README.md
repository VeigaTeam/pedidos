# Sistema de Pedidos - Academia Veiga

Sistema completo para gerenciamento de pedidos de produtos da academia, incluindo camisetas, shorts e equipamentos.

## 🚀 Funcionalidades

### Para Alunos (Formulário Público)
- ✅ Formulário público para fazer pedidos
- ✅ Catálogo de produtos com preços
- ✅ Carrinho de compras
- ✅ Seleção de tamanhos e cores
- ✅ Cálculo automático do total
- ✅ Envio de pedidos

### Para Administradores
- ✅ Dashboard com métricas gerais
- ✅ Gestão completa de produtos
- ✅ Controle de pedidos e status
- ✅ Gestão de estoque com alertas
- ✅ Métricas de vendas e relatórios
- ✅ Exportação de pedidos para WhatsApp
- ✅ Sistema de alertas de estoque baixo

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Roteamento**: React Router DOM
- **Formulários**: React Hook Form + Zod
- **Gráficos**: Recharts
- **Ícones**: Lucide React
- **Build**: Vite

## 📦 Instalação

1. **Clone o repositório**
```bash
cd /home/rodrigo.veiga/Documentos/Veiga/pedidos
```

2. **Instale as dependências**
```bash
npm install
```

3. **Execute o projeto em desenvolvimento**
```bash
npm run dev
```

4. **Acesse o sistema**
- Formulário público: http://localhost:5173/
- Painel administrativo: http://localhost:5173/admin

## 🗄️ Banco de Dados

O sistema inclui um schema SQL completo para PostgreSQL:

```bash
# Execute o schema no seu banco PostgreSQL
psql -d sua_database -f database/schema.sql
```

### Tabelas Principais
- `products` - Catálogo de produtos
- `orders` - Pedidos dos alunos
- `order_items` - Itens dos pedidos
- `inventory_alerts` - Alertas de estoque

## 📱 Uso do Sistema

### Formulário Público (Alunos)
1. Acesse a página inicial
2. Navegue pelos produtos disponíveis
3. Selecione tamanhos e cores
4. Adicione ao carrinho
5. Preencha seus dados
6. Finalize o pedido

### Painel Administrativo
1. Acesse `/admin`
2. **Dashboard**: Visualize métricas gerais
3. **Produtos**: Gerencie o catálogo
4. **Pedidos**: Controle todos os pedidos
5. **Métricas**: Análise de vendas
6. **Estoque**: Controle de inventário

## 🔧 Configuração

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:3000
VITE_DATABASE_URL=postgresql://user:password@localhost:5432/pedidos_db
```

### Personalização
- **Cores**: Edite `tailwind.config.ts`
- **Produtos**: Modifique `src/data/mockData.ts`
- **Layout**: Ajuste componentes em `src/components/Layout/`

## 📊 Funcionalidades Principais

### Gestão de Produtos
- Cadastro de produtos com preços
- Categorias (camisetas, shorts, equipamentos)
- Controle de tamanhos e cores
- Cálculo automático de margem de lucro

### Sistema de Pedidos
- Formulário público para alunos
- Carrinho de compras
- Status de pedidos (pendente, confirmado, etc.)
- Exportação para WhatsApp

### Controle de Estoque
- Monitoramento em tempo real
- Alertas de estoque baixo
- Ajustes manuais de estoque
- Valor total do inventário

### Métricas e Relatórios
- Dashboard com KPIs
- Gráficos de vendas
- Top produtos
- Evolução da receita

## 🚀 Deploy

### Build para Produção
```bash
npm run build
```

### Servir Arquivos Estáticos
```bash
npm run preview
```

## 📱 Exportação para WhatsApp

O sistema gera automaticamente mensagens formatadas para WhatsApp com:
- Dados do cliente
- Lista de produtos
- Valores totais
- Observações
- ID do pedido

## 🔒 Segurança

- Validação de formulários com Zod
- Sanitização de dados
- Controle de acesso ao painel admin
- Validação de tipos com TypeScript

## 📈 Próximos Passos

- [ ] Integração com banco de dados real
- [ ] Sistema de autenticação
- [ ] Notificações por email
- [ ] Relatórios em PDF
- [ ] App mobile
- [ ] Integração com pagamentos

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 📞 Suporte

Para dúvidas ou suporte, entre em contato:
- Email: contato@academiaveiga.com
- WhatsApp: (11) 99999-9999

---

**Desenvolvido para Academia Veiga** 🥊
