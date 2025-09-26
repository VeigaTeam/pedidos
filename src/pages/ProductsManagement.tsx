import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useProducts } from '@/hooks/supabase/useProducts'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { pdfService } from '@/lib/pdfService'
import { ProductMediaUpload } from '@/components/ProductMediaUpload'
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
} from 'lucide-react'

export default function ProductsManagement() {
  const { products, loading, error, deleteProduct } = useProducts()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [selectedProductForMedia, setSelectedProductForMedia] = useState<string | null>(null)

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    return matchesSearch && matchesCategory
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

  const categories = [
    { value: 'all', label: 'Todas as Categorias' },
    { value: 'camisetas', label: 'Camisetas' },
    { value: 'shorts', label: 'Shorts' },
    { value: 'equipamentos', label: 'Equipamentos' }
  ]

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category)
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
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="category">Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
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
                          onClick={() => setEditingProduct(product.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedProductForMedia(product.id)}
                        >
                          <Image className="w-4 h-4" />
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
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome do Produto</Label>
                    <Input id="name" placeholder="Ex: Camiseta Academia" />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="camisetas">Camisetas</SelectItem>
                        <SelectItem value="shorts">Shorts</SelectItem>
                        <SelectItem value="equipamentos">Equipamentos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input id="description" placeholder="Descrição do produto" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="purchasePrice">Preço de Compra</Label>
                    <Input id="purchasePrice" type="number" step="0.01" placeholder="0.00" />
                  </div>
                  <div>
                    <Label htmlFor="salePrice">Preço de Venda</Label>
                    <Input id="salePrice" type="number" step="0.01" placeholder="0.00" />
                  </div>
                  <div>
                    <Label htmlFor="stock">Estoque</Label>
                    <Input id="stock" type="number" placeholder="0" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minStock">Estoque Mínimo</Label>
                    <Input id="minStock" type="number" placeholder="0" />
                  </div>
                  <div>
                    <Label htmlFor="image">URL da Imagem</Label>
                    <Input id="image" placeholder="https://..." />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
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
    </div>
  )
}
