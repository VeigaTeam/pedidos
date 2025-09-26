export interface Product {
  id: string
  name: string
  category: 'camisetas' | 'shorts' | 'equipamentos'
  description?: string
  purchasePrice: number
  salePrice: number
  profitMargin: number
  stock: number
  minStock: number
  sizes?: string[]
  colors?: string[]
  image?: string
  isActive: boolean
  isOffer: boolean
  offerPrice?: number
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  id: string
  productId: string
  product: Product
  quantity: number
  size?: string
  color?: string
  unitPrice: number
  totalPrice: number
}

export interface Order {
  id: string
  studentName: string
  studentEmail: string
  studentPhone: string
  items: OrderItem[]
  totalAmount: number
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface SalesMetrics {
  totalOrders: number
  totalRevenue: number
  totalProfit: number
  averageOrderValue: number
  topProducts: Array<{
    product: Product
    quantitySold: number
    revenue: number
  }>
  ordersByStatus: Record<string, number>
  revenueByMonth: Array<{
    month: string
    revenue: number
    profit: number
  }>
}

export interface InventoryAlert {
  id: string
  productId: string
  product: Product
  currentStock: number
  minStock: number
  alertType: 'low_stock' | 'out_of_stock'
  createdAt: Date
}
