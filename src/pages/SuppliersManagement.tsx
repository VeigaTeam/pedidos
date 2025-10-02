import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSuppliers } from '@/hooks/supabase/useSuppliers'
import { useToast } from '@/hooks/use-toast'
import { formatCNPJ, formatPhone, cleanCNPJ, cleanPhone } from '@/lib/utils'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building2, 
  Search,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'

export default function SuppliersManagement() {
  const { suppliers, loading, error, createSupplier, updateSupplier, deleteSupplier } = useSuppliers()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddingSupplier, setIsAddingSupplier] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    cnpj: '',
    address: '',
    notes: ''
  })

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const resetForm = () => {
    setFormData({
      name: '',
      contactName: '',
      email: '',
      phone: '',
      cnpj: '',
      address: '',
      notes: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Limpa os dados das máscaras antes de salvar
      const cleanedData = {
        ...formData,
        phone: cleanPhone(formData.phone),
        cnpj: cleanCNPJ(formData.cnpj)
      }
      
      if (editingSupplier) {
        await updateSupplier(editingSupplier, cleanedData)
        toast({
          title: "Fornecedor atualizado",
          description: "Fornecedor atualizado com sucesso.",
        })
      } else {
        await createSupplier({
          ...cleanedData,
          isActive: true
        })
        toast({
          title: "Fornecedor criado",
          description: "Fornecedor criado com sucesso.",
        })
      }
      
      resetForm()
      setEditingSupplier(null)
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar fornecedor.",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (supplier: typeof suppliers[0]) => {
    setFormData({
      name: supplier.name,
      contactName: supplier.contactName || '',
      email: supplier.email || '',
      phone: formatPhone(supplier.phone || ''),
      cnpj: formatCNPJ(supplier.cnpj || ''),
      address: supplier.address || '',
      notes: supplier.notes || ''
    })
    setEditingSupplier(supplier.id)
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o fornecedor "${name}"?`)) {
      try {
        await deleteSupplier(id)
        toast({
          title: "Fornecedor excluído",
          description: "Fornecedor excluído com sucesso.",
        })
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir fornecedor.",
          variant: "destructive"
        })
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando fornecedores...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">Erro ao carregar fornecedores: {error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Gestão de Fornecedores</h1>
          <p className="text-muted-foreground">
            Gerencie os fornecedores da academia
          </p>
        </div>
        <Button onClick={() => setIsAddingSupplier(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Fornecedor
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar Fornecedores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, contato, email ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Fornecedores ({filteredSuppliers.length})
          </CardTitle>
          <CardDescription>
            Lista de todos os fornecedores cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        {supplier.notes && (
                          <p className="text-sm text-muted-foreground">
                            {supplier.notes}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{supplier.contactName || '-'}</TableCell>
                    <TableCell>
                      {supplier.email ? (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {supplier.email}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {supplier.phone ? (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {formatPhone(supplier.phone)}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {supplier.cnpj ? formatCNPJ(supplier.cnpj) : '-'}
                    </TableCell>
                    <TableCell>
                      {supplier.address ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-48">{supplier.address}</span>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(supplier)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(supplier.id, supplier.name)}
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

      {/* Modal de Adicionar/Editar Fornecedor */}
      {(isAddingSupplier || editingSupplier) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {isAddingSupplier ? 'Adicionar Fornecedor' : 'Editar Fornecedor'}
              </CardTitle>
              <CardDescription>
                {isAddingSupplier 
                  ? 'Preencha os dados do novo fornecedor' 
                  : 'Edite as informações do fornecedor'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome do Fornecedor *</Label>
                    <Input 
                      id="name" 
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Fornecedor de Roupas Ltda" 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactName">Nome do Contato</Label>
                    <Input 
                      id="contactName" 
                      value={formData.contactName}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                      placeholder="Ex: João Silva" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="contato@fornecedor.com" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input 
                      id="phone" 
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                      placeholder="(11) 99999-9999" 
                      maxLength={15}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input 
                    id="cnpj" 
                    value={formData.cnpj}
                    onChange={(e) => setFormData(prev => ({ ...prev, cnpj: formatCNPJ(e.target.value) }))}
                    placeholder="XX.XXX.XXX/XXXX-XX" 
                    maxLength={18}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input 
                    id="address" 
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Rua, número, bairro, cidade - UF" 
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Input 
                    id="notes" 
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Informações adicionais sobre o fornecedor" 
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm()
                      setIsAddingSupplier(false)
                      setEditingSupplier(null)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {isAddingSupplier ? 'Adicionar' : 'Salvar'}
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
