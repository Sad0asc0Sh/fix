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
    { name: 'auth-storage' },
  ),
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
    {
      id: '1',
      type: 'order',
      title: 'New order received',
      message: 'Order #12345 was placed',
      time: '5m ago',
      read: false,
    },
    {
      id: '2',
      type: 'stock',
      title: 'Low stock alert',
      message: 'Product X stock is low',
      time: '1h ago',
      read: false,
    },
    {
      id: '3',
      type: 'ticket',
      title: 'New ticket',
      message: 'Ticket #789 was created',
      time: '2h ago',
      read: true,
    },
  ],

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
}))

// ============================================
// Category Store - Single Source of Truth
// ============================================
export const useCategoryStore = create((set, get) => ({
  // State
  categoriesTree: [], // category tree for AntD Tree/TreeSelect
  categoriesFlat: [], // flattened list for selects
  loading: false,
  error: null,

  // Fetch categories tree from API (with children structure)
  fetchCategoriesTree: async () => {
    if (get().loading) return

    set({ loading: true, error: null })
    try {
      const api = (await import('../api')).default
      const response = await api.get('/categories/tree')
      const rawData = response?.data?.data || []

      const getImageUrl = (img) => {
        if (!img) return null
        if (typeof img === 'string') return img
        if (typeof img === 'object' && img.url) return img.url
        return null
      }

      // Map backend tree to Ant Design Tree nodes and preserve icon/image info
      const toAntTree = (nodes = []) =>
        nodes.map((n) => ({
          title: n.name,
          key: n._id,
          value: n._id,
          parent: n.parent || null,
          description: n.description || '',
          isFeatured: !!n.isFeatured,
          icon: n.icon || null,
          image: n.image || null,
          iconUrl: getImageUrl(n.icon),
          imageUrl: getImageUrl(n.image),
          children: n.children ? toAntTree(n.children) : [],
        }))

      const treeData = toAntTree(rawData)

      // Flatten for simple selects
      const flatten = (nodes = [], parentName = '') => {
        let result = []
        nodes.forEach((n) => {
          const displayName = parentName ? `${parentName} > ${n.title}` : n.title
          result.push({ _id: n.value, name: displayName, title: n.title })
          if (n.children && n.children.length > 0) {
            result = result.concat(flatten(n.children, displayName))
          }
        })
        return result
      }

      set({
        categoriesTree: treeData,
        categoriesFlat: flatten(treeData),
        loading: false,
      })
      // eslint-disable-next-line no-console
      console.log(
        'Categories tree loaded successfully:',
        treeData.length,
        'root nodes',
      )
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch categories:', error)
      set({
        error:
          error?.message ||
          'خطا در دریافت لیست دسته‌بندی‌ها از سرور',
        loading: false,
        categoriesTree: [],
        categoriesFlat: [],
      })
    }
  },

  // Clear categories (useful for logout or reset)
  clearCategories: () => set({ categoriesTree: [], categoriesFlat: [] }),
}))

