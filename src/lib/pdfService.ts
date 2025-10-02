import jsPDF from 'jspdf'
import 'jspdf-autotable'
import type { Order, Product, SalesMetrics } from '@/types'

// Estender o tipo jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export class PDFService {
  private static instance: PDFService

  static getInstance(): PDFService {
    if (!PDFService.instance) {
      PDFService.instance = new PDFService()
    }
    return PDFService.instance
  }

  private addHeader(doc: jsPDF, title: string) {
    // Logo/Header
    doc.setFillColor(220, 38, 38) // Red color
    doc.rect(0, 0, 210, 30, 'F')
    
    // Title
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('🥊 Academia Veiga', 20, 20)
    
    // Subtitle
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(title, 20, 35)
    
    // Date
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 150, 35)
    
    // Reset colors
    doc.setTextColor(0, 0, 0)
  }

  private addFooter(doc: jsPDF, pageNumber: number) {
    const pageCount = doc.getNumberOfPages()
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Página ${pageNumber} de ${pageCount}`, 20, 285)
    doc.text('Sistema de Pedidos - Academia Veiga', 150, 285)
  }

  generateOrdersReport(orders: Order[]): jsPDF {
    const doc = new jsPDF()
    
    this.addHeader(doc, 'Relatório de Pedidos')
    
    // Summary
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
    const pendingOrders = orders.filter(order => order.status === 'pending').length
    const completedOrders = orders.filter(order => order.status === 'completed').length
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumo', 20, 50)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Total de Pedidos: ${totalOrders}`, 20, 60)
    doc.text(`Receita Total: R$ ${totalRevenue.toFixed(2)}`, 20, 67)
    doc.text(`Pedidos Pendentes: ${pendingOrders}`, 20, 74)
    doc.text(`Pedidos Concluídos: ${completedOrders}`, 20, 81)
    
    // Orders table
    const tableData = orders.map(order => [
      order.id.substring(0, 8) + '...',
      order.studentName,
      order.studentEmail,
      order.studentPhone,
      `R$ ${order.totalAmount.toFixed(2)}`,
      this.getStatusText(order.status),
      new Date(order.createdAt).toLocaleDateString('pt-BR')
    ])
    
    doc.autoTable({
      startY: 90,
      head: [['ID', 'Cliente', 'Email', 'Telefone', 'Total', 'Status', 'Data']],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [220, 38, 38],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { left: 20, right: 20 },
    })
    
    // Add footer to all pages
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      this.addFooter(doc, i)
    }
    
    return doc
  }

  generateProductsReport(products: Product[]): jsPDF {
    const doc = new jsPDF()
    
    this.addHeader(doc, 'Relatório de Produtos')
    
    // Summary
    const totalProducts = products.length
    const totalStock = products.reduce((sum, product) => sum + product.stock, 0)
    const totalValue = products.reduce((sum, product) => sum + (product.stock * product.purchasePrice), 0)
    const lowStockProducts = products.filter(product => product.stock <= product.minStock).length
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumo', 20, 50)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Total de Produtos: ${totalProducts}`, 20, 60)
    doc.text(`Total em Estoque: ${totalStock} unidades`, 20, 67)
    doc.text(`Valor Total do Estoque: R$ ${totalValue.toFixed(2)}`, 20, 74)
    doc.text(`Produtos com Estoque Baixo: ${lowStockProducts}`, 20, 81)
    
    // Products table
    const tableData = products.map(product => [
      product.name,
      this.getCategoryText(product.category),
      product.stock.toString(),
      product.minStock.toString(),
      `R$ ${product.purchasePrice.toFixed(2)}`,
      `R$ ${product.salePrice.toFixed(2)}`,
      `${product.profitMargin.toFixed(1)}%`,
      product.isActive ? 'Ativo' : 'Inativo'
    ])
    
    doc.autoTable({
      startY: 90,
      head: [['Produto', 'Categoria', 'Estoque', 'Mínimo', 'Preço Compra', 'Preço Venda', 'Margem', 'Status']],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [220, 38, 38],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { left: 20, right: 20 },
    })
    
    // Add footer to all pages
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      this.addFooter(doc, i)
    }
    
    return doc
  }

  generateSalesReport(metrics: SalesMetrics): jsPDF {
    const doc = new jsPDF()
    
    this.addHeader(doc, 'Relatório de Vendas')
    
    // Summary
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumo Geral', 20, 50)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Total de Pedidos: ${metrics.totalOrders}`, 20, 60)
    doc.text(`Receita Total: R$ ${metrics.totalRevenue.toFixed(2)}`, 20, 67)
    doc.text(`Lucro Total: R$ ${metrics.totalProfit.toFixed(2)}`, 20, 74)
    doc.text(`Ticket Médio: R$ ${metrics.averageOrderValue.toFixed(2)}`, 20, 81)
    
    // Revenue by month chart data
    if (metrics.revenueByMonth.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.text('Receita por Mês', 20, 95)
      
      const chartData = metrics.revenueByMonth.map(item => [
        item.month,
        `R$ ${item.revenue.toFixed(2)}`,
        `R$ ${item.profit.toFixed(2)}`
      ])
      
      doc.autoTable({
        startY: 100,
        head: [['Mês', 'Receita', 'Lucro']],
        body: chartData,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [220, 38, 38],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: 20, right: 20 },
      })
    }
    
    // Top products
    if (metrics.topProducts.length > 0) {
      const startY = (doc as any).lastAutoTable.finalY + 20
      doc.setFont('helvetica', 'bold')
      doc.text('Produtos Mais Vendidos', 20, startY)
      
      const topProductsData = metrics.topProducts.map((product, index) => [
        (index + 1).toString(),
        product.product.name,
        product.quantitySold.toString(),
        `R$ ${product.revenue.toFixed(2)}`
      ])
      
      doc.autoTable({
        startY: startY + 5,
        head: [['#', 'Produto', 'Quantidade Vendida', 'Receita']],
        body: topProductsData,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [220, 38, 38],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: 20, right: 20 },
      })
    }
    
    // Add footer to all pages
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      this.addFooter(doc, i)
    }
    
    return doc
  }

  generateOrderDetail(order: Order): jsPDF {
    const doc = new jsPDF()
    
    this.addHeader(doc, `Pedido #${order.id.substring(0, 8)}`)
    
    // Order info
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Informações do Pedido', 20, 50)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`ID: ${order.id}`, 20, 60)
    doc.text(`Data: ${new Date(order.createdAt).toLocaleDateString('pt-BR')} às ${new Date(order.createdAt).toLocaleTimeString('pt-BR')}`, 20, 67)
    doc.text(`Status: ${this.getStatusText(order.status)}`, 20, 74)
    doc.text(`Total: R$ ${order.totalAmount.toFixed(2)}`, 20, 81)
    
    // Customer info
    doc.setFont('helvetica', 'bold')
    doc.text('Dados do Cliente', 20, 95)
    
    doc.setFont('helvetica', 'normal')
    doc.text(`Nome: ${order.studentName}`, 20, 105)
    doc.text(`Email: ${order.studentEmail}`, 20, 112)
    doc.text(`Telefone: ${order.studentPhone}`, 20, 119)
    
    // Order items
    if (order.items && order.items.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.text('Itens do Pedido', 20, 135)
      
      const itemsData = order.items.map(item => [
        item.product.name,
        item.quantity.toString(),
        item.size || '-',
        item.color || '-',
        `R$ ${item.unitPrice.toFixed(2)}`,
        `R$ ${item.totalPrice.toFixed(2)}`
      ])
      
      doc.autoTable({
        startY: 140,
        head: [['Produto', 'Qtd', 'Tamanho', 'Cor', 'Preço Unit.', 'Total']],
        body: itemsData,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [220, 38, 38],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: 20, right: 20 },
      })
    }
    
    // Notes
    if (order.notes) {
      const startY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 20 : 200
      doc.setFont('helvetica', 'bold')
      doc.text('Observações', 20, startY)
      
      doc.setFont('helvetica', 'normal')
      doc.text(order.notes, 20, startY + 10)
    }
    
    // Add footer to all pages
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      this.addFooter(doc, i)
    }
    
    return doc
  }

  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      processing: 'Processando',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    }
    return statusMap[status] || status
  }

  private getCategoryText(category: string): string {
    const categoryMap: Record<string, string> = {
      camisetas: 'Camisetas',
      shorts: 'Shorts',
      equipamentos: 'Equipamentos'
    }
    return categoryMap[category] || category
  }

  downloadPDF(doc: jsPDF, filename: string) {
    doc.save(filename)
  }
}

export const pdfService = PDFService.getInstance()
