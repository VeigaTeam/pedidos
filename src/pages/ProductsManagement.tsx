import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useProducts } from '@/hooks/supabase/useProducts'
import { useBrands } from '@/hooks/supabase/useBrands'
import { useSuppliers } from '@/hooks/supabase/useSuppliers'
import { useCategories } from '@/hooks/supabase/useCategories'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { pdfService } from '@/lib/pdfService'
import { ProductMediaUpload } from '@/components/ProductMediaUpload'
import { VariationManager } from '@/components/VariationManager'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Search,
  Filter,
  FileText,
  Image,
  X,
  Layers,
} from 'lucide-react'

export default function ProductsManagement() {
  const { products, loading, error, deleteProduct, createProduct, updateProduct } = useProducts()
  const { brands } = useBrands()
  const { suppliers } = useSuppliers()
  const { categories } = useCategories()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const [supplierFilter, setSupplierFilter] = useState<string>('all')
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [selectedProductForMedia, setSelectedProductForMedia] = useState<string | null>(null)
  const [selectedProductForVariations, setSelectedProductForVariations] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    brandId: '',
    supplierId: '',
    purchasePrice: '',
    salePrice: '',
    stock: '',
    minStock: '',
    image: ''
  })

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    const matchesBrand = brandFilter === 'all' || product.brandId === brandFilter
    const matchesSupplier = supplierFilter === 'all' || product.supplierId === supplierFilter
    return matchesSearch && matchesCategory && matchesBrand && matchesSupplier
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando produtos...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">Erro ao carregar produtos: {error}</div>
      </div>
    )
  }

  const generateProductsPDF = () => {
    try {
      const doc = pdfService.generateProductsReport(products)
      pdfService.downloadPDF(doc, `relatorio-produtos-${new Date().toISOString().split('T')[0]}.pdf`)
      
      toast({
        title: "Relatório gerado",
        description: "Relatório de produtos baixado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao gerar o PDF.",
        variant: "destructive"
      })
    }
  }

  // Categorias dinâmicas da tabela categories
  const categoryOptions = [
    { value: 'all', label: 'Todas as Categorias' },
    ...categories
      .filter(cat => cat.isActive)
      .map(cat => ({
        value: cat.name.toLowerCase(),
        label: cat.name
      }))
  ]

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      brandId: 'none',
      supplierId: 'none',
      purchasePrice: '',
      salePrice: '',
      stock: '',
      minStock: '',
      image: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const productData = {
        name: formData.name,
        category: formData.category as 'camisetas' | 'shorts' | 'equipamentos',
        description: formData.description,
        brandId: formData.brandId === 'none' ? undefined : formData.brandId || undefined,
        supplierId: formData.supplierId === 'none' ? undefined : formData.supplierId || undefined,
        purchasePrice: parseFloat(formData.purchasePrice),
        salePrice: parseFloat(formData.salePrice),
        profitMargin: 0, // Será calculado automaticamente pelo trigger do banco
        stock: parseInt(formData.stock),
        minStock: parseInt(formData.minStock),
        image: formData.image || undefined,
        isActive: true,
        isOffer: false
      }

      if (editingProduct) {
        await updateProduct(editingProduct, productData)
        toast({
          title: "Produto atualizado",
          description: "Produto atualizado com sucesso.",
        })
      } else {
        await createProduct(productData)
        toast({
          title: "Produto criado",
          description: "Produto criado com sucesso.",
        })
      }
      
      resetForm()
      setIsAddingProduct(false)
      setEditingProduct(null)
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar produto.",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (product: typeof products[0]) => {
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description || '',
      brandId: product.brandId || 'none',
      supplierId: product.supplierId || 'none',
      purchasePrice: product.purchasePrice.toString(),
      salePrice: product.salePrice.toString(),
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      image: product.image || ''
    })
    setEditingProduct(product.id)
  }

  const getCategoryLabel = (category: string) => {
    const cat = categoryOptions.find(c => c.value === category)
    return cat ? cat.label : category
  }

  const getStatusColor = (product: typeof products[0]) => {
    if (!product.isActive) return 'bg-gray-100 text-gray-800'
    if (product.stock === 0) return 'bg-red-100 text-red-800'
    if (product.stock <= product.minStock) return 'bg-orange-100 text-orange-800'
    return 'bg-green-100 text-green-800'
  }

  const getStatusText = (product: typeof products[0]) => {
    if (!product.isActive) return 'Inativo'
    if (product.stock === 0) return 'Sem Estoque'
    if (product.stock <= product.minStock) return 'Estoque Baixo'
    return 'Disponível'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Gestão de Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie o catálogo de produtos da academia
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateProductsPDF}>
            <FileText className="w-4 h-4 mr-2" />
            Gerar Relatório PDF
          </Button>
          <Button onClick={() => setIsAddingProduct(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="brand">Marca</Label>
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Marcas</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="supplier">Fornecedor</Label>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Fornecedores</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Produtos ({filteredProducts.length})
          </CardTitle>
          <CardDescription>
            Lista de todos os produtos cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Preço de Compra</TableHead>
                  <TableHead>Preço de Venda</TableHead>
                  <TableHead>Margem</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {getCategoryLabel(product.category)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {product.brand ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {product.brand.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.supplier ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                          {product.supplier.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(product.purchasePrice)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(product.salePrice)}
                    </TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">
                        {product.profitMargin.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.stock}</p>
                        <p className="text-xs text-muted-foreground">
                          Mín: {product.minStock}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product)}`}>
                        {getStatusText(product)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedProductForMedia(product.id)}
                          title="Gerenciar Mídia"
                        >
                          <Image className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedProductForVariations(product.id)}
                          title="Gerenciar Variações"
                        >
                          <Layers className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            if (confirm('Tem certeza que deseja excluir este produto?')) {
                              try {
                                await deleteProduct(product.id)
                                toast({
                                  title: "Produto excluído",
                                  description: "Produto excluído com sucesso.",
                                })
                              } catch (error) {
                                toast({
                                  title: "Erro",
                                  description: "Erro ao excluir produto.",
                                  variant: "destructive"
                                })
                              }
                            }
                          }}
                          title="Excluir Produto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Adicionar/Editar Produto */}
      {(isAddingProduct || editingProduct) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {isAddingProduct ? 'Adicionar Produto' : 'Editar Produto'}
              </CardTitle>
              <CardDescription>
                {isAddingProduct 
                  ? 'Preencha os dados do novo produto' 
                  : 'Edite as informações do produto'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome do Produto *</Label>
                    <Input 
                      id="name" 
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Camiseta Academia" 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions
                          .filter(cat => cat.value !== 'all')
                          .map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input 
                    id="description" 
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição do produto" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Marca</Label>
                    <Select 
                      value={formData.brandId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, brandId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma marca (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem marca</SelectItem>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="supplier">Fornecedor</Label>
                    <Select 
                      value={formData.supplierId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, supplierId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um fornecedor (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem fornecedor</SelectItem>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="purchasePrice">Preço de Compra *</Label>
                    <Input 
                      id="purchasePrice" 
                      type="number" 
                      step="0.01" 
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
                      placeholder="0.00" 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="salePrice">Preço de Venda *</Label>
                    <Input 
                      id="salePrice" 
                      type="number" 
                      step="0.01" 
                      value={formData.salePrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, salePrice: e.target.value }))}
                      placeholder="0.00" 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock">Estoque *</Label>
                    <Input 
                      id="stock" 
                      type="number" 
                      value={formData.stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                      placeholder="0" 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minStock">Estoque Mínimo *</Label>
                    <Input 
                      id="minStock" 
                      type="number" 
                      value={formData.minStock}
                      onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
                      placeholder="0" 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="image">URL da Imagem</Label>
                    <Input 
                      id="image" 
                      value={formData.image}
                      onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="https://..." 
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm()
                      setIsAddingProduct(false)
                      setEditingProduct(null)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {isAddingProduct ? 'Adicionar' : 'Salvar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Upload de Mídia */}
      {selectedProductForMedia && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Gerenciar Mídia do Produto
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProductForMedia(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {(() => {
                const product = products.find(p => p.id === selectedProductForMedia)
                if (!product) return null
                
                return (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.description}</p>
                    </div>
                    
                    <ProductMediaUpload
                      productId={product.id}
                      currentImageUrl={product.image}
                      onMediaUploaded={() => {
                        // Atualizar o produto com a nova URL
                        toast({
                          title: "Mídia atualizada",
                          description: "A mídia do produto foi atualizada com sucesso.",
                        })
                        setSelectedProductForMedia(null)
                      }}
                      onMediaRemoved={() => {
                        toast({
                          title: "Mídia removida",
                          description: "A mídia do produto foi removida com sucesso.",
                        })
                        setSelectedProductForMedia(null)
                      }}
                    />
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gerenciamento de Variações */}
      {selectedProductForVariations && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Gerenciar Variações do Produto
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProductForVariations(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {(() => {
                const product = products.find(p => p.id === selectedProductForVariations)
                if (!product) return null
                
                return (
                  <VariationManager
                    product={product}
                    onVariationsChange={() => {
                      // Recarregar produtos para mostrar novas variações
                      toast({
                        title: "Variações atualizadas",
                        description: "As variações do produto foram atualizadas.",
                      })
                    }}
                  />
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
