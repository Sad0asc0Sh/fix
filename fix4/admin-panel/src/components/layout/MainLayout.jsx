import { useState } from 'react'
import { Layout, Menu, Badge, Dropdown, Avatar, Button, Drawer } from 'antd'
import { Link, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  GiftOutlined,
  FileTextOutlined,
  CustomerServiceOutlined,
  SettingOutlined,
  BarChartOutlined,
  TeamOutlined,
  BellOutlined,
  LogoutOutlined,
  MenuOutlined,
} from '@ant-design/icons'
import { useAuthStore, useNotificationStore } from '../../stores'
import './MainLayout.css'

const { Header, Sider, Content } = Layout

function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { notifications, markAllAsRead } = useNotificationStore()

  const unreadCount = notifications.filter(n => !n.read).length

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">داشبورد</Link>,
    },
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: 'محصولات',
      children: [
        { key: '/products', label: <Link to="/products">لیست محصولات</Link> },
        { key: '/products/new', label: <Link to="/products/new">افزودن محصول</Link> },
        { key: '/categories', label: <Link to="/categories">دسته‌بندی‌ها</Link> },
        { key: '/brands', label: <Link to="/brands">برندها</Link> },
        { key: '/inventory', label: <Link to="/inventory">مدیریت موجودی</Link> },
      ],
    },
    {
      key: '/orders',
      icon: <ShoppingCartOutlined />,
      label: 'سفارشات',
      children: [
        { key: '/orders', label: <Link to="/orders">لیست سفارشات</Link> },
        { key: '/rma', label: <Link to="/rma">بازگشت کالا (RMA)</Link> },
        { key: '/abandoned-carts', label: <Link to="/abandoned-carts">سبدهای رها شده</Link> },
      ],
    },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: 'مشتریان',
      children: [
        { key: '/customers', label: <Link to="/customers">لیست مشتریان</Link> },
      ],
    },
    {
      key: '/finance',
      icon: <GiftOutlined />,
      label: 'مالی و تخفیف',
      children: [
        { key: '/coupons', label: <Link to="/coupons">کوپن‌های تخفیف</Link> },
        { key: '/shipping', label: <Link to="/shipping">هزینه ارسال</Link> },
      ],
    },
    {
      key: '/content',
      icon: <FileTextOutlined />,
      label: 'محتوا و سئو',
      children: [
        { key: '/pages', label: <Link to="/pages">صفحات ثابت</Link> },
        { key: '/blog/posts', label: <Link to="/blog/posts">بلاگ</Link> },
        { key: '/banners', label: <Link to="/banners">بنرها</Link> },
      ],
    },
    {
      key: '/tickets',
      icon: <CustomerServiceOutlined />,
      label: <Link to="/tickets">پشتیبانی (تیکت‌ها)</Link>,
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: 'گزارشات',
      children: [
        { key: '/reports/sales', label: <Link to="/reports/sales">گزارش فروش</Link> },
        { key: '/reports/products', label: <Link to="/reports/products">گزارش محصولات</Link> },
        { key: '/reports/customers', label: <Link to="/reports/customers">گزارش مشتریان</Link> },
      ],
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: <Link to="/settings">تنظیمات</Link>,
    },
    {
      key: '/admins',
      icon: <TeamOutlined />,
      label: <Link to="/admins">مدیریت ادمین‌ها</Link>,
    },
  ]

  const notificationMenu = {
    items: notifications.map(n => ({
      key: n.id,
      label: (
        <div style={{ width: 250, padding: '8px 0' }}>
          <div style={{ fontWeight: n.read ? 'normal' : 'bold' }}>{n.title}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{n.message}</div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{n.time}</div>
        </div>
      ),
    })).concat([
      { type: 'divider' },
      {
        key: 'mark-all',
        label: (
          <Button type="link" size="small" onClick={markAllAsRead} block>
            علامت‌گذاری همه به عنوان خوانده شده
          </Button>
        ),
      },
    ]),
  }

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'پروفایل من',
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: <Link to="/settings">تنظیمات</Link>,
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'خروج',
        onClick: logout,
      },
    ],
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      <Sider
        breakpoint="lg"
        collapsedWidth="80"
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="desktop-sider"
      >
        <div className="logo">
          {collapsed ? 'پ' : 'پنل مدیریت'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['/' + location.pathname.split('/')[1]]}
          items={menuItems}
        />
      </Sider>

      {/* Mobile Drawer */}
      <Drawer
        title="منوی اصلی"
        placement="right"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        className="mobile-drawer"
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['/' + location.pathname.split('/')[1]]}
          items={menuItems}
          onClick={() => setMobileDrawerOpen(false)}
        />
      </Drawer>

      <Layout>
        <Header className="site-header">
          <div className="header-left">
            <Button
              type="text"
              icon={<MenuOutlined />}
              className="mobile-menu-btn"
              onClick={() => setMobileDrawerOpen(true)}
            />
          </div>
          
          <div className="header-right">
            <Dropdown menu={notificationMenu} trigger={['click']}>
              <Badge count={unreadCount} style={{ marginLeft: 24 }}>
                <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
              </Badge>
            </Dropdown>

            <Dropdown menu={userMenu} trigger={['click']}>
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginRight: 16 }}>
                <Avatar icon={<UserOutlined />} style={{ marginLeft: 8 }} />
                <span>{user?.name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="site-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
