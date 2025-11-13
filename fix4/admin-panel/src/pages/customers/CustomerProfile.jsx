import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, Descriptions, Tabs, Table, Tag, message } from 'antd'
import api from '../../api'

function CustomerProfile() {
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [usersRes, ordersRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/orders/admin/all', { params: { userId: id, limit: 50, sort: '-createdAt' } }),
      ])
      const list = usersRes?.data?.data || []
      setUser(list.find((u) => u._id === id) || null)
      setOrders(ordersRes?.data?.data || [])
    } catch (err) {
      message.error(err?.message || 'خطا در دریافت اطلاعات کاربر')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [id])

  const orderColumns = [
    { title: 'شماره سفارش', dataIndex: 'orderNumber', key: 'orderNumber', render: (v,r)=> <Link to={`/orders/${r._id}`}>{v || r._id?.slice(-6)}</Link> },
    { title: 'مبلغ', dataIndex: 'totalPrice', key: 'totalPrice', render: (v) => new Intl.NumberFormat('fa-IR').format(v||0) + ' تومان' },
    { title: 'وضعیت', dataIndex: 'status', key: 'status', render: (s) => <Tag>{s}</Tag> },
    { title: 'تاریخ', dataIndex: 'createdAt', key: 'createdAt', render: (d) => new Date(d).toLocaleString('fa-IR') },
  ]

  return (
    <div>
      <h1>پروفایل مشتری</h1>
      <Card loading={loading}>
        {user && (
          <Descriptions bordered size="small">
            <Descriptions.Item label="نام">{user.name}</Descriptions.Item>
            <Descriptions.Item label="ایمیل">{user.email}</Descriptions.Item>
            <Descriptions.Item label="نقش">{user.role}</Descriptions.Item>
            <Descriptions.Item label="وضعیت">{user.isActive ? 'فعال' : 'غیرفعال'}</Descriptions.Item>
          </Descriptions>
        )}
        <Tabs
          style={{ marginTop: 16 }}
          items={[
            {
              key: 'orders',
              label: 'سفارشات',
              children: <Table columns={orderColumns} dataSource={orders} rowKey="_id" pagination={false} />,
            },
            {
              key: 'wallet',
              label: 'کیف پول',
              children: <div>API برای کیف پول در بک‌اند یافت نشد.</div>,
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default CustomerProfile

