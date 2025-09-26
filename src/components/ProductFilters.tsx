import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, Filter, SortAsc, SortDesc, Tag, X } from 'lucide-react'
import type { ProductFilters } from '@/hooks/supabase/usePublicProducts'

interface ProductFiltersProps {
  filters: ProductFilters
  onFiltersChange: (filters: ProductFilters) => void
  onClearFilters: () => void
}

export function ProductFilters({ filters, onFiltersChange, onClearFilters }: ProductFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ProductFilters>(filters)

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleClearFilters = () => {
    const defaultFilters: ProductFilters = {
      search: '',
      category: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
      showOffersOnly: false
    }
    setLocalFilters(defaultFilters)
    onClearFilters()
  }

  const hasActiveFilters = 
    localFilters.search || 
    localFilters.category !== 'all' || 
    localFilters.showOffersOnly ||
    localFilters.sortBy !== 'name' ||
    localFilters.sortOrder !== 'asc'

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtros e Ordenação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Busca */}
        <div>
          <Label htmlFor="search">Buscar produtos</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Digite o nome do produto..."
              value={localFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Categoria */}
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={localFilters.category}
              onValueChange={(value) => handleFilterChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="camisetas">Camisetas</SelectItem>
                <SelectItem value="shorts">Shorts</SelectItem>
                <SelectItem value="equipamentos">Equipamentos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ordenação */}
          <div>
            <Label htmlFor="sortBy">Ordenar por</Label>
            <Select
              value={localFilters.sortBy}
              onValueChange={(value: 'name' | 'price' | 'created_at') => 
                handleFilterChange('sortBy', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="price">Preço</SelectItem>
                <SelectItem value="created_at">Data de criação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ordem */}
          <div>
            <Label htmlFor="sortOrder">Ordem</Label>
            <Select
              value={localFilters.sortOrder}
              onValueChange={(value: 'asc' | 'desc') => 
                handleFilterChange('sortOrder', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">
                  <div className="flex items-center gap-2">
                    <SortAsc className="w-4 h-4" />
                    Crescente
                  </div>
                </SelectItem>
                <SelectItem value="desc">
                  <div className="flex items-center gap-2">
                    <SortDesc className="w-4 h-4" />
                    Decrescente
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Apenas ofertas */}
          <div className="flex items-end">
            <Button
              variant={localFilters.showOffersOnly ? "default" : "outline"}
              onClick={() => handleFilterChange('showOffersOnly', !localFilters.showOffersOnly)}
              className="w-full"
            >
              <Tag className="w-4 h-4 mr-2" />
              Apenas Ofertas
            </Button>
          </div>
        </div>

        {/* Botão limpar filtros */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
            >
              <X className="w-4 h-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
