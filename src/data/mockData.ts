import { Product, Order, OrderItem, SalesMetrics } from '@/types'

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Camiseta Academia Veiga',
    category: 'camisetas',
    description: 'Camiseta 100% algodão com logo da academia',
    purchasePrice: 25.00,
    salePrice: 45.00,
    profitMargin: 80,
    stock: 50,
    minStock: 10,
    sizes: ['P', 'M', 'G', 'GG'],
    colors: ['Branco', 'Preto', 'Vermelho'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Short de Treino',
    category: 'shorts',
    description: 'Short confortável para treinos',
    purchasePrice: 30.00,
    salePrice: 55.00,
    profitMargin: 83.33,
    stock: 30,
    minStock: 5,
    sizes: ['P', 'M', 'G', 'GG'],
    colors: ['Preto', 'Azul', 'Cinza'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '3',
    name: 'Luvas de Boxe',
    category: 'equipamentos',
    description: 'Luvas profissionais para boxe e muay thai',
    purchasePrice: 80.00,
    salePrice: 150.00,
    profitMargin: 87.5,
    stock: 15,
    minStock: 3,
    sizes: ['12oz', '14oz', '16oz'],
    colors: ['Preto', 'Vermelho', 'Azul'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '4',
    name: 'Caneleiras',
    category: 'equipamentos',
    description: 'Caneleiras para muay thai',
    purchasePrice: 60.00,
    salePrice: 120.00,
    profitMargin: 100,
    stock: 20,
    minStock: 5,
    sizes: ['P', 'M', 'G'],
    colors: ['Preto', 'Azul'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '5',
    name: 'Protetor Bucal',
    category: 'equipamentos',
    description: 'Protetor bucal moldável',
    purchasePrice: 15.00,
    salePrice: 35.00,
    profitMargin: 133.33,
    stock: 100,
    minStock: 20,
    sizes: ['Único'],
    colors: ['Transparente', 'Azul', 'Rosa'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '6',
    name: 'Bandagem',
    category: 'equipamentos',
    description: 'Bandagem para mãos - 4.5m',
    purchasePrice: 8.00,
    salePrice: 20.00,
    profitMargin: 150,
    stock: 200,
    minStock: 50,
    sizes: ['4.5m'],
    colors: ['Branco', 'Preto', 'Azul', 'Vermelho'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
]

export const mockOrders: Order[] = [
  {
    id: '1',
    studentName: 'João Silva',
    studentEmail: 'joao@email.com',
    studentPhone: '(11) 99999-9999',
    items: [
      {
        id: '1',
        productId: '1',
        product: mockProducts[0],
        quantity: 2,
        size: 'M',
        color: 'Preto',
        unitPrice: 45.00,
        totalPrice: 90.00
      },
      {
        id: '2',
        productId: '6',
        product: mockProducts[5],
        quantity: 1,
        size: '4.5m',
        color: 'Preto',
        unitPrice: 20.00,
        totalPrice: 20.00
      }
    ],
    totalAmount: 110.00,
    status: 'pending',
    notes: 'Entregar na academia',
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:30:00')
  },
  {
    id: '2',
    studentName: 'Maria Santos',
    studentEmail: 'maria@email.com',
    studentPhone: '(11) 88888-8888',
    items: [
      {
        id: '3',
        productId: '3',
        product: mockProducts[2],
        quantity: 1,
        size: '14oz',
        color: 'Vermelho',
        unitPrice: 150.00,
        totalPrice: 150.00
      }
    ],
    totalAmount: 150.00,
    status: 'confirmed',
    createdAt: new Date('2024-01-14T14:20:00'),
    updatedAt: new Date('2024-01-14T15:00:00')
  },
  {
    id: '3',
    studentName: 'Pedro Costa',
    studentEmail: 'pedro@email.com',
    studentPhone: '(11) 77777-7777',
    items: [
      {
        id: '4',
        productId: '2',
        product: mockProducts[1],
        quantity: 1,
        size: 'G',
        color: 'Preto',
        unitPrice: 55.00,
        totalPrice: 55.00
      },
      {
        id: '5',
        productId: '4',
        product: mockProducts[3],
        quantity: 1,
        size: 'M',
        color: 'Preto',
        unitPrice: 120.00,
        totalPrice: 120.00
      }
    ],
    totalAmount: 175.00,
    status: 'completed',
    createdAt: new Date('2024-01-13T09:15:00'),
    updatedAt: new Date('2024-01-13T16:30:00')
  }
]

export const mockSalesMetrics: SalesMetrics = {
  totalOrders: 3,
  totalRevenue: 435.00,
  totalProfit: 245.00,
  averageOrderValue: 145.00,
  topProducts: [
    {
      product: mockProducts[2], // Luvas de Boxe
      quantitySold: 1,
      revenue: 150.00
    },
    {
      product: mockProducts[3], // Caneleiras
      quantitySold: 1,
      revenue: 120.00
    },
    {
      product: mockProducts[0], // Camiseta
      quantitySold: 2,
      revenue: 90.00
    }
  ],
  ordersByStatus: {
    pending: 1,
    confirmed: 1,
    completed: 1,
    processing: 0,
    cancelled: 0
  },
  revenueByMonth: [
    { month: 'Jan 2024', revenue: 435.00, profit: 245.00 },
    { month: 'Dez 2023', revenue: 1200.00, profit: 680.00 },
    { month: 'Nov 2023', revenue: 980.00, profit: 550.00 }
  ]
}
