import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { CreditCard, Lock, Calendar, User } from 'lucide-react'
import type { CreditCardData } from '../../types'

const creditCardSchema = z.object({
  cardNumber: z.string()
    .min(16, 'Número do cartão deve ter 16 dígitos')
    .max(19, 'Número do cartão inválido')
    .regex(/^\d+$/, 'Apenas números são permitidos'),
  expiryDate: z.string()
    .min(5, 'Data de validade é obrigatória')
    .max(5, 'Data de validade inválida'),
  cvv: z.string()
    .min(3, 'CVV deve ter pelo menos 3 dígitos')
    .max(4, 'CVV inválido')
    .regex(/^\d+$/, 'Apenas números são permitidos'),
  cardHolder: z.string()
    .min(2, 'Nome do portador é obrigatório')
    .max(50, 'Nome muito longo'),
  installments: z.number()
    .min(1, 'Número de parcelas inválido')
    .max(12, 'Máximo 12 parcelas')
})

interface CreditCardFormProps {
  amount: number
  onPayment: (cardData: CreditCardData) => Promise<void>
  isProcessing: boolean
}

export function CreditCardForm({ amount, onPayment, isProcessing }: CreditCardFormProps) {
  const [installments, setInstallments] = useState(1)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<CreditCardData>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      installments: 1
    }
  })

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{4})(?=\d)/g, '$1 ')
  }

  const formatExpiryDate = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length >= 2) {
      return numbers.substring(0, 2) + '/' + numbers.substring(2, 4)
    }
    return numbers
  }

  const onSubmit = async (data: CreditCardData) => {
    const cardData: CreditCardData = {
      cardNumber: data.cardNumber.replace(/\s/g, ''),
      cardHolder: data.cardHolder,
      expiryDate: data.expiryDate,
      cvv: data.cvv,
      installments
    }
    await onPayment(cardData)
  }

  const calculateInstallmentValue = () => {
    return (amount / installments).toFixed(2)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Cartão de Crédito
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Número do Cartão */}
          <div className="space-y-2">
            <Label htmlFor="number">Número do Cartão</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="number"
                placeholder="0000 0000 0000 0000"
                className="pl-10"
                {...register('cardNumber')}
                onChange={(e) => {
                  const formatted = formatCardNumber(e.target.value)
                  setValue('cardNumber', formatted)
                }}
                maxLength={19}
              />
            </div>
            {errors.cardNumber && (
              <p className="text-sm text-destructive">{errors.cardNumber.message}</p>
            )}
          </div>

          {/* Nome do Portador */}
          <div className="space-y-2">
            <Label htmlFor="holderName">Nome do Portador</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="holderName"
                placeholder="Nome como no cartão"
                className="pl-10"
                {...register('cardHolder')}
              />
            </div>
            {errors.cardHolder && (
              <p className="text-sm text-destructive">{errors.cardHolder.message}</p>
            )}
          </div>

          {/* Validade e CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Validade</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="expiry"
                  placeholder="MM/AA"
                  className="pl-10"
                  {...register('expiryDate')}
                  onChange={(e) => {
                    const formatted = formatExpiryDate(e.target.value)
                    setValue('expiryDate', formatted)
                  }}
                  maxLength={5}
                />
              </div>
              {errors.expiryDate && (
                <p className="text-sm text-destructive">
                  {errors.expiryDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cvv"
                  placeholder="000"
                  className="pl-10"
                  {...register('cvv')}
                  maxLength={4}
                />
              </div>
              {errors.cvv && (
                <p className="text-sm text-destructive">{errors.cvv.message}</p>
              )}
            </div>
          </div>

          {/* Parcelas */}
          <div className="space-y-2">
            <Label htmlFor="installments">Parcelas</Label>
            <Select value={installments.toString()} onValueChange={(value) => setInstallments(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o número de parcelas" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}x de R$ {calculateInstallmentValue()} 
                    {num > 1 && ` (Total: R$ ${amount.toFixed(2)})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resumo do Pagamento */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Valor total:</span>
              <span className="font-semibold">R$ {amount.toFixed(2)}</span>
            </div>
            {installments > 1 && (
              <div className="flex justify-between text-sm">
                <span>Parcelas:</span>
                <span>{installments}x de R$ {calculateInstallmentValue()}</span>
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isProcessing}
          >
            {isProcessing ? 'Processando...' : `Pagar R$ ${amount.toFixed(2)}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

