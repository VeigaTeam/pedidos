import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/hooks/use-toast'
import { useOrders } from '@/hooks/supabase/useOrders'
import { useProducts } from '@/hooks/supabase/useProducts'
import { PaymentMethodModal } from '@/components/Payment'
import { ShoppingCart, X, Plus, Minus, Trash2, User, CreditCard } from 'lucide-react'
import { formatCurrency, formatPhone, cleanPhone } from '@/lib/utils'
import type { Product, PaymentResult, ProductVariation } from '@/types'

const orderSchema = z.object({
  studentName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  studentEmail: z.string().email('Email inválido'),
  studentPhone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  notes: z.string().optional()
})

interface CartItem {
  productId: string
  variationId?: string // Referência à variação específica
  quantity: number
  size?: string // Compatibilidade com sistema antigo
  color?: string // Compatibilidade com sistema antigo
}

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  onUpdateCart: (newCart: CartItem[]) => void
  onRemoveFromCart: (index: number) => void
  onUpdateQuantity: (index: number, quantity: number) => void
}

export function CartModal({ 
  isOpen, 
  onClose, 
  cart, 
  onUpdateCart, 
  onRemoveFromCart, 
  onUpdateQuantity 
}: CartModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false)
  const [currentOrderId, setCurrentOrderId] = useState<string>('')
  const { toast } = useToast()
  const { createOrder } = useOrders()
  const { products } = useProducts()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      studentName: '',
      studentEmail: '',
      studentPhone: '',
      notes: ''
    }
  })

  const getProductById = (id: string): Product | undefined => {
    return products.find(p => p.id === id)
  }

  const getVariationById = (productId: string, variationId: string): ProductVariation | undefined => {
    const product = products.find(p => p.id === productId) as any
    if (!product?.variations) return undefined
    return product.variations.find((v: ProductVariation) => v.id === variationId)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      let price = 0
      
      if (item.variationId) {
        // Usar preço da variação
        const variation = getVariationById(item.productId, item.variationId)
        price = variation?.salePrice || 0
      } else {
        // Usar preço do produto (sistema antigo)
        const product = getProductById(item.productId)
        price = product ? (product.isOffer && product.offerPrice ? product.offerPrice : product.salePrice) : 0
      }
      
      return total + (price * item.quantity)
    }, 0)
  }

  const onSubmit = async (data: any) => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar o pedido.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const orderItems = cart.map(item => {
        const product = getProductById(item.productId)
        if (!product) throw new Error(`Produto não encontrado: ${item.productId}`)
        
        let price: number
        let variation: ProductVariation | undefined

        // Determinar preço baseado na variação ou produto
        if (item.variationId) {
          variation = getVariationById(item.productId, item.variationId)
          if (!variation) throw new Error(`Variação não encontrada: ${item.variationId}`)
          price = variation.salePrice || product.salePrice
        } else {
          price = product.isOffer && product.offerPrice ? product.offerPrice : product.salePrice
        }

        return {
          productId: item.productId,
          variationId: item.variationId,
          quantity: item.quantity,
          unitPrice: price,
          totalPrice: price * item.quantity,
          size: item.size,
          color: item.color,
          product: {
            id: product.id,
            name: product.name,
            category: product.category,
            description: product.description,
            purchasePrice: product.purchasePrice,
            salePrice: price,
            profitMargin: product.profitMargin,
            stock: product.stock,
            minStock: product.minStock,
            sizes: product.sizes,
            colors: product.colors,
            image: product.image,
            isActive: product.isActive,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
          }
        }
      })

      const orderData = {
        studentName: data.studentName,
        studentEmail: data.studentEmail,
        studentPhone: cleanPhone(data.studentPhone),
        totalAmount: getTotalPrice(),
        items: orderItems,
        notes: data.notes || '',
        status: 'pending' as const
      }

      const order = await createOrder(orderData)
      
      // Abrir modal de pagamento
      setCurrentOrderId(order.id)
      setIsPaymentMethodModalOpen(true)

    } catch (error) {
      console.error('Erro ao criar pedido:', error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar seu pedido. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaymentSuccess = (result: PaymentResult) => {
    if (result.success) {
      toast({
        title: "Pedido realizado com sucesso!",
        description: "Seu pedido foi processado e o pagamento foi aprovado.",
      })

      // Limpar carrinho e fechar modais
      onUpdateCart([])
      reset()
      setIsPaymentMethodModalOpen(false)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Carrinho de Compras</h2>
              <p className="text-red-100">{cart.length} item(s) no carrinho</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)]">
          {/* Lista de itens */}
          <div className="flex-1 p-6 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Carrinho vazio</h3>
                <p className="text-gray-500">Adicione produtos ao carrinho para continuar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item, index) => {
                  const product = getProductById(item.productId)
                  if (!product) return null

                  const variation = item.variationId ? getVariationById(item.productId, item.variationId) : undefined
                  const currentPrice = variation?.salePrice || (product.isOffer && product.offerPrice ? product.offerPrice : product.salePrice)
                  const productImage = variation?.image || product.image
                  const uniqueKey = item.variationId ? `${item.productId}-${item.variationId}` : `${item.productId}-${item.size}-${item.color}`

                  // Construir informações da variação
                  const variationInfo = []
                  if (variation) {
                    Object.entries(variation.attributes).forEach(([key, value]) => {
                      const attrInfo = variation.attributeValues?.find(av => av.value === value)
                      const displayValue = attrInfo?.displayValue || value
                      const attrName = key === 'size' ? 'Tamanho' : 
                                      key === 'color' ? 'Cor' :
                                      key === 'material' ? 'Material' : key
                      variationInfo.push(`${attrName}: ${displayValue}`)
                    })
                  } else {
                    // Sistema antigo
                    if (item.size) variationInfo.push(`Tamanho: ${item.size}`)
                    if (item.color) variationInfo.push(`Cor: ${item.color}`)
                  }

                  return (
                    <Card key={uniqueKey} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Imagem do produto */}
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {productImage ? (
                              <img
                                src={productImage}
                                alt={product.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <ShoppingCart className="w-8 h-8 text-gray-400" />
                            )}
                          </div>

                          {/* Informações do produto */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">{product.name}</h4>
                            {variationInfo.length > 0 && (
                              <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                                {variationInfo.map((info, idx) => (
                                  <span key={idx}>{info}</span>
                                ))}
                              </div>
                            )}
                            <p className="text-lg font-bold text-red-600">
                              {formatCurrency(currentPrice)}
                            </p>
                          </div>

                          {/* Controles de quantidade */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 p-0"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                              className="w-8 h-8 p-0"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Preço total do item */}
                          <div className="text-right">
                            <p className="font-bold text-lg text-gray-900">
                              {formatCurrency(currentPrice * item.quantity)}
                            </p>
                          </div>

                          {/* Botão remover */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRemoveFromCart(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Formulário e resumo */}
          {cart.length > 0 && (
            <div className="lg:w-96 border-l border-gray-200 p-6 bg-gray-50">
              <div className="space-y-6">
                {/* Resumo do pedido */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal ({cart.length} item(s)):</span>
                      <span>{formatCurrency(getTotalPrice())}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span className="text-red-600">{formatCurrency(getTotalPrice())}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Formulário de dados do cliente */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Dados do Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <div>
                        <Label htmlFor="studentName">Nome Completo *</Label>
                        <Input
                          id="studentName"
                          {...register('studentName')}
                          placeholder="Seu nome completo"
                          className="mt-1"
                        />
                        {errors.studentName && (
                          <p className="text-red-600 text-sm mt-1">{errors.studentName.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="studentEmail">Email *</Label>
                        <Input
                          id="studentEmail"
                          type="email"
                          {...register('studentEmail')}
                          placeholder="seu@email.com"
                          className="mt-1"
                        />
                        {errors.studentEmail && (
                          <p className="text-red-600 text-sm mt-1">{errors.studentEmail.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="studentPhone">Telefone *</Label>
                        <Input
                          id="studentPhone"
                          {...register('studentPhone')}
                          onChange={(e) => {
                            const formatted = formatPhone(e.target.value)
                            setValue('studentPhone', formatted)
                          }}
                          placeholder="(11) 99999-9999"
                          className="mt-1"
                          maxLength={15}
                        />
                        {errors.studentPhone && (
                          <p className="text-red-600 text-sm mt-1">{errors.studentPhone.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="notes">Observações</Label>
                        <Input
                          id="notes"
                          {...register('notes')}
                          placeholder="Observações sobre o pedido (opcional)"
                          className="mt-1"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5 mr-2" />
                            Finalizar e Pagar
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Método de Pagamento */}
      <PaymentMethodModal
        isOpen={isPaymentMethodModalOpen}
        onClose={() => setIsPaymentMethodModalOpen(false)}
        orderId={currentOrderId}
        amount={getTotalPrice()}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  )
}
