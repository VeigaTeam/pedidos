// Script simples para zerar estoque usando fetch direto
// Este script assume que você tem as variáveis de ambiente configuradas

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

async function zeroStock() {
  try {
    console.log('🔄 Iniciando processo de zerar estoque...')
    
    // Verificar se as variáveis estão configuradas
    if (SUPABASE_URL === 'https://your-project.supabase.co' || SUPABASE_ANON_KEY === 'your-anon-key') {
      console.error('❌ Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY')
      console.error('Ou edite este arquivo com suas credenciais do Supabase')
      return
    }
    
    // Buscar todos os produtos
    const fetchResponse = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,name,stock`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!fetchResponse.ok) {
      throw new Error(`Erro ao buscar produtos: ${fetchResponse.status} ${fetchResponse.statusText}`)
    }
    
    const products = await fetchResponse.json()
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
    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ stock: 0 })
    })
    
    if (!updateResponse.ok) {
      throw new Error(`Erro ao atualizar estoque: ${updateResponse.status} ${updateResponse.statusText}`)
    }
    
    const updatedProducts = await updateResponse.json()
    console.log('\n✅ Estoque zerado com sucesso!')
    console.log(`📊 ${updatedProducts.length} produtos atualizados:`)
    
    updatedProducts.forEach(product => {
      console.log(`  - ${product.name}: ${product.stock} unidades`)
    })
    
    // Verificar se realmente foi zerado
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,name,stock&stock=gt.0`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (verifyResponse.ok) {
      const verification = await verifyResponse.json()
      
      if (verification.length === 0) {
        console.log('\n🎉 Confirmação: Todos os produtos estão com estoque zerado!')
      } else {
        console.log('\n⚠️ Aviso: Alguns produtos ainda têm estoque:')
        verification.forEach(product => {
          console.log(`  - ${product.name}: ${product.stock} unidades`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao zerar estoque:', error.message)
    console.error('Detalhes do erro:', error)
  }
}

// Executar o script
zeroStock()
  .then(() => {
    console.log('\n✨ Processo concluído!')
  })
  .catch((error) => {
    console.error('\n💥 Falha no processo:', error)
  })
