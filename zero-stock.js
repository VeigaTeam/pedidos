import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
  console.error('Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas no arquivo .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function zeroStock() {
  try {
    console.log('🔄 Iniciando processo de zerar estoque...')
    
    // Primeiro, vamos verificar quantos produtos existem
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, stock')
    
    if (fetchError) {
      throw fetchError
    }
    
    console.log(`📦 Encontrados ${products.length} produtos no banco de dados`)
    
    if (products.length === 0) {
      console.log('ℹ️ Nenhum produto encontrado no banco de dados')
      return
    }
    
    // Mostrar produtos antes da atualização
    console.log('\n📋 Produtos encontrados:')
    products.forEach(product => {
      console.log(`  - ${product.name}: ${product.stock} unidades`)
    })
    
    // Zerar o estoque de todos os produtos
    const { data: updatedProducts, error: updateError } = await supabase
      .from('products')
      .update({ stock: 0 })
      .select('id, name, stock')
    
    if (updateError) {
      throw updateError
    }
    
    console.log('\n✅ Estoque zerado com sucesso!')
    console.log(`📊 ${updatedProducts.length} produtos atualizados:`)
    
    updatedProducts.forEach(product => {
      console.log(`  - ${product.name}: ${product.stock} unidades`)
    })
    
    // Verificar se realmente foi zerado
    const { data: verification, error: verifyError } = await supabase
      .from('products')
      .select('id, name, stock')
      .gt('stock', 0)
    
    if (verifyError) {
      throw verifyError
    }
    
    if (verification.length === 0) {
      console.log('\n🎉 Confirmação: Todos os produtos estão com estoque zerado!')
    } else {
      console.log('\n⚠️ Aviso: Alguns produtos ainda têm estoque:')
      verification.forEach(product => {
        console.log(`  - ${product.name}: ${product.stock} unidades`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro ao zerar estoque:', error.message)
    console.error('Detalhes do erro:', error)
    process.exit(1)
  }
}

// Executar o script
zeroStock()
  .then(() => {
    console.log('\n✨ Processo concluído com sucesso!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Falha no processo:', error)
    process.exit(1)
  })
