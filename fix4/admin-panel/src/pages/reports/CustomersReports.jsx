import { useEffect, useState } from 'react'
import { Card, Table } from 'antd'
import api from '../../api'

function CustomersReports() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/users')
      const list = res?.data?.data || []
      setData(list.map((u) => ({ ...u, orders: undefined })))
    } catch (_) {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [])

  const columns = [
    { title: 'نام', dataIndex: 'name', key: 'name' },
    { title: 'ایمیل', dataIndex: 'email', key: 'email' },
    { title: 'نقش', dataIndex: 'role', key: 'role' },
    { title: 'وضعیت', dataIndex: 'isActive', key: 'isActive', render: (v)=> v ? 'فعال' : 'غیرفعال' },
    { title: 'تاریخ ایجاد', dataIndex: 'createdAt', key: 'createdAt', render: (d)=> d ? new Date(d).toLocaleString('fa-IR') : '-' },
  ]

  return (
    <div>
      <h1>گزارش مشتریان</h1>
      <Card>
        <Table columns={columns} dataSource={data} loading={loading} rowKey="_id" />
      </Card>
    </div>
  )
}

export default CustomersReports

