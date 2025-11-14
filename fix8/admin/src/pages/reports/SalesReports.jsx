import { useEffect, useState } from 'react'
import { Card, Table } from 'antd'
import api from '../../api'

function SalesReports() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/orders/stats')
      const data = res?.data?.data || []
      setRows(Array.isArray(data) ? data : (data.status ? data.status : []))
    } catch (_) {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchStats() }, [])

  const columns = [
    { title: 'وضعیت', dataIndex: '_id', key: '_id' },
    { title: 'تعداد', dataIndex: 'count', key: 'count' },
    { title: 'مجموع مبلغ', dataIndex: 'totalAmount', key: 'totalAmount', render: (v)=> new Intl.NumberFormat('fa-IR').format(v||0)+' تومان' },
  ]

  return (
    <div>
      <h1>گزارش فروش</h1>
      <Card>
        <Table columns={columns} dataSource={rows} loading={loading} rowKey={(r)=>r._id} pagination={false} />
      </Card>
    </div>
  )
}

export default SalesReports

