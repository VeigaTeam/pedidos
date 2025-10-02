import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useBrands } from '@/hooks/supabase/useBrands'
import { useSuppliers } from '@/hooks/supabase/useSuppliers'
import { useToast } from '@/hooks/use-toast'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Tag, 
  Search,
  Building2
} from 'lucide-react'

export default function BrandsManagement() {
  const { brands, loading, error, createBrand, updateBrand, deleteBrand } = useBrands()
  const { suppliers } = useSuppliers()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [supplierFilter, setSupplierFilter] = useState<string>('all')
  const [isAddingBrand, setIsAddingBrand] = useState(false)
  const [editingBrand, setEditingBrand] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    supplierId: ''
  })

  const filteredBrands = brands.filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         brand.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSupplier = supplierFilter === 'all' || brand.supplierId === supplierFilter
    return matchesSearch && matchesSupplier
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      supplierId: 'none'
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingBrand) {
        await updateBrand(editingBrand, {
          ...formData,
          supplierId: formData.supplierId === 'none' ? undefined : formData.supplierId || undefined
        })
        toast({
          title: "Marca atualizada",
          description: "Marca atualizada com sucesso.",
        })
      } else {
        await createBrand({
          ...formData,
          supplierId: formData.supplierId === 'none' ? undefined : formData.supplierId || undefined,
          isActive: true
        })
        toast({
          title: "Marca criada",
          description: "Marca criada com sucesso.",
        })
      }
      
      resetForm()
      setIsAddingBrand(false)
      setEditingBrand(null)
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar marca.",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (brand: typeof brands[0]) => {
    setFormData({
      name: brand.name,
      description: brand.description || '',
      supplierId: brand.supplierId || 'none'
    })
    setEditingBrand(brand.id)
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir a marca "${name}"?`)) {
      try {
        await deleteBrand(id)
        toast({
          title: "Marca excluída",
          description: "Marca excluída com sucesso.",
        })
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir marca.",
          variant: "destructive"
        })
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando marcas...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">Erro ao carregar marcas: {error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Gestão de Marcas</h1>
          <p className="text-muted-foreground">
            Gerencie as marcas dos produtos da academia
          </p>
        </div>
        <Button onClick={() => setIsAddingBrand(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Marca
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
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
              <Label htmlFor="supplier">Fornecedor</Label>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um fornecedor" />
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

      {/* Lista de Marcas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Marcas ({filteredBrands.length})
          </CardTitle>
          <CardDescription>
            Lista de todas as marcas cadastradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{brand.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground">
                        {brand.description || '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      {brand.supplier ? (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {brand.supplier.name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(brand)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(brand.id, brand.name)}
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

      {/* Modal de Adicionar/Editar Marca */}
      {(isAddingBrand || editingBrand) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {isAddingBrand ? 'Adicionar Marca' : 'Editar Marca'}
              </CardTitle>
              <CardDescription>
                {isAddingBrand 
                  ? 'Preencha os dados da nova marca' 
                  : 'Edite as informações da marca'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Marca *</Label>
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Nike, Adidas, Veiga Team" 
                    required 
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input 
                    id="description" 
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição da marca" 
                  />
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

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm()
                      setIsAddingBrand(false)
                      setEditingBrand(null)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {isAddingBrand ? 'Adicionar' : 'Salvar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
