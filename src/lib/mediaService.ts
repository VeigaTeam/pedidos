import { supabase } from '@/integrations/supabase/client'

export class MediaService {
  private static instance: MediaService
  private bucketName = 'products'

  static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService()
    }
    return MediaService.instance
  }

  /**
   * Upload de arquivo para o bucket de produtos
   */
  async uploadFile(file: File, productId: string, type: 'image' | 'video' = 'image'): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${productId}/${type}_${Date.now()}.${fileExt}`
      
      // Upload do arquivo
      const { error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Erro no upload:', error)
        return { success: false, error: error.message }
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName)

      return { 
        success: true, 
        url: urlData.publicUrl 
      }

    } catch (error) {
      console.error('Erro no upload:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }
    }
  }

  /**
   * Upload múltiplos arquivos
   */
  async uploadMultipleFiles(files: File[], productId: string, type: 'image' | 'video' = 'image'): Promise<{ success: boolean; urls?: string[]; error?: string }> {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, productId, type))
      const results = await Promise.all(uploadPromises)

      const failedUploads = results.filter(result => !result.success)
      if (failedUploads.length > 0) {
        return { 
          success: false, 
          error: `Falha no upload de ${failedUploads.length} arquivo(s)` 
        }
      }

      const urls = results.map(result => result.url).filter(Boolean) as string[]
      return { success: true, urls }

    } catch (error) {
      console.error('Erro no upload múltiplo:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }
    }
  }

  /**
   * Deletar arquivo
   */
  async deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath])

      if (error) {
        console.error('Erro ao deletar arquivo:', error)
        return { success: false, error: error.message }
      }

      return { success: true }

    } catch (error) {
      console.error('Erro ao deletar arquivo:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }
    }
  }

  /**
   * Listar arquivos de um produto
   */
  async listProductFiles(productId: string): Promise<{ success: boolean; files?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(productId, {
          limit: 100,
          offset: 0,
        })

      if (error) {
        console.error('Erro ao listar arquivos:', error)
        return { success: false, error: error.message }
      }

      return { success: true, files: data || [] }

    } catch (error) {
      console.error('Erro ao listar arquivos:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }
    }
  }

  /**
   * Obter URL pública de um arquivo
   */
  getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  /**
   * Validar tipo de arquivo
   */
  validateFileType(file: File, type: 'image' | 'video'): { valid: boolean; error?: string } {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov']

    if (type === 'image' && !imageTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Tipo de arquivo não suportado. Use: JPEG, PNG, WebP ou GIF' 
      }
    }

    if (type === 'video' && !videoTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Tipo de arquivo não suportado. Use: MP4, WebM, OGG, AVI ou MOV' 
      }
    }

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: 'Arquivo muito grande. Tamanho máximo: 10MB' 
      }
    }

    return { valid: true }
  }

  /**
   * Gerar URL de preview para upload
   */
  generatePreviewUrl(file: File): string {
    return URL.createObjectURL(file)
  }

  /**
   * Limpar URL de preview
   */
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url)
  }
}

export const mediaService = MediaService.getInstance()
