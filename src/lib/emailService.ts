// Serviço de notificações por email
// Este é um exemplo usando Resend (pode ser substituído por SendGrid, AWS SES, etc.)

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

interface OrderNotificationData {
  orderId: string
  studentName: string
  studentEmail: string
  studentPhone: string
  totalAmount: number
  items: Array<{
    name: string
    quantity: number
    size?: string
    color?: string
    unitPrice: number
    totalPrice: number
  }>
  notes?: string
  createdAt: Date
}

export class EmailService {
  private static instance: EmailService
  private apiKey: string
  private fromEmail: string

  constructor() {
    this.apiKey = import.meta.env.VITE_RESEND_API_KEY || ''
    this.fromEmail = import.meta.env.VITE_FROM_EMAIL || 'noreply@academiaveiga.com'
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  async sendEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulação de envio de email
      // Em produção, usar um serviço real como Resend, SendGrid, etc.
      console.log('📧 Enviando email:', {
        to: data.to,
        subject: data.subject,
        from: this.fromEmail
      })

      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Em desenvolvimento, apenas logar
      if (import.meta.env.DEV) {
        console.log('📧 Email enviado (simulado):', data)
        return { success: true }
      }

      // Em produção, usar API real
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [data.to],
          subject: data.subject,
          html: data.html,
          text: data.text,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erro ao enviar email: ${response.statusText}`)
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao enviar email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }
    }
  }

  async sendNewOrderNotification(orderData: OrderNotificationData): Promise<{ success: boolean; error?: string }> {
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@academiaveiga.com'
    
    const itemsHtml = orderData.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.size || '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.color || '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">R$ ${item.unitPrice.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">R$ ${item.totalPrice.toFixed(2)}</td>
      </tr>
    `).join('')

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Novo Pedido - Academia Veiga</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🥊 Academia Veiga</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Novo Pedido Recebido</p>
            </div>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #dc2626; margin-top: 0;">📦 Detalhes do Pedido</h2>
              
              <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <p><strong>ID do Pedido:</strong> ${orderData.orderId}</p>
                <p><strong>Data:</strong> ${orderData.createdAt.toLocaleDateString('pt-BR')} às ${orderData.createdAt.toLocaleTimeString('pt-BR')}</p>
                <p><strong>Total:</strong> <span style="color: #dc2626; font-size: 18px; font-weight: bold;">R$ ${orderData.totalAmount.toFixed(2)}</span></p>
              </div>

              <h3 style="color: #dc2626;">👤 Dados do Cliente</h3>
              <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <p><strong>Nome:</strong> ${orderData.studentName}</p>
                <p><strong>Email:</strong> ${orderData.studentEmail}</p>
                <p><strong>Telefone:</strong> ${orderData.studentPhone}</p>
              </div>

              <h3 style="color: #dc2626;">🛍️ Itens do Pedido</h3>
              <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 20px; overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #f5f5f5;">
                      <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Produto</th>
                      <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd;">Qtd</th>
                      <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd;">Tamanho</th>
                      <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd;">Cor</th>
                      <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Preço Unit.</th>
                      <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
              </div>

              ${orderData.notes ? `
                <h3 style="color: #dc2626;">📝 Observações</h3>
                <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                  <p>${orderData.notes}</p>
                </div>
              ` : ''}

              <div style="text-align: center; margin-top: 30px;">
                <a href="${window.location.origin}/admin/orders" 
                   style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Ver Pedido no Sistema
                </a>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
              <p>Este é um email automático do Sistema de Pedidos da Academia Veiga.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
      NOVO PEDIDO - ACADEMIA VEIGA
      
      ID do Pedido: ${orderData.orderId}
      Data: ${orderData.createdAt.toLocaleDateString('pt-BR')} às ${orderData.createdAt.toLocaleTimeString('pt-BR')}
      Total: R$ ${orderData.totalAmount.toFixed(2)}
      
      DADOS DO CLIENTE:
      Nome: ${orderData.studentName}
      Email: ${orderData.studentEmail}
      Telefone: ${orderData.studentPhone}
      
      ITENS DO PEDIDO:
      ${orderData.items.map(item => 
        `- ${item.name} (Qtd: ${item.quantity}${item.size ? `, Tamanho: ${item.size}` : ''}${item.color ? `, Cor: ${item.color}` : ''}) - R$ ${item.totalPrice.toFixed(2)}`
      ).join('\n')}
      
      ${orderData.notes ? `OBSERVAÇÕES: ${orderData.notes}` : ''}
      
      Acesse o sistema: ${window.location.origin}/admin/orders
    `

    return this.sendEmail({
      to: adminEmail,
      subject: `🥊 Novo Pedido - ${orderData.studentName} - R$ ${orderData.totalAmount.toFixed(2)}`,
      html,
      text
    })
  }

  async sendOrderConfirmation(orderData: OrderNotificationData): Promise<{ success: boolean; error?: string }> {
    const itemsHtml = orderData.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.size || '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.color || '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">R$ ${item.totalPrice.toFixed(2)}</td>
      </tr>
    `).join('')

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Confirmação de Pedido - Academia Veiga</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🥊 Academia Veiga</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Pedido Confirmado</p>
            </div>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #dc2626; margin-top: 0;">✅ Pedido Recebido com Sucesso!</h2>
              
              <p>Olá <strong>${orderData.studentName}</strong>,</p>
              
              <p>Seu pedido foi recebido e está sendo processado. Em breve entraremos em contato para confirmar os detalhes e informar sobre a entrega.</p>
              
              <div style="background: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p><strong>ID do Pedido:</strong> ${orderData.orderId}</p>
                <p><strong>Data:</strong> ${orderData.createdAt.toLocaleDateString('pt-BR')} às ${orderData.createdAt.toLocaleTimeString('pt-BR')}</p>
                <p><strong>Total:</strong> <span style="color: #dc2626; font-size: 18px; font-weight: bold;">R$ ${orderData.totalAmount.toFixed(2)}</span></p>
              </div>

              <h3 style="color: #dc2626;">🛍️ Itens do Pedido</h3>
              <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 20px; overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #f5f5f5;">
                      <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Produto</th>
                      <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd;">Qtd</th>
                      <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd;">Tamanho</th>
                      <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd;">Cor</th>
                      <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
              </div>

              ${orderData.notes ? `
                <h3 style="color: #dc2626;">📝 Observações</h3>
                <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                  <p>${orderData.notes}</p>
                </div>
              ` : ''}

              <div style="background: #e7f3ff; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>📞 Contato:</strong></p>
                <p style="margin: 5px 0 0 0;">Para dúvidas sobre seu pedido, entre em contato conosco:</p>
                <p style="margin: 5px 0 0 0;">📱 WhatsApp: (11) 99999-9999</p>
                <p style="margin: 5px 0 0 0;">📧 Email: contato@academiaveiga.com</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
              <p>Obrigado por escolher a Academia Veiga! 🥊</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
      PEDIDO CONFIRMADO - ACADEMIA VEIGA
      
      Olá ${orderData.studentName},
      
      Seu pedido foi recebido e está sendo processado.
      
      ID do Pedido: ${orderData.orderId}
      Data: ${orderData.createdAt.toLocaleDateString('pt-BR')} às ${orderData.createdAt.toLocaleTimeString('pt-BR')}
      Total: R$ ${orderData.totalAmount.toFixed(2)}
      
      ITENS DO PEDIDO:
      ${orderData.items.map(item => 
        `- ${item.name} (Qtd: ${item.quantity}${item.size ? `, Tamanho: ${item.size}` : ''}${item.color ? `, Cor: ${item.color}` : ''}) - R$ ${item.totalPrice.toFixed(2)}`
      ).join('\n')}
      
      ${orderData.notes ? `OBSERVAÇÕES: ${orderData.notes}` : ''}
      
      Para dúvidas, entre em contato:
      WhatsApp: (11) 99999-9999
      Email: contato@academiaveiga.com
      
      Obrigado por escolher a Academia Veiga!
    `

    return this.sendEmail({
      to: orderData.studentEmail,
      subject: `✅ Pedido Confirmado - Academia Veiga - R$ ${orderData.totalAmount.toFixed(2)}`,
      html,
      text
    })
  }
}

export const emailService = EmailService.getInstance()
