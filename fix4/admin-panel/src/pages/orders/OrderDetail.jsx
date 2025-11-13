import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Descriptions, Tag, Table, Select, Button, message } from 'antd'
import api from '../../api'

function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState()
  const [saving, setSaving] = useState(false)

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/orders/${id}`)
      const o = res?.data?.data
      setOrder(o)
      setStatus(o?.status)
    } catch (err) {
      message.error(err?.message || 'خطا در دریافت سفارش')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrder() }, [id])

  const onChangeStatus = async () => {
    if (!status) return
    setSaving(true)
    try {
      await api.put(`/orders/${id}/status`, { status })
      message.success('وضعیت سفارش به‌روزرسانی شد')
      fetchOrder()
    } catch (err) {
      message.error(err?.message || 'به‌روزرسانی وضعیت انجام نشد')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { title: 'محصول', dataIndex: 'name', key: 'name' },
    { title: 'تعداد', dataIndex: 'qty', key: 'qty' },
    { title: 'قیمت', dataIndex: 'price', key: 'price', render: (v) => new Intl.NumberFormat('fa-IR').format(v || 0) + ' تومان' },
  ]

  const statusColor = (st) => ({ pending: 'orange', processing: 'blue', confirmed: 'cyan', shipped: 'purple', delivered: 'green', cancelled: 'red' }[st] || 'default')

  return (
    <div>
      <h1>جزئیات سفارش</h1>
      <Card loading={loading}>
        {order && (
          <>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="شماره سفارش">{order.orderNumber || order._id?.slice(-6)}</Descriptions.Item>
              <Descriptions.Item label="وضعیت"><Tag color={statusColor(order.status)}>{order.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="مبلغ کل">{new Intl.NumberFormat('fa-IR').format(order.totalPrice || 0)} تومان</Descriptions.Item>
              <Descriptions.Item label="تاریخ">{order.createdAt ? new Date(order.createdAt).toLocaleString('fa-IR') : '-'}</Descriptions.Item>
              <Descriptions.Item label="مشتری" span={2}>{order.user?.name} ({order.user?.email})</Descriptions.Item>
              <Descriptions.Item label="آدرس" span={2}>{order.shippingAddress?.address}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>تغییر وضعیت:</span>
              <Select value={status} onChange={setStatus} style={{ width: 200 }}>
                {['pending','processing','confirmed','shipped','delivered','cancelled'].map(s => (
                  <Select.Option value={s} key={s}>{s}</Select.Option>
                ))}
              </Select>
              <Button type="primary" onClick={onChangeStatus} loading={saving}>ثبت</Button>
            </div>

            <div style={{ marginTop: 24 }}>
              <h3>آیتم‌ها</h3>
              <Table
                columns={columns}
                dataSource={order.orderItems || []}
                rowKey={(r, i) => r.product?._id || String(i)}
                pagination={false}
                size="small"
              />
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

export default OrderDetail

