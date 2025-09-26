import React from "react"
import { Toaster } from "@/components/ui/toaster"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { AuthProvider } from "@/contexts/AuthContext"
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute"
import { Layout } from "@/components/Layout/Layout"
import { backupService } from "@/lib/backupService"

// Pages
import PublicOrderForm from "./pages/PublicOrderForm"
import AdminDashboard from "./pages/AdminDashboard"
import ProductsManagement from "./pages/ProductsManagement"
import OrdersManagement from "./pages/OrdersManagement"
import SalesMetrics from "./pages/SalesMetrics"
import InventoryManagement from "./pages/InventoryManagement"
import BackupManagement from "./pages/BackupManagement"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        console.log('🔄 React Query retry:', { failureCount, error })
        return failureCount < 2
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
})

function App() {
  // Iniciar backup automático
  React.useEffect(() => {
    const interval = localStorage.getItem('backup_interval')
    if (interval) {
      backupService.startAutomaticBackup(parseInt(interval))
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              {/* Rota pública para formulário de pedidos */}
              <Route path="/" element={<PublicOrderForm />} />
              
              {/* Rotas administrativas protegidas */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<ProductsManagement />} />
                <Route path="orders" element={<OrdersManagement />} />
                <Route path="metrics" element={<SalesMetrics />} />
                <Route path="inventory" element={<InventoryManagement />} />
                <Route path="backup" element={<BackupManagement />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
