import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSalesMetrics } from '@/hooks/supabase/useSalesMetrics'
import { formatCurrency } from '@/lib/utils'
import { pdfService } from '@/lib/pdfService'
import { useToast } from '@/hooks/use-toast'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package,
  BarChart3,
  PieChart as PieChartIcon,
  FileText
} from 'lucide-react'

export default function SalesMetrics() {
  const { metrics, loading, error } = useSalesMetrics()
  const { toast } = useToast()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando métricas...</div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">Erro ao carregar métricas: {error}</div>
      </div>
    )
  }

  const generateSalesPDF = () => {
    try {
      const doc = pdfService.generateSalesReport(metrics)
      pdfService.downloadPDF(doc, `relatorio-vendas-${new Date().toISOString().split('T')[0]}.pdf`)
      
      toast({
        title: "Relatório gerado",
        description: "Relatório de vendas baixado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao gerar o PDF.",
        variant: "destructive"
      })
    }
  }

  const revenueData = metrics.revenueByMonth.map(item => ({
    month: item.month,
    receita: item.revenue,
    lucro: item.profit
  }))

  // const topProductsData = metrics.topProducts.map((item, index) => ({
  //   name: item.product.name,
  //   vendas: item.quantitySold,
  //   receita: item.revenue,
  //   fill: `hsl(${index * 60}, 70%, 50%)`
  // }))

  const statusData = Object.entries(metrics.ordersByStatus).map(([status, count]) => ({
    name: status === 'pending' ? 'Pendentes' :
          status === 'confirmed' ? 'Confirmados' :
          status === 'processing' ? 'Processando' :
          status === 'completed' ? 'Concluídos' :
          status === 'cancelled' ? 'Cancelados' : status,
    value: count,
    fill: status === 'pending' ? '#fbbf24' :
          status === 'confirmed' ? '#3b82f6' :
          status === 'processing' ? '#8b5cf6' :
          status === 'completed' ? '#10b981' :
          status === 'cancelled' ? '#ef4444' : '#6b7280'
  }))

  const stats = [
    {
      title: 'Total de Pedidos',
      value: metrics.totalOrders,
      icon: ShoppingCart,
      description: 'Pedidos realizados',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950'
    },
    {
      title: 'Receita Total',
      value: formatCurrency(metrics.totalRevenue),
      icon: DollarSign,
      description: 'Valor total vendido',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950'
    },
    {
      title: 'Lucro Total',
      value: formatCurrency(metrics.totalProfit),
      icon: TrendingUp,
      description: 'Lucro obtido',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950'
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(metrics.averageOrderValue),
      icon: BarChart3,
      description: 'Valor médio por pedido',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Métricas de Vendas</h1>
          <p className="text-muted-foreground">
            Análise detalhada das vendas e performance
          </p>
        </div>
        <Button variant="outline" onClick={generateSalesPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Gerar Relatório PDF
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
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
        {/* Gráfico de Receita por Mês */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Receita por Mês
            </CardTitle>
            <CardDescription>
              Evolução da receita e lucro ao longo dos meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    formatCurrency(Number(value)), 
                    name === 'receita' ? 'Receita' : 'Lucro'
                  ]}
                />
                <Bar dataKey="receita" fill="#3b82f6" name="receita" />
                <Bar dataKey="lucro" fill="#10b981" name="lucro" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Status dos Pedidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Status dos Pedidos
            </CardTitle>
            <CardDescription>
              Distribuição dos pedidos por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Top Produtos
          </CardTitle>
          <CardDescription>
            Produtos mais vendidos e sua performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.topProducts.map((item, index) => (
              <div key={item.product.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.product.category} • {item.quantitySold} {item.quantitySold === 1 ? 'vendido' : 'vendidos'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(item.revenue)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(item.product.salePrice)} cada
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Linha - Evolução da Receita */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Evolução da Receita
          </CardTitle>
          <CardDescription>
            Tendência de crescimento da receita
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  formatCurrency(Number(value)), 
                  name === 'receita' ? 'Receita' : 'Lucro'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="receita" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="receita"
              />
              <Line 
                type="monotone" 
                dataKey="lucro" 
                stroke="#10b981" 
                strokeWidth={2}
                name="lucro"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resumo de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Margem de Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {((metrics.totalProfit / metrics.totalRevenue) * 100).toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">
              Margem média de lucro
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pedidos Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {metrics.ordersByStatus.completed || 0}
            </div>
            <p className="text-sm text-muted-foreground">
              {((metrics.ordersByStatus.completed || 0) / metrics.totalOrders * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Receita Média Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {formatCurrency(metrics.revenueByMonth.reduce((sum, month) => sum + month.revenue, 0) / metrics.revenueByMonth.length)}
            </div>
            <p className="text-sm text-muted-foreground">
              Média dos últimos {metrics.revenueByMonth.length} meses
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
