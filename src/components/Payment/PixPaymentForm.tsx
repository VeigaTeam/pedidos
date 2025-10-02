import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Smartphone, QrCode, Copy, Check } from 'lucide-react'
import { useToast } from '../../hooks/use-toast'
import type { PixPaymentData } from '../../types'

const pixSchema = z.object({
  description: z.string().optional()
})

interface PixPaymentFormProps {
  amount: number
  onPayment: (pixData: PixPaymentData) => Promise<void>
  isProcessing: boolean
}

export function PixPaymentForm({ amount, onPayment, isProcessing }: PixPaymentFormProps) {
  const [copied] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PixPaymentData>({
    resolver: zodResolver(pixSchema)
  })

  const onSubmit = async (data: PixPaymentData) => {
    const pixData: PixPaymentData = {
      ...data,
      amount
    }
    
    try {
      await onPayment(pixData)
    } catch (error) {
      console.error('Erro no pagamento PIX:', error)
    }
  }

  const copyPixCode = async () => {
    // Implementar quando o PIX estiver disponível
    toast({
      title: 'PIX em desenvolvimento',
      description: 'Funcionalidade será implementada em breve',
    })
  }

  const downloadQrCode = () => {
    // Implementar quando o PIX estiver disponível
    toast({
      title: 'PIX em desenvolvimento',
      description: 'Funcionalidade será implementada em breve',
    })
  }

  // Se já temos o PIX gerado, mostrar os dados
  if (false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            PIX Gerado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Escaneie o QR Code ou copie o código PIX
            </p>
            
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="border rounded-lg p-4 bg-white">
                <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                  QR Code em desenvolvimento
                </div>
              </div>
            </div>

            {/* Código PIX */}
            <div className="space-y-2">
              <Label>Código PIX</Label>
              <div className="flex gap-2">
                <Input
                  value="PIX em desenvolvimento"
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyPixCode}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={downloadQrCode}
                className="flex-1"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Baixar QR Code
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={copyPixCode}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Código
              </Button>
            </div>

            {/* Instruções */}
            <div className="bg-blue-50 p-4 rounded-lg text-left">
              <h4 className="font-semibold text-blue-900 mb-2">Como pagar:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Abra o app do seu banco</li>
                <li>2. Escolha a opção PIX</li>
                <li>3. Escaneie o QR Code ou cole o código</li>
                <li>4. Confirme o pagamento</li>
              </ol>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Valor: <span className="font-semibold">R$ {amount.toFixed(2)}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Pagamento PIX
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              placeholder="Ex: Pedido de produtos da academia"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Valor total:</span>
              <span className="font-semibold">R$ {amount.toFixed(2)}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Pagamento instantâneo via PIX
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isProcessing}
          >
            {isProcessing ? 'Gerando PIX...' : `Gerar PIX - R$ ${amount.toFixed(2)}`}
          </Button>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Vantagens do PIX:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Pagamento instantâneo</li>
              <li>• Sem taxas adicionais</li>
              <li>• Disponível 24h por dia</li>
              <li>• Confirmação imediata</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

