import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
 Search, 
  Edit2, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Key,
  Target,
  Percent,
  Truck
} from 'lucide-react'
import { usePromotions } from '../hooks/supabase/usePromotions'
import { Promotion, PromotionFormData } from '../types'
import { PromotionFormDialog } from '../components/Promotion/PromotionFormDialog'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import { formatCurrency, formatDate } from '../lib/utils'

const PromotionsManagement: React.FC = () => {
  const {
    promotions,
    loading,
    error,
    createPromotion,
    updatePromotion,
    deletePromotion,
    togglePromotionActive,
    getPromotionStats
  } = usePromotions()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  // const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null)
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [stats, setStats] = useState<any>(null)

  React.useEffect(() => {
    if (promotions.length > 0) {
      getPromotionStats().then(setStats)
    }
  }, [promotions, getPromotionStats])

  const filteredPromotions = promotions.filter(promotion => {
    const matchesSearch = promotion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promotion.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promotion.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'active' && promotion.isActive) ||
                         (filterType === 'inactive' && !promotion.isActive) ||
                         (filterType === 'public' && promotion.isPublic) ||
                         filterType === promotion.promotionType

    return matchesSearch && matchesFilter
  })

  const getPromotionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      percentage_discount: 'Desconto %',
      fixed_discount: 'Desconto Fixo',
      buy_x_get_y: 'Leve X Pague Y',
      free_shipping: 'Frete Grátis',
      cashback: 'Cashback',
      bundle_discount: 'Pacote',
      category_discount: 'Categoria',
      brand_discount: 'Marca',
      stock_clearance: 'Saída'
    }
    return labels[type] || type
  }

  const getPromotionTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage_discount':
        return <Percent className="h-4 w-4" />
      case 'fixed_discount':
        return <DollarSign className="h-4 w-4" />
      case 'buy_x_get_y':
        return <Target className="h-4 w-4" />
      case 'free_shipping':
        return <Truck className="h-4 w-4" />
      case 'cashback':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Badge className="h-4 w-4" />
    }
  }

  const handleCreatePromotion = async (data: PromotionFormData): Promise<void> => {
    try {
      await createPromotion(data)
      setShowFormDialog(false)
    } catch (error) {
      console.error('Erro ao criar promoção:', error)
    }
  }

  const handleUpdatePromotion = async (id: string, data: Partial<PromotionFormData>) => {
    try {
      await updatePromotion(id, data)
      setEditingPromotion(null)
    } catch (error) {
      console.error('Erro ao atualizar promoção:', error)
    }
  }

  const handleDeletePromotion = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar esta promoção?')) {
      try {
        await deletePromotion(id)
      } catch (error) {
        console.error('Erro ao deletar promoção:', error)
      }
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await togglePromotionActive(id, !currentStatus)
    } catch (error) {
      console.error('Erro ao alterar status:', error)
    }
  }

  const isLoading = loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const hasError = error
  if (hasError) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">
          <p className="text-lg font-semibold">Erro ao carregar promoções</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Promoções</h1>
          <p className="text-gray-600 mt-1">Gerencie promoções, descontos e campanhas especiais</p>
        </div>
        <Button 
          onClick={() => setShowFormDialog(true)}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Promoção
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Promoções</p>
                  <p className="text-2xl font-bold">{promotions.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ativas</p>
                  <p className="text-2xl font-bold text-green-600">{promotions.filter(p => p.isActive).length}</p>
                </div>
                <ToggleRight className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Públicas</p>
                  <p className="text-2xl font-bold text-blue-600">{promotions.filter(p => p.isPublic).length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(promotions.reduce((sum, p) => sum + (p.totalRedeemedAmount || 0), 0))}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar promoções..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={filterType} onValueChange={setFilterType}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="active">Ativas</TabsTrigger>
            <TabsTrigger value="inactive">Inativas</TabsTrigger>
            <TabsTrigger value="public">Públicas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredPromotions.map((promotion) => (
            <motion.div
              key={promotion.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={`relative transition-all duration-200 hover:shadow-lg ${
                !promotion.isActive ? 'opacity-60' : ''
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {promotion.name}
                      </CardTitle>
                      <CardDescription className="mt-1 text-gray-600">
                        {promotion.description || 'Sem descrição'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {promotion.isPublic && (
                        <Badge variant="secondary" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          Público
                        </Badge>
                      )}
                      {promotion.autoApply && (
                        <Badge variant="outline" className="text-xs">
                          <Target className="h-3 w-3 mr-1" />
                          Auto
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Promotion Type & Value */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1 text-sm font-medium text-primary">
                      {getPromotionTypeIcon(promotion.promotionType)}
                      {getPromotionTypeLabel(promotion.promotionType)}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {promotion.promotionType === 'percentage_discount' && promotion.discountPercentage
                        ? `${promotion.discountPercentage}%`
                        : formatCurrency(promotion.discountValue)}
                    </Badge>
                  </div>

                  {/* Code */}
                  {promotion.code && (
                    <div className="flex items-center gap-2 mb-3">
                      <Key className="h-4 w-4 text-gray-500" />
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {promotion.code}
                      </code>
                    </div>
                  )}

                  {/* Period */}
                  <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}</span>
                  </div>

                  {/* Usage Stats */}
                  {(promotion.maxUses || promotion.currentUses > 0) && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Uso</span>
                        <span className="font-medium">
                          {promotion.currentUses}{promotion.maxUses ? ` / ${promotion.maxUses}` : ''}
                        </span>
                      </div>
                      {promotion.maxUses && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min((promotion.currentUses / promotion.maxUses) * 100, 100)}%`
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingPromotion(promotion)
                        setShowFormDialog(true)
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(promotion.id, promotion.isActive)}
                      className={promotion.isActive ? 'text-green-600 hover:text-green-700' : 'text-gray-500'}
                    >
                      {promotion.isActive ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeletePromotion(promotion.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredPromotions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <TrendingUp className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma promoção encontrada
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterType !== 'all' 
              ? 'Tente ajustar os filtros de busca.'
              : 'Comece criando sua primeira promoção.'}
          </p>
          {!searchTerm && filterType === 'all' && (
            <Button onClick={() => setShowFormDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Promoção
            </Button>
          )}
        </div>
      )}

      {/* Form Dialog */}
      <AnimatePresence>
        {showFormDialog && (
          <PromotionFormDialog
            promotion={editingPromotion}
            onClose={() => {
              setShowFormDialog(false)
              setEditingPromotion(null)
            }}
            onSubmit={editingPromotion ? 
              (data) => handleUpdatePromotion(editingPromotion.id, data) :
              handleCreatePromotion
            }
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default PromotionsManagement