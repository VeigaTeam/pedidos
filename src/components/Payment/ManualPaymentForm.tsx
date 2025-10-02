import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link, Loader2, Send } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PaymentService } from '@/lib/paymentService'
import type { Payment } from '@/types'

interface ManualPaymentFormProps {
  isOpen: boolean
  onClose: () => void
  payment: Payment
  onUpdate: () => void
}

export function ManualPaymentForm({ 
  isOpen, 
  onClose, 
  payment, 
  onUpdate 
}: ManualPaymentFormProps) {
  const [paymentLink, setPaymentLink] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!paymentLink.trim()) {
      toast({
        title: 'Link obrigatório',
        description: 'Por favor, insira o link de pagamento',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    try {
      const success = await PaymentService.updatePaymentLink(
        payment.id,
        paymentLink,
        notes
      )

      if (success) {
        toast({
          title: 'Link atualizado!',
          description: 'O link de pagamento foi salvo com sucesso',
        })
        
        onUpdate()
        onClose()
      } else {
        toast({
          title: 'Erro ao atualizar',
          description: 'Não foi possível salvar o link de pagamento',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Gerar Link de Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do pagamento */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Informações do Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Valor:</span>
                <span className="font-semibold">{formatAmount(payment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pedido:</span>
                <span className="font-mono text-sm">{payment.orderId.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="text-sm">{payment.status}</span>
              </div>
            </CardContent>
          </Card>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentLink">Link de Pagamento *</Label>
              <Input
                id="paymentLink"
                type="url"
                placeholder="https://pagamento.exemplo.com/..."
                value={paymentLink}
                onChange={(e) => setPaymentLink(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Cole aqui o link gerado na InfinitePay ou outro gateway
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Ex: Parcelamento em 3x, vencimento em 7 dias..."
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Salvar Link
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Instruções */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Como proceder:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Gere o link de pagamento na InfinitePay</li>
              <li>2. Cole o link no campo acima</li>
              <li>3. Adicione observações se necessário</li>
              <li>4. Envie o link por email/WhatsApp para o cliente</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
