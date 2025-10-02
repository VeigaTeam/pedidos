import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  X, 
  Save, 
  Info,
  Calendar,
  DollarSign,
  Percent,
  Hash,
  Users,
  Target,
  Key,
  Clock,
  AlertCircle
} from 'lucide-react'
import { Promotion, PromotionFormData } from '../../types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
// import { Badge } from '../ui/badge'

interface PromotionFormDialogProps {
  promotion?: Promotion | null
  onClose: () => void
  onSubmit: (data: PromotionFormData) => void
}

export const PromotionFormDialog: React.FC<PromotionFormDialogProps> = ({
  promotion,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<PromotionFormData>({
    name: '',
    description: '',
    code: '',
    promotionType: 'percentage_discount',
    discountValue: 0,
    discountPercentage: undefined,
    minDiscountValue: undefined,
    maxDiscountValue: undefined,
    minQuantity: 1,
    minCartValue: undefined,
    maxUses: undefined,
    maxUsesPerUser: undefined,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    isActive: true,
    isPublic: true,
    autoApply: false,
    excludedProducts: [],
    requiredProducts: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (promotion) {
      setFormData({
        name: promotion.name,
        description: promotion.description || '',
        code: promotion.code || '',
        promotionType: promotion.promotionType,
        discountValue: promotion.discountValue,
        discountPercentage: promotion.discountPercentage || 0,
        minDiscountValue: promotion.minDiscountValue || 0,
        maxDiscountValue: promotion.maxDiscountValue || 0,
        minQuantity: promotion.minQuantity,
        minCartValue: promotion.minCartValue || 0,
        maxUses: promotion.maxUses,
        maxUsesPerUser: promotion.maxUsesPerUser,
        startDate: typeof promotion.startDate === 'string' ? promotion.startDate.split('T')[0] : promotion.startDate.toISOString().split('T')[0],
        endDate: typeof promotion.endDate === 'string' ? promotion.endDate.split('T')[0] : promotion.endDate.toISOString().split('T')[0],
        isActive: promotion.isActive,
        isPublic: promotion.isPublic || false,
        autoApply: promotion.autoApply || false,
        excludedProducts: promotion.excludedProducts || [],
        requiredProducts: promotion.requiredProducts || [],
      })
    }
  }, [promotion])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (!formData.promotionType) {
      newErrors.promotionType = 'Tipo de promoção é obrigatório'
    }

    if (formData.promotionType === 'percentage_discount' && (formData.discountPercentage === undefined || formData.discountPercentage <= 0)) {
      newErrors.discountPercentage = 'Porcentagem deve ser maior que 0'
    }

    if (formData.promotionType !== 'percentage_discount' && (!formData.discountValue || formData.discountValue <= 0)) {
      newErrors.discountValue = 'Valor do desconto deve ser maior que 0'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Data de início é obrigatória'
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Data de fim é obrigatória'
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'Data de fim deve ser posterior à data de início'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Erro ao salvar promoção:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof PromotionFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const getPromotionTypeOptions = () => [
    { value: 'percentage_discount', label: 'Desconto em %', icon: Percent },
    { value: 'fixed_discount', label: 'Desconto Fixo', icon: DollarSign },
    { value: 'buy_x_get_y', label: 'Leve X Pague Y', icon: Target },
    { value: 'free_shipping', label: 'Frete Grátis', icon: Users },
    { value: 'cashback', label: 'Cashback', icon: DollarSign },
    { value: 'bundle_discount', label: 'Pacote', icon: Target },
    { value: 'category_discount', label: 'Categoria', icon: Hash },
    { value: 'brand_discount', label: 'Marca', icon: Hash },
    { value: 'stock_clearance', label: 'Saída de Estoque', icon: Clock },
  ]

  // const requiresCode = formData.promotionType === 'buy_x_get_y' || !formData.isPublic

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {promotion ? 'Editar Promoção' : 'Nova Promoção'}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Informações Básicas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Promoção *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ex: Black Friday"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    placeholder="Ex: BLACK50"
                    className={errors.code ? 'border-red-500' : ''}
                  />
                  {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Key className="h-4 w-4" />
                    <span>Clientes usarão este código para aplicar a promoção</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva os benefícios desta promoção..."
                  rows={3}
                />
              </div>
            </div>

            {/* Promotion Type */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Tipo de Promoção
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="promotionType">Tipo *</Label>
                <Select
                  value={formData.promotionType}
                  onValueChange={(value) => handleInputChange('promotionType', value)}
                >
                  <SelectTrigger className={errors.promotionType ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione o tipo de promoção" />
                  </SelectTrigger>
                  <SelectContent>
                    {getPromotionTypeOptions().map((option) => {
                      const Icon = option.icon
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {errors.promotionType && <p className="text-sm text-red-500">{errors.promotionType}</p>}
              </div>

              {/* Dynamic Fields based on promotion type */}
              {formData.promotionType === 'percentage_discount' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discountPercentage">Porcentagem *</Label>
                    <div className="relative">
                      <Input
                        id="discountPercentage"
                        type="number"
                        value={formData.discountPercentage}
                        onChange={(e) => handleInputChange('discountPercentage', e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="0"
                        max={100}
                        className={errors.discountPercentage ? 'border-red-500 pr-8' : 'pr-8'}
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        %
                      </span>
                    </div>
                    {errors.discountPercentage && <p className="text-sm text-red-500">{errors.discountPercentage}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="minDiscountValue">Valor Mín.</Label>
                    <Input
                      id="minDiscountValue"
                      type="number"
                      value={formData.minDiscountValue}
                      onChange={(e) => handleInputChange('minDiscountValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="0,00"
                      min={0}
                      step="0.01"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscountValue">Valor Máx.</Label>
                    <Input
                      id="maxDiscountValue"
                      type="number"
                      value={formData.maxDiscountValue}
                      onChange={(e) => handleInputChange('maxDiscountValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="0,00"
                      min={0}
                      step="0.01"
                    />
                  </div>
                </div>
              )}

              {formData.promotionType !== 'percentage_discount' && (
                <div className="space-y-2">
                  <Label htmlFor="discountValue">Valor do Desconto *</Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => handleInputChange('discountValue', parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    min={0}
                    step="0.01"
                    className={errors.discountValue ? 'border-red-500' : ''}
                  />
                  {errors.discountValue && <p className="text-sm text-red-500">{errors.discountValue}</p>}
                </div>
              )}
            </div>

            {/* Conditions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Condições
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minQuantity">Qtd. Mínima</Label>
                  <Input
                    id="minQuantity"
                    type="number"
                    value={formData.minQuantity}
                    onChange={(e) => handleInputChange('minQuantity', parseInt(e.target.value) || 1)}
                    placeholder="1"
                    min={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minCartValue">Valor Mín. Carrinho</Label>
                  <Input
                    id="minCartValue"
                    type="number"
                    value={formData.minCartValue}
                    onChange={(e) => handleInputChange('minCartValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0,00"
                    min={0}
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxUses">Máx. Usos</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    value={formData.maxUses || ''}
                    onChange={(e) => handleInputChange('maxUses', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Ilimitado"
                    min={1}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUsesPerUser">Máx. Usos por Usuário</Label>
                <Input
                  id="maxUsesPerUser"
                  type="number"
                  value={formData.maxUsesPerUser || ''}
                  onChange={(e) => handleInputChange('maxUsesPerUser', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Ilimitado"
                  min={1}
                />
              </div>
            </div>

            {/* Period */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Período de Validade
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data de Início *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className={errors.startDate ? 'border-red-500' : ''}
                  />
                  {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Data de Fim *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className={errors.endDate ? 'border-red-500' : ''}
                  />
                  {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Opções</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                  <Label htmlFor="isActive" className="text-sm font-medium">
                    Promoção ativa (clients podem usar)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
                  />
                  <Label htmlFor="isPublic" className="text-sm font-medium">
                    Promoção pública (visível para todos)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoApply"
                    checked={formData.autoApply}
                    onCheckedChange={(checked) => handleInputChange('autoApply', checked)}
                  />
                  <Label htmlFor="autoApply" className="text-sm font-medium">
                    Aplicar automaticamente (nas condições adequadas)
                  </Label>
                </div>
              </div>
            </div>

            {/* Validation Alert */}
            {Object.keys(errors).length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-sm text-red-600">
                  Por favor, corrija os erros antes de continuar.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {promotion ? 'Atualizar' : 'Criar'} Promoção
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
