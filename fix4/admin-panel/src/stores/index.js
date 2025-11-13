import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Auth store (persisted): holds user + JWT token
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // Set authenticated user and token after successful login
      setAuth: (user, token) => set({ user, token, isAuthenticated: Boolean(user && token) }),

      // Clear session
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
)

// Dashboard store (widget layout for drag & drop, etc.)
export const useDashboardStore = create((set) => ({
  widgetLayout: [
    { id: '1', title: 'Today Sales', component: 'TodaySales' },
    { id: '2', title: 'Pending Orders', component: 'PendingOrders' },
    { id: '3', title: 'Low Stock', component: 'LowStock' },
    { id: '4', title: 'Abandoned Carts', component: 'AbandonedCarts' },
    { id: '5', title: 'Sales Chart', component: 'SalesChart' },
    { id: '6', title: 'Recent Orders', component: 'RecentOrders' },
    { id: '7', title: 'New Customers', component: 'NewCustomers' },
    { id: '8', title: 'Conversion Rate', component: 'ConversionRate' },
  ],

  reorderWidgets: (newLayout) => set({ widgetLayout: newLayout }),
}))

// Notification store (simple demo data)
export const useNotificationStore = create((set) => ({
  notifications: [
    { id: '1', type: 'order', title: 'New order received', message: 'Order #12345 was placed', time: '5m ago', read: false },
    { id: '2', type: 'stock', title: 'Low stock alert', message: 'Product X stock is low', time: '1h ago', read: false },
    { id: '3', type: 'ticket', title: 'New ticket', message: 'Ticket #789 was created', time: '2h ago', read: true },
  ],

  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
  })),

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
  })),
}))

