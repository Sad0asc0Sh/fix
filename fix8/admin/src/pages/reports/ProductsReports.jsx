import { useEffect, useState } from 'react'
import { Card, Table } from 'antd'
import api from '../../api'

function ProductsReports() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/products/stats')
      const stats = res?.data?.data || {}
      const rows = (stats.categoryStats || []).map((s, i) => ({ key: i, category: s._id, ...s }))
      setData(rows)
    } catch (_) {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchStats() }, [])

  const columns = [
    { title: 'دسته‌بندی', dataIndex: 'category', key: 'category' },
    { title: 'تعداد محصولات', dataIndex: 'numProducts', key: 'numProducts' },
    { title: 'موجودی کل', dataIndex: 'totalStock', key: 'totalStock' },
    { title: 'میانگین قیمت', dataIndex: 'avgPrice', key: 'avgPrice', render: (v)=> new Intl.NumberFormat('fa-IR').format(Math.round(v||0)) + ' تومان' },
  ]

  return (
    <div>
      <h1>گزارش محصولات</h1>
      <Card>
        <Table columns={columns} dataSource={data} loading={loading} rowKey="key" pagination={false} />
      </Card>
    </div>
  )
}

export default ProductsReports

