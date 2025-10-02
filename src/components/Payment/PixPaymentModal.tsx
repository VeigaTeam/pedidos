import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Smartphone, QrCode, Copy, Check, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PaymentService } from '@/lib/paymentService'
import type { PaymentResult, PixPaymentData } from '@/types'

interface PixPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  amount: number
  onPaymentSuccess: (result: PaymentResult) => void
}

export function PixPaymentModal({ 
  isOpen, 
  onClose, 
  orderId, 
  amount, 
  onPaymentSuccess 
}: PixPaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [pixCode, setPixCode] = useState<string>('')
  const [pixQrCode, setPixQrCode] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [description, setDescription] = useState('')
  const { toast } = useToast()

  const handlePayment = async () => {
    setIsProcessing(true)
    try {
      const pixData: PixPaymentData = {
        amount,
        description: description || `Pedido ${orderId}`
      }
      
      const result = await PaymentService.processPixPayment(orderId, amount, pixData)
      
      if (result.success) {
        setPixCode(result.pixCode || '')
        setPixQrCode(result.pixQrCode || '')
        onPaymentSuccess(result)
        
        toast({
          title: 'PIX gerado com sucesso!',
          description: 'Escaneie o QR Code ou copie o código PIX para pagar',
        })
      } else {
        toast({
          title: 'Erro ao gerar PIX',
          description: result.error || 'Tente novamente',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro no pagamento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const copyPixCode = async () => {
    if (pixCode) {
      try {
        await navigator.clipboard.writeText(pixCode)
        setCopied(true)
        toast({
          title: 'Código PIX copiado!',
          description: 'Cole no seu aplicativo de pagamento',
        })
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        toast({
          title: 'Erro ao copiar',
          description: 'Não foi possível copiar o código PIX',
          variant: 'destructive'
        })
      }
    }
  }

  const downloadQrCode = () => {
    if (pixQrCode) {
      const link = document.createElement('a')
      link.href = pixQrCode
      link.download = 'pix-qr-code.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleClose = () => {
    setPixCode('')
    setPixQrCode('')
    setDescription('')
    setCopied(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Pagamento PIX
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Valor total: <span className="font-semibold text-lg">R$ {amount.toFixed(2)}</span>
            </p>
          </div>

          {!pixCode ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Gerar PIX
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Input
                    id="description"
                    placeholder="Ex: Pedido de produtos da academia"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
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
                  onClick={handlePayment}
                  className="w-full" 
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando PIX...
                    </>
                  ) : (
                    `Gerar PIX - R$ ${amount.toFixed(2)}`
                  )}
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
              </CardContent>
            </Card>
          ) : (
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
                      <img 
                        src={pixQrCode} 
                        alt="QR Code PIX" 
                        className="w-48 h-48"
                      />
                    </div>
                  </div>

                  {/* Código PIX */}
                  <div className="space-y-2">
                    <Label>Código PIX</Label>
                    <div className="flex gap-2">
                      <Input
                        value={pixCode}
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
