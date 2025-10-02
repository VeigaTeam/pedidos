import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { backupService } from '@/lib/backupService'
import { useToast } from '@/hooks/use-toast'
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  Clock, 
  HardDrive,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react'

export default function BackupManagement() {
  const [localBackups, setLocalBackups] = useState<any[]>([])
  const [databaseBackups, setDatabaseBackups] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [backupInterval, setBackupInterval] = useState(24)
  const [isAutomaticBackup, setIsAutomaticBackup] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadBackups()
    checkAutomaticBackupStatus()
  }, [])

  const loadBackups = async () => {
    setLoading(true)
    try {
      const [local, database] = await Promise.all([
        Promise.resolve(backupService.getLocalBackups()),
        backupService.getDatabaseBackups()
      ])
      
      setLocalBackups(local)
      setDatabaseBackups(database)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar backups.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const checkAutomaticBackupStatus = () => {
    // Verificar se há backup automático configurado
    const interval = localStorage.getItem('backup_interval')
    if (interval) {
      setBackupInterval(parseInt(interval))
      setIsAutomaticBackup(true)
    }
  }

  const createBackup = async () => {
    setLoading(true)
    try {
      const result = await backupService.createBackup()
      
      if (result.success) {
        toast({
          title: "Backup criado",
          description: "Backup criado com sucesso.",
        })
        await loadBackups()
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao criar backup.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar backup.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const restoreBackup = async (backup: any) => {
    if (!confirm(`Tem certeza que deseja restaurar o backup de ${new Date(backup.timestamp).toLocaleString('pt-BR')}? Esta ação irá sobrescrever os dados atuais.`)) {
      return
    }

    setLoading(true)
    try {
      const result = await backupService.restoreFromBackup(backup)
      
      if (result.success) {
        toast({
          title: "Backup restaurado",
          description: "Backup restaurado com sucesso.",
        })
        // Recarregar a página para refletir as mudanças
        window.location.reload()
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao restaurar backup.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao restaurar backup.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadBackup = (backup: any) => {
    try {
      const dataStr = JSON.stringify(backup, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `backup-${new Date(backup.timestamp).toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Backup baixado",
        description: "Backup baixado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao baixar backup.",
        variant: "destructive"
      })
    }
  }

  const uploadBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string)
        
        if (!backupData.timestamp || !backupData.version) {
          throw new Error('Arquivo de backup inválido')
        }

        const result = await backupService.restoreFromBackup(backupData)
        
        if (result.success) {
          toast({
            title: "Backup restaurado",
            description: "Backup foi restaurado com sucesso.",
          })
          await loadBackups()
          window.location.reload()
        } else {
          toast({
            title: "Erro",
            description: result.error || "Erro ao restaurar backup.",
            variant: "destructive"
          })
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Arquivo de backup inválido.",
          variant: "destructive"
        })
      }
    }
    reader.readAsText(file)
  }

  const startAutomaticBackup = () => {
    backupService.startAutomaticBackup(backupInterval)
    localStorage.setItem('backup_interval', backupInterval.toString())
    setIsAutomaticBackup(true)
    
    toast({
      title: "Backup automático iniciado",
      description: `Backup automático configurado para ${backupInterval} horas.`,
    })
  }

  const stopAutomaticBackup = () => {
    backupService.stopAutomaticBackup()
    localStorage.removeItem('backup_interval')
    setIsAutomaticBackup(false)
    
    toast({
      title: "Backup automático parado",
      description: "Backup automático foi desativado.",
    })
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR')
  }

  const formatSize = (backup: any) => {
    const size = JSON.stringify(backup).length
    return `${(size / 1024).toFixed(2)} KB`
  }

  const getBackupSummary = (backup: any) => {
    return `${backup.products.length} produtos, ${backup.orders.length} pedidos, ${backup.orderItems.length} itens`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Gerenciamento de Backup</h1>
          <p className="text-muted-foreground">
            Gerencie backups automáticos e manuais do sistema
          </p>
        </div>
        <Button onClick={createBackup} disabled={loading}>
          <Database className="w-4 h-4 mr-2" />
          Criar Backup
        </Button>
      </div>

      {/* Configurações de Backup Automático */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Backup Automático
          </CardTitle>
          <CardDescription>
            Configure backups automáticos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <Label htmlFor="interval">Intervalo (horas)</Label>
              <Input
                id="interval"
                type="number"
                min="1"
                max="168"
                value={backupInterval}
                onChange={(e) => setBackupInterval(parseInt(e.target.value) || 24)}
                className="w-32"
              />
            </div>
            {isAutomaticBackup ? (
              <Button variant="destructive" onClick={stopAutomaticBackup}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Parar Backup Automático
              </Button>
            ) : (
              <Button onClick={startAutomaticBackup}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Iniciar Backup Automático
              </Button>
            )}
          </div>
          {isAutomaticBackup && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              Backup automático ativo (intervalo: {backupInterval}h)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload de Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Restaurar Backup
          </CardTitle>
          <CardDescription>
            Faça upload de um arquivo de backup para restaurar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".json"
              onChange={uploadBackup}
              className="flex-1"
            />
            <Button variant="outline" onClick={loadBackups}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backups Locais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Backups Locais
          </CardTitle>
          <CardDescription>
            Backups armazenados localmente no navegador
          </CardDescription>
        </CardHeader>
        <CardContent>
          {localBackups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum backup local encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Resumo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localBackups.map((backup, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {formatDate(backup.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell>{backup.version}</TableCell>
                    <TableCell>{getBackupSummary(backup)}</TableCell>
                    <TableCell>{formatSize(backup)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadBackup(backup)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => restoreBackup(backup)}
                          disabled={loading}
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Backups do Banco de Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Backups do Banco de Dados
          </CardTitle>
          <CardDescription>
            Backups armazenados no banco de dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {databaseBackups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum backup do banco encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Resumo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {databaseBackups.map((backup, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {formatDate(backup.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell>{backup.version}</TableCell>
                    <TableCell>{getBackupSummary(backup)}</TableCell>
                    <TableCell>{formatSize(backup)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadBackup(backup)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => restoreBackup(backup)}
                          disabled={loading}
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
