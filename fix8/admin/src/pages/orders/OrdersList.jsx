import { useEffect, useState } from 'react'
import { Table, Card, Tag, Input, Select, Space } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api'

function OrdersList() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const navigate = useNavigate()

  const fetchOrders = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const params = { page, limit: pageSize, sort: '-createdAt' }
      if (search) params.search = search
      if (status) params.status = status
      const res = await api.get('/orders/admin/all', { params })
      const list = res?.data?.data || []
      const pg = res?.data?.pagination
      setData(list)
      if (pg) setPagination({ current: pg.currentPage || page, pageSize, total: pg.totalOrders || list.length })
    } catch (_) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders(1, pagination.pageSize) }, [status])

  const columns = [
    {
      title: 'شماره سفارش',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (v, r) => v || r._id?.slice(-6),
    },
    {
      title: 'مشتری',
      dataIndex: ['user', 'name'],
      key: 'user',
    },
    {
      title: 'مبلغ',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (val) => new Intl.NumberFormat('fa-IR').format(val || 0) + ' تومان',
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = { pending: 'orange', processing: 'blue', confirmed: 'cyan', shipped: 'purple', delivered: 'green', cancelled: 'red' }
        return <Tag color={colors[status] || 'default'}>{status}</Tag>
      },
    },
    {
      title: 'تاریخ',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d) => new Date(d).toLocaleString('fa-IR'),
    },
    {
      title: 'جزئیات',
      key: 'actions',
      render: (_, record) => <Link to={`/orders/${record._id}`}>مشاهده</Link>,
    },
  ]

  const onTableChange = (pag) => {
    setPagination((prev) => ({ ...prev, current: pag.current, pageSize: pag.pageSize }))
    fetchOrders(pag.current, pag.pageSize)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>سفارشات</h1>
        <Space>
          <Input
            placeholder="جستجو (شماره سفارش/نام/تلفن)"
            prefix={<SearchOutlined />}
            style={{ width: 320 }}
            allowClear
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => fetchOrders(1, pagination.pageSize)}
            onBlur={() => fetchOrders(1, pagination.pageSize)}
          />
          <Select placeholder="وضعیت" style={{ width: 180 }} allowClear onChange={setStatus}>
            {['pending','processing','confirmed','shipped','delivered','cancelled'].map(s => (
              <Select.Option value={s} key={s}>{s}</Select.Option>
            ))}
          </Select>
        </Space>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="_id"
          pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true }}
          onChange={onTableChange}
          onRow={(record) => ({ onDoubleClick: () => navigate(`/orders/${record._id}`) })}
        />
      </Card>
    </div>
  )
}

export default OrdersList

