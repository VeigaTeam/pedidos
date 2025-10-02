import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Warehouse,
  Database,
  Home,
  CreditCard,
  Building2,
  Tag,
  Truck,
  FolderOpen,
  Percent,
  Clock
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Produtos', href: '/admin/products', icon: Package },
  { name: 'Marcas', href: '/admin/brands', icon: Tag },
  { name: 'Categorias', href: '/admin/categories', icon: FolderOpen },
  { name: 'Fornecedores', href: '/admin/suppliers', icon: Building2 },
  { name: 'Pedidos aos Fornecedores', href: '/admin/supplier-orders', icon: Truck },
  { name: 'Promoções', href: '/admin/promotions', icon: Percent },
  { name: 'Pré-venda', href: '/admin/pre-sale', icon: Clock },
  { name: 'Pedidos', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Pagamentos', href: '/admin/payments', icon: CreditCard },
  { name: 'Métricas', href: '/admin/metrics', icon: BarChart3 },
  { name: 'Estoque', href: '/admin/inventory', icon: Warehouse },
  { name: 'Backup', href: '/admin/backup', icon: Database },
]

export const Sidebar: React.FC = () => {
  const location = useLocation()

  return (
    <div className="flex flex-col w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex items-center h-16 px-6 border-b border-sidebar-border">
        <Link to="/" className="flex items-center space-x-2">
          <img 
            src="/pedidos/logo.png" 
            alt="CT VEIGA TEAM" 
            className="w-6 h-6 object-contain"
          />
          <span className="text-lg font-semibold text-sidebar-foreground">
            CT VEIGA TEAM
          </span>
        </Link>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <Link
          to="/"
          className="flex items-center px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors"
        >
          <Home className="mr-3 h-5 w-5" />
          Formulário Público
        </Link>
      </div>
    </div>
  )
}
