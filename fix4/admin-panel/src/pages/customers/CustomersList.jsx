import { useEffect, useMemo, useState } from 'react'
import { Table, Card, Input, Tag } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import api from '../../api'

function CustomersList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/users')
      setUsers(res?.data?.data || [])
    } catch (_) {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [])

  const filtered = useMemo(() => {
    if (!search) return users
    const q = search.toLowerCase()
    return users.filter(u => (u.name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q))
  }, [users, search])

  const columns = [
    { title: 'نام', dataIndex: 'name', key: 'name' },
    { title: 'ایمیل', dataIndex: 'email', key: 'email' },
    { title: 'نقش', dataIndex: 'role', key: 'role', render: (r) => <Tag>{r}</Tag> },
    { title: 'وضعیت', dataIndex: 'isActive', key: 'isActive', render: (v) => <Tag color={v?'green':'red'}>{v?'فعال':'غیرفعال'}</Tag> },
    { title: 'مشاهده', key: 'actions', render: (_, r) => <Link to={`/customers/${r._id}`}>نمایش</Link> },
  ]

  return (
    <div>
      <h1>مشتریان</h1>
      <div style={{ marginBottom: 12 }}>
        <Input
          placeholder="جستجوی نام یا ایمیل"
          prefix={<SearchOutlined />}
          style={{ width: 320 }}
          allowClear
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Card>
        <Table columns={columns} dataSource={filtered} loading={loading} rowKey="_id" />
      </Card>
    </div>
  )
}

export default CustomersList

