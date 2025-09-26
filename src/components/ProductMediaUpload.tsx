import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { mediaService } from '@/lib/mediaService'
import { useProducts } from '@/hooks/supabase/useProducts'
import { Upload, Image as ImageIcon, Trash2, Eye } from 'lucide-react'

interface ProductMediaUploadProps {
  productId: string
  currentImageUrl?: string
  onMediaUploaded: (url: string) => void
  onMediaRemoved: () => void
}

export function ProductMediaUpload({ 
  productId, 
  currentImageUrl, 
  onMediaUploaded, 
  onMediaRemoved 
}: ProductMediaUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { updateProductImage } = useProducts()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    const isVideo = file.type.startsWith('video/')
    const validation = mediaService.validateFileType(file, isVideo ? 'video' : 'image')
    
    if (!validation.valid) {
      toast({
        title: "Arquivo inválido",
        description: validation.error,
        variant: "destructive"
      })
      return
    }

    // Gerar preview
    const preview = mediaService.generatePreviewUrl(file)
    setPreviewUrl(preview)

    // Upload do arquivo
    setUploading(true)
    try {
      const result = await mediaService.uploadFile(file, productId, isVideo ? 'video' : 'image')
      
      if (result.success && result.url) {
        // Atualizar o produto com a nova URL
        await updateProductImage(productId, result.url)
        onMediaUploaded(result.url)
        toast({
          title: "Upload realizado",
          description: "Mídia enviada com sucesso.",
        })
      } else {
        toast({
          title: "Erro no upload",
          description: result.error || "Falha ao enviar arquivo.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro durante o upload.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
      // Limpar preview
      if (previewUrl) {
        mediaService.revokePreviewUrl(previewUrl)
        setPreviewUrl(null)
      }
    }
  }

  const handleRemoveMedia = async () => {
    if (!currentImageUrl) return

    try {
      // Extrair o caminho do arquivo da URL
      const urlParts = currentImageUrl.split('/')
      const filePath = urlParts.slice(-2).join('/') // productId/filename
      
      const result = await mediaService.deleteFile(filePath)
      
      if (result.success) {
        // Atualizar o produto removendo a URL
        await updateProductImage(productId, '')
        onMediaRemoved()
        toast({
          title: "Mídia removida",
          description: "Arquivo removido com sucesso.",
        })
      } else {
        toast({
          title: "Erro ao remover",
          description: result.error || "Falha ao remover arquivo.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao remover o arquivo.",
        variant: "destructive"
      })
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg|avi|mov)$/i)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Mídia do Produto
        </CardTitle>
        <CardDescription>
          Adicione uma imagem ou vídeo para o produto
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mídia atual */}
        {currentImageUrl && (
          <div className="space-y-2">
            <Label>Mídia Atual</Label>
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              {isVideo(currentImageUrl) ? (
                <video
                  className="w-full h-full object-cover"
                  controls
                  preload="metadata"
                >
                  <source src={currentImageUrl} type="video/mp4" />
                  Seu navegador não suporta vídeos.
                </video>
              ) : (
                <img
                  src={currentImageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Botões de ação */}
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRemoveMedia}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Preview do upload */}
        {previewUrl && (
          <div className="space-y-2">
            <Label>Preview do Upload</Label>
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              {isVideo(previewUrl) ? (
                <video
                  className="w-full h-full object-cover"
                  controls
                  preload="metadata"
                >
                  <source src={previewUrl} type="video/mp4" />
                  Seu navegador não suporta vídeos.
                </video>
              ) : (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        )}

        {/* Upload de novo arquivo */}
        <div className="space-y-2">
          <Label htmlFor="media-upload">Nova Mídia</Label>
          <Input
            ref={fileInputRef}
            id="media-upload"
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            onClick={openFileDialog}
            disabled={uploading}
            className="w-full"
            variant="outline"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Arquivo
              </>
            )}
          </Button>
        </div>

        {/* Informações sobre tipos suportados */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Imagens:</strong> JPEG, PNG, WebP, GIF (máx. 10MB)</p>
          <p><strong>Vídeos:</strong> MP4, WebM, OGG, AVI, MOV (máx. 10MB)</p>
        </div>
      </CardContent>
    </Card>
  )
}
