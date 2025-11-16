import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Button } from 'antd'
import {
  DollarOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  ArrowUpOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import {
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
} from 'recharts'
import { Link } from 'react-router-dom'
import api from '../api'

function Dashboard() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalSales: 0,
    newOrders: 0,
    pendingOrders: 0,
    lowStockProducts: [],
    newCustomers: 0,
    recentOrders: [],
    salesChart: [],
    openTickets: 0,
  })

  const orderColumns = [
    {
      title: 'شماره سفارش',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: 'مشتری',
      dataIndex: ['customer', 'name'],
      key: 'customer',
    },
    {
      title: 'مبلغ کل',
      dataIndex: 'totalAmount',
      key: 'total',
      render: (val) =>
        `${new Intl.NumberFormat('fa-IR').format(val || 0)} تومان`,
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          Pending: 'orange',
          Processing: 'blue',
          Shipped: 'purple',
          Delivered: 'green',
          Cancelled: 'red',
          pending: 'orange',
          processing: 'blue',
          shipped: 'purple',
          delivered: 'green',
          cancelled: 'red',
        }
        return <Tag color={colors[status] || 'default'}>{status}</Tag>
      },
    },
  ]

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const res = await api.get('/dashboard/stats')
      const data = res?.data?.data || {}
      setStats({
        totalSales: data.totalSales || 0,
        newOrders: data.newOrders || 0,
        pendingOrders: data.pendingOrders || 0,
        lowStockProducts: data.lowStockProducts || [],
        newCustomers: data.newCustomers || 0,
        recentOrders: data.recentOrders || [],
        salesChart: data.salesChart || [],
        openTickets: data.openTickets || 0,
      })
    } catch (err) {
      // در صورت خطا، مقادیر فعلی را حفظ می‌کنیم
      setStats((s) => ({ ...s }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>داشبورد</h1>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="مجموع فروش (همه زمان‌ها)"
              value={stats.totalSales}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
              suffix="تومان"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Link to="/orders">
              <Statistic
                title="سفارش‌های جدید (۲۴ ساعت گذشته)"
                value={stats.newOrders}
                valueStyle={{ color: '#1890ff' }}
                prefix={<ShoppingCartOutlined />}
              />
            </Link>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="سفارش‌های در انتظار / در حال پردازش"
              value={stats.pendingOrders}
              valueStyle={{ color: '#faad14' }}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="مشتریان جدید (۲۴ ساعت گذشته)"
              value={stats.newCustomers}
              valueStyle={{ color: '#52c41a' }}
              prefix={<UserAddOutlined />}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#cf1322' }}>
              تیکت‌های باز: {stats.openTickets}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="روند فروش (۷ روز گذشته)"
            extra={<Button type="link">گزارش فروش</Button>}
            loading={loading}
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.salesChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#1890ff"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title="محصولات با موجودی کم"
            extra={<Button type="link">مدیریت موجودی</Button>}
            loading={loading}
          >
            {stats.lowStockProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <span>{product.name}</span>
                <Tag color="red">{product.stock} عدد</Tag>
              </div>
            ))}
            {!loading && stats.lowStockProducts.length === 0 && (
              <div style={{ color: '#999', textAlign: 'center' }}>
                محصولی با موجودی کم یافت نشد.
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24}>
          <Card
            title="سفارش‌های اخیر"
            extra={<Button type="link">مشاهده همه سفارش‌ها</Button>}
            loading={loading}
          >
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

