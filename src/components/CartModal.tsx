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
import { ShoppingCart, X, Plus, Minus, Trash2, User } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types'

const orderSchema = z.object({
  studentName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  studentEmail: z.string().email('Email inválido'),
  studentPhone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  notes: z.string().optional()
})

interface CartItem {
  productId: string
  quantity: number
  size?: string
  color?: string
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
  const { toast } = useToast()
  const { createOrder } = useOrders()
  const { products } = useProducts()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
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

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const product = getProductById(item.productId)
      const price = product ? (product.isOffer && product.offerPrice ? product.offerPrice : product.salePrice) : 0
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
        
        const price = product.isOffer && product.offerPrice ? product.offerPrice : product.salePrice
        return {
          productId: item.productId,
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
            salePrice: product.isOffer && product.offerPrice ? product.offerPrice : product.salePrice,
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
        studentPhone: data.studentPhone,
        totalAmount: getTotalPrice(),
        items: orderItems,
        notes: data.notes || '',
        status: 'pending' as const
      }

      await createOrder(orderData)
      
      toast({
        title: "Pedido realizado!",
        description: "Seu pedido foi enviado com sucesso. Em breve entraremos em contato.",
      })

      // Limpar carrinho e fechar modal
      onUpdateCart([])
      reset()
      onClose()

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

                  return (
                    <Card key={`${item.productId}-${item.size}-${item.color}`} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Imagem do produto */}
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {product.image ? (
                              <img
                                src={product.image}
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
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              {item.size && <span>Tamanho: {item.size}</span>}
                              {item.color && <span>Cor: {item.color}</span>}
                            </div>
                            <p className="text-lg font-bold text-red-600">
                              {formatCurrency(product.isOffer && product.offerPrice ? product.offerPrice : product.salePrice)}
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
                              {formatCurrency((product.isOffer && product.offerPrice ? product.offerPrice : product.salePrice) * item.quantity)}
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
                          placeholder="(11) 99999-9999"
                          className="mt-1"
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
                            <ShoppingCart className="w-5 h-5 mr-2" />
                            Finalizar Pedido
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
    </div>
  )
}
