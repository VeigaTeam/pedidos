export interface Supplier {
  id: string
  name: string
  contactName?: string
  email?: string
  phone?: string
  cnpj?: string
  address?: string
  notes?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Brand {
  id: string
  name: string
  description?: string
  supplierId?: string
  supplier?: Supplier
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  description?: string
  brandId?: string
  brand?: Brand
  supplierId?: string
  supplier?: Supplier
  categoryId?: string
  category?: Category
  purchasePrice: number
  salePrice: number
  profitMargin: number
  stock: number
  minStock: number
  sizes?: string[]
  colors?: string[]
  image?: string
  imageUrl?: string
  isActive: boolean
  isOffer: boolean
  offerPrice?: number
  originalPrice?: number
  isPreSale?: boolean
  autoPreSaleWhenOutOfStock?: boolean
  isPreSaleManual?: boolean
  isPreSaleAutoStock?: boolean
  preSaleUntil?: Date | string
  preSalePrice?: number
  availabilityStatus?: 'available' | 'pre_sale' | 'out_of_stock' | 'discontinued'
  preSaleReason?: string
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  id: string
  productId: string
  product: Product
  quantity: number
  variationId?: string // Referência à variação específica
  variation?: ProductVariation // Objeto da variação
  size?: string // Compatibilidade com sistema antigo
  color?: string // Compatibilidade com sistema antigo
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

// Tipos para sistema de pagamento
export type PaymentMethod = 'pix' | 'credit_card_manual'
export type PaymentStatus = 'pending' | 'processing' | 'approved' | 'rejected' | 'cancelled' | 'refunded'

export interface Payment {
  id: string
  orderId: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  transactionId?: string
  pixCode?: string
  pixQrCode?: string
  paymentLink?: string
  notes?: string
  gatewayResponse?: any
  createdAt: Date
  updatedAt: Date
}

export interface PixPaymentData {
  amount: number
  description?: string
}

export interface CreditCardData {
  cardNumber: string
  cardHolder: string
  expiryDate: string
  cvv: string
  installments: number
}

export interface PaymentResult {
  success: boolean
  paymentId?: string
  transactionId?: string
  pixCode?: string
  pixQrCode?: string
  error?: string
  message?: string
}

// Tipos para pedidos aos fornecedores
export interface SupplierOrderItem {
  id: string
  productId: string
  product: Product
  quantity: number
  purchasePrice: number
  totalPrice: number
  isPreSale: boolean
  notes?: string
}

export interface SupplierOrder {
  id: string
  supplierId: string
  supplier: Supplier
  orderDate: Date
  deliveryDate?: Date
  status: 'pending' | 'sent' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  items: SupplierOrderItem[]
  subtotal: number
  shippingCost: number
  totalAmount: number
  notes?: string
  trackingNumber?: string
  createdAt: Date
  updatedAt: Date
}

export interface SupplierOrderStats {
totalPreSaleItems: number
  totalStockItems: number
  totalPreSaleValue: number
  totalStockValue: number
  averageDeliveryDays: number
  ordersByStatus: Record<string, number>
}

// =====================================================
// TIPOS PARA VARIAÇÕES DE PRODUTOS
// =====================================================

export interface VariationAttribute {
  id: string
  name: string // Ex: "size", "color", "material"
  displayName: string // Ex: "Tamanho", "Cor", "Material"
  description?: string
  dataType: 'string' | 'number' | 'boolean' | 'color'
  isRequired: boolean
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface VariationAttributeValue {
  id: string
  attributeId: string
  attribute: VariationAttribute
  value: string // Ex: "P", "Azul", "Algodão"
  displayValue?: string // Ex: "Pequeno", "Azul Claro", "100% Algodão"
  colorCode?: string // Código hexadecimal para cores
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProductVariation {
  id: string
  productId: string
  product: Product
  sku?: string // Código único da variação
  attributes: Record<string, string> // Ex: { "size": "M", "color": "azul" }
  attributeValues: VariationAttributeValue[] // Valores detalhados dos atributos
  purchasePrice?: number // Se não definido, usa o preço do produto pai
  salePrice?: number // Se não definido, usa o preço do produto pai
  profitMargin: number
  stock: number
  minStock: number
  image?: string
  isAvailable: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface ProductRequiredAttribute {
  id: string
  productId: string
  product: Product
  attributeId: string
  attribute: VariationAttribute
  sortOrder: number
  createdAt: Date
}

// =====================================================
// TIPOS PARA CATEGORIAS E PROMOÇÕES
// =====================================================

export interface Category {
  id: string
  name: string
  description?: string
  imageUrl?: string
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface Promotion {
  id: string
  name: string
  description?: string
  code?: string
  promotionType: 'percentage_discount' | 'fixed_discount' | 'buy_x_get_y' | 'free_shipping' | 'cashback' | 'bundle_discount' | 'category_discount' | 'brand_discount' | 'stock_clearance'
  discountValue: number
  discountPercentage?: number
  minDiscountValue?: number
  maxDiscountValue?: number
  minQuantity: number
  minCartValue?: number
  maxUses?: number
  maxUsesPerUser?: number
  startDate: Date | string
  endDate: Date | string
  isActive: boolean
  isPublic?: boolean
  autoApply?: boolean
  currentUses: number
  totalRedeemedAmount: number
  excludedProducts?: string[]
  requiredProducts?: string[]
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

export interface ProductPromotion {
  id: string
  productId: string
  promotionId: string
  appliedAt: Date
}

// =====================================================
// ESTENDENDO PRODUCT EXISTENTE
// =====================================================

export interface EnhancedProduct extends Product {
  categoryId?: string
  category?: Category
  originalPrice?: number // Para preços antes da promoção
  isPreSale?: boolean // Marcação manual de pré-venda
  autoPreSaleWhenOutOfStock?: boolean // Auto-marcação quando estoque zerado
  promotions?: ProductPromotion[]
  requiredAttributes?: VariationAttribute[]
  variations?: ProductVariation[]
  totalStock: number // Soma do estoque de todas as variações
}

// =====================================================
// TIPOS PARA AÇÕES EM MASSA
// =====================================================

export interface BulkProductAction {
  productIds: string[]
  action: 'toggle_active' | 'set_category' | 'set_brand' | 'set_supplier' | 'apply_promotion' | 'remove_promotion' | 'toggle_pre_sale' | 'toggle_offer'
  value?: any
}

export interface ColumnSortConfig {
  column: string
  direction: 'asc' | 'desc'
}

// =====================================================
// TIPOS PARA GERENCIAMENTO DE PROMOÇÕES
// =====================================================

export interface PromotionFormData {
  name: string
  description?: string
  code?: string
  promotionType: 'percentage_discount' | 'fixed_discount' | 'buy_x_get_y' | 'free_shipping' | 'cashback' | 'bundle_discount' | 'category_discount' | 'brand_discount' | 'stock_clearance'
  discountValue: number
  discountPercentage?: number
  minDiscountValue?: number
  maxDiscountValue?: number
  minQuantity: number
  minCartValue?: number
  maxUses?: number
  maxUsesPerUser?: number
  startDate: string
  endDate: string
  isActive: boolean
  isPublic?: boolean
  autoApply?: boolean
  excludedProducts?: string[]
  requiredProducts?: string[]
}

export interface PreSaleProductFormData {
  productIds: string[]
  action: 'mark_pre_sale' | 'unmark_pre_sale' | 'enable_auto_pre_sale' | 'disable_auto_pre_sale'
  reason?: string
}
