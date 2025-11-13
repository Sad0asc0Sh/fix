#!/bin/bash

# ===========================================
# ایجاد تمام صفحات پنل ادمین
# ===========================================

cd /home/claude/admin-panel

# 1. صفحه Login
cat > src/pages/LoginPage.jsx << 'LOGIN'
import { useState } from 'react'
import { Form, Input, Button, Card, Alert, Space } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores'

function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const onFinish = (values) => {
    setLoading(true)
    setError('')
    
    // شبیه‌سازی تاخیر شبکه
    setTimeout(() => {
      const result = login(values.email, values.password)
      if (result.success) {
        navigate('/')
      } else {
        setError(result.message)
      }
      setLoading(false)
    }, 500)
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card 
        style={{ width: 400, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
        bordered={false}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 'bold', color: '#1890ff' }}>
            پنل مدیریت
          </h1>
          <p style={{ color: '#999' }}>وارد شوید</p>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
            onClose={() => setError('')}
          />
        )}

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'لطفا ایمیل خود را وارد کنید!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="ایمیل" 
              type="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'لطفا رمز عبور خود را وارد کنید!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="رمز عبور"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              ورود
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <strong>اطلاعات تستی:</strong>
          <div style={{ marginTop: 8, fontSize: 13 }}>
            <div>ایمیل: <code>admin@example.com</code></div>
            <div>رمز عبور: <code>password</code></div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default LoginPage
LOGIN

# 2. صفحه Dashboard
cat > src/pages/Dashboard.jsx << 'DASHBOARD'
import { Row, Col, Card, Statistic, Table, Tag, Button } from 'antd'
import { 
  DollarOutlined, 
  ShoppingCartOutlined, 
  InboxOutlined,
  ShoppingOutlined,
  ArrowUpOutlined,
  UserAddOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import { Line } from 'recharts'
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Link } from 'react-router-dom'
import { mockDashboardStats } from '../data/mockData'

function Dashboard() {
  const stats = mockDashboardStats

  const orderColumns = [
    { title: 'شماره سفارش', dataIndex: 'orderNumber', key: 'orderNumber' },
    { title: 'مشتری', dataIndex: ['customer', 'name'], key: 'customer' },
    { 
      title: 'مبلغ', 
      dataIndex: 'totalAmount', 
      key: 'total',
      render: (val) => new Intl.NumberFormat('fa-IR').format(val) + ' تومان'
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          pending: 'orange',
          processing: 'blue',
          confirmed: 'cyan',
          shipped: 'purple',
          delivered: 'green',
          cancelled: 'red',
        }
        return <Tag color={colors[status]}>{status}</Tag>
      },
    },
  ]

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>داشبورد</h1>

      {/* ویجت‌های آماری */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="فروش امروز"
              value={stats.todaySales}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
              suffix="تومان"
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#3f8600' }}>
              <ArrowUpOutlined /> {stats.todaySalesChange}% نسبت به دیروز
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Link to="/orders">
              <Statistic
                title="سفارشات در انتظار"
                value={stats.pendingOrders}
                valueStyle={{ color: '#1890ff' }}
                prefix={<ShoppingCartOutlined />}
              />
            </Link>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="سبدهای رها شده"
              value={stats.abandonedCarts}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="کاربران جدید"
              value={stats.newCustomers}
              valueStyle={{ color: '#52c41a' }}
              prefix={<UserAddOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* نمودار فروش */}
        <Col xs={24} lg={16}>
          <Card title="نمودار فروش (7 روز اخیر)" extra={<Button type="link">مشاهده بیشتر</Button>}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.salesChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#1890ff" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* محصولات با موجودی کم */}
        <Col xs={24} lg={8}>
          <Card title="محصولات با موجودی کم" extra={<Button type="link">مشاهده همه</Button>}>
            {stats.lowStockProducts.map(product => (
              <div key={product.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '8px 0',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <span>{product.name}</span>
                <Tag color="red">{product.stock} عدد</Tag>
              </div>
            ))}
          </Card>
        </Col>

        {/* آخرین سفارشات */}
        <Col xs={24}>
          <Card title="آخرین سفارشات" extra={<Button type="link">مشاهده همه</Button>}>
            <Table 
              columns={orderColumns} 
              dataSource={stats.recentOrders} 
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
DASHBOARD

echo "✅ صفحات Login و Dashboard ایجاد شد"
