import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Button } from 'antd'
import { DollarOutlined, ShoppingCartOutlined, ShoppingOutlined, ArrowUpOutlined, UserAddOutlined } from '@ant-design/icons'
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts'
import { Link } from 'react-router-dom'
import api from '../api'

function Dashboard() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    todaySales: 0,
    todaySalesChange: 0,
    pendingOrders: 0,
    lowStockProducts: [],
    newCustomers: 0,
    recentOrders: [],
    salesChart: [],
  })

  const orderColumns = [
    { title: 'شماره سفارش', dataIndex: 'orderNumber', key: 'orderNumber' },
    { title: 'مشتری', dataIndex: ['customer', 'name'], key: 'customer' },
    { title: 'مبلغ', dataIndex: 'totalAmount', key: 'total', render: (val) => new Intl.NumberFormat('fa-IR').format(val) + ' تومان' },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = { pending: 'orange', processing: 'blue', confirmed: 'cyan', shipped: 'purple', delivered: 'green', cancelled: 'red' }
        return <Tag color={colors[status] || 'default'}>{status}</Tag>
      },
    },
  ]

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0)

      const [ordersStatsRes, ordersRes, lowStockRes, usersRes] = await Promise.all([
        api.get('/orders/admin/stats'),
        api.get('/orders/admin/all', { params: { page: 1, limit: 200, sort: '-createdAt' } }),
        api.get('/products', { params: { 'stock[lt]': 10, limit: 5, sort: 'stock', fields: 'name,stock,_id' } }),
        api.get('/admin/users'),
      ])

      const orders = ordersRes?.data?.data || []
      const lowStockProducts = (lowStockRes?.data?.data || []).map((p) => ({ id: p._id, name: p.name, stock: p.stock }))
      const pendingOrders = ordersStatsRes?.data?.data?.pendingOrders || 0

      const todaySales = orders
        .filter((o) => o.createdAt && new Date(o.createdAt) >= today)
        .reduce((sum, o) => sum + (o.totalPrice || 0), 0)

      const recentOrders = orders.slice(0, 5).map((o) => ({
        id: o._id,
        orderNumber: o.orderNumber || o._id?.slice(-6),
        customer: { name: o.user?.name || 'کاربر' },
        totalAmount: o.totalPrice || 0,
        status: o.status || 'pending',
      }))

      // Aggregate sales by day for simple chart
      const labelsSet = new Set()
      const sumsByDay = new Map()
      orders.forEach((o) => {
        if (!o.createdAt) return
        const key = new Date(o.createdAt).toISOString().slice(0, 10)
        labelsSet.add(key)
        sumsByDay.set(key, (sumsByDay.get(key) || 0) + (o.totalPrice || 0))
      })
      const labels = Array.from(labelsSet).sort()
      const salesChart = labels.map((l) => ({ date: l, sales: Math.round((sumsByDay.get(l) || 0) * 100) / 100 }))

      // Week-over-week change
      const lastWeek = new Date(); lastWeek.setDate(lastWeek.getDate() - 7)
      const prevWeek = new Date(); prevWeek.setDate(prevWeek.getDate() - 14)
      const lastWeekSum = orders.filter((o) => new Date(o.createdAt) >= lastWeek).reduce((s, o) => s + (o.totalPrice || 0), 0)
      const prevWeekSum = orders.filter((o) => new Date(o.createdAt) < lastWeek && new Date(o.createdAt) >= prevWeek).reduce((s, o) => s + (o.totalPrice || 0), 0)
      const todaySalesChange = prevWeekSum ? Math.round(((lastWeekSum - prevWeekSum) / prevWeekSum) * 100) : 0

      const users = usersRes?.data?.data || []
      const newCustomers = users.filter((u) => u.createdAt && new Date(u.createdAt) >= new Date(Date.now() - 24 * 60 * 60 * 1000)).length

      setStats({ todaySales, todaySalesChange, pendingOrders, lowStockProducts, newCustomers, recentOrders, salesChart })
    } catch (err) {
      setStats((s) => ({ ...s }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDashboard() }, [])

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>داشبورد</h1>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="فروش امروز"
              value={stats.todaySales}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
              suffix="تومان"
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#3f8600' }}>
              <ArrowUpOutlined /> {stats.todaySalesChange}% نسبت به هفته قبل
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Link to="/orders">
              <Statistic title="سفارشات در انتظار" value={stats.pendingOrders} valueStyle={{ color: '#1890ff' }} prefix={<ShoppingCartOutlined />} />
            </Link>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic title="سبدهای رها شده" value={0} valueStyle={{ color: '#cf1322' }} prefix={<ShoppingOutlined />} />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic title="کاربران جدید" value={stats.newCustomers} valueStyle={{ color: '#52c41a' }} prefix={<UserAddOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="روند فروش (۷ روز اخیر)" extra={<Button type="link">گزارش کامل</Button>} loading={loading}>
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

        <Col xs={24} lg={8}>
          <Card title="محصولات با موجودی کم" extra={<Button type="link">مدیریت موجودی</Button>} loading={loading}>
            {stats.lowStockProducts.map((product) => (
              <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>{product.name}</span>
                <Tag color="red">{product.stock} عدد</Tag>
              </div>
            ))}
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="سفارشات اخیر" extra={<Button type="link">مشاهده همه</Button>}>
            <Table columns={orderColumns} dataSource={stats.recentOrders} rowKey="id" pagination={false} loading={loading} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard

