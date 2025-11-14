import { useEffect, useState } from 'react'
import { Card, Table, Tag } from 'antd'
import api from '../../api'

function AdminsPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const res = await api.get('/admin/users')
        setUsers((res?.data?.data || []).filter((u) => u.role === 'admin'))
      } catch (_) {}
      finally { setLoading(false) }
    })()
  }, [])

  const columns = [
    { title: 'نام', dataIndex: 'name', key: 'name' },
    { title: 'ایمیل', dataIndex: 'email', key: 'email' },
    { title: 'نقش', dataIndex: 'role', key: 'role', render: (r) => <Tag>{r}</Tag> },
    { title: 'وضعیت', dataIndex: 'isActive', key: 'isActive', render: (v) => <Tag color={v?'green':'red'}>{v?'فعال':'غیرفعال'}</Tag> },
  ]

  return (
    <div>
      <h1>ادمین‌ها</h1>
      <Card>
        <Table columns={columns} dataSource={users} loading={loading} rowKey="_id" />
      </Card>
    </div>
  )
}

export default AdminsPage

