import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSalesMetrics } from '@/hooks/supabase/useSalesMetrics'
import { useOrders } from '@/hooks/supabase/useOrders'
import { useProducts } from '@/hooks/supabase/useProducts'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  Calendar,
  BarChart3
} from 'lucide-react'

export default function AdminDashboard() {
  const { metrics, loading: metricsLoading } = useSalesMetrics()
  const { orders, loading: ordersLoading } = useOrders()
  const { products, loading: productsLoading } = useProducts()
  
  const recentOrders = orders.slice(0, 5)
  const lowStockProducts = products.filter(p => p.stock <= p.minStock)
  
  if (metricsLoading || ordersLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }
  
  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">Erro ao carregar métricas</div>
      </div>
    )
  }

  const stats = [
    {
      title: 'Total de Pedidos',
      value: metrics.totalOrders,
      icon: ShoppingCart,
      description: 'Pedidos realizados',
      color: 'text-blue-600'
    },
    {
      title: 'Receita Total',
      value: formatCurrency(metrics.totalRevenue),
      icon: DollarSign,
      description: 'Valor total vendido',
      color: 'text-green-600'
    },
    {
      title: 'Lucro Total',
      value: formatCurrency(metrics.totalProfit),
      icon: TrendingUp,
      description: 'Lucro obtido',
      color: 'text-purple-600'
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(metrics.averageOrderValue),
      icon: BarChart3,
      description: 'Valor médio por pedido',
      color: 'text-orange-600'
    }
  ]

  const orderStatusCounts = Object.entries(metrics.ordersByStatus).map(([status, count]) => ({
    status,
    count,
    label: status === 'pending' ? 'Pendentes' :
           status === 'confirmed' ? 'Confirmados' :
           status === 'processing' ? 'Processando' :
           status === 'completed' ? 'Concluídos' :
           status === 'cancelled' ? 'Cancelados' : status
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de pedidos
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Pedidos Recentes
            </CardTitle>
            <CardDescription>
              Últimos pedidos realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{order.studentName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(order.totalAmount)}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'processing' ? 'bg-purple-100 text-purple-800' :
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status === 'pending' ? 'Pendente' :
                       order.status === 'confirmed' ? 'Confirmado' :
                       order.status === 'processing' ? 'Processando' :
                       order.status === 'completed' ? 'Concluído' :
                       'Cancelado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status dos Pedidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Status dos Pedidos
            </CardTitle>
            <CardDescription>
              Distribuição por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orderStatusCounts.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-sm text-muted-foreground">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Produtos com Estoque Baixo */}
      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Alertas de Estoque
            </CardTitle>
            <CardDescription>
              Produtos com estoque baixo ou zerado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-950">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{product.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.stock === 0 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                    }`}>
                      {product.stock === 0 ? 'Sem Estoque' : 'Estoque Baixo'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Estoque atual: <span className="font-medium">{product.stock}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Mínimo: <span className="font-medium">{product.minStock}</span>
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Top Produtos
          </CardTitle>
          <CardDescription>
            Produtos mais vendidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.topProducts.map((item, index) => (
              <div key={item.product.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantitySold} {item.quantitySold === 1 ? 'vendido' : 'vendidos'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(item.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
