import { useEffect, useState } from 'react'
import { Card, Table, Tag, Input, Select, Space, Button, Modal, Descriptions, Form, message } from 'antd'
import api from '../../api'

function RMAPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [status, setStatus] = useState()
  const [userId, setUserId] = useState('')
  const [orderId, setOrderId] = useState('')

  const [manageOpen, setManageOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailStatus, setDetailStatus] = useState('pending')
  const [detailNotes, setDetailNotes] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm] = Form.useForm()
  const [creating, setCreating] = useState(false)

  const fetchRMAs = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const params = { page, limit: pageSize, sort: '-createdAt' }
      if (status) params.status = status
      if (userId) params.userId = userId
      if (orderId) params.orderId = orderId
      const res = await api.get('/rma/admin/all', { params })
      const list = res?.data?.data || []
      const pg = res?.data?.pagination
      setData(list)
      if (pg) setPagination({ current: pg.currentPage || page, pageSize, total: pg.totalItems || list.length })
    } catch (err) {
      message.error(err?.message || 'خطا در دریافت RMA')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRMAs(1, pagination.pageSize) }, [status])

  const openManage = async (id) => {
    setManageOpen(true)
    setSelectedId(id)
    setDetailLoading(true)
    try {
      const res = await api.get(`/rma/${id}`)
      const d = res?.data?.data
      setDetail(d)
      setDetailStatus(d?.status || 'pending')
      setDetailNotes(d?.adminNotes || '')
    } catch (err) {
      message.error(err?.message || 'خطا در دریافت جزئیات RMA')
    } finally {
      setDetailLoading(false)
    }
  }

  const saveManage = async () => {
    if (!selectedId) return
    try {
      setDetailLoading(true)
      await api.put(`/rma/${selectedId}/status`, { status: detailStatus, adminNotes: detailNotes })
      message.success('به‌روزرسانی شد')
      setManageOpen(false)
      setSelectedId(null)
      fetchRMAs()
    } catch (err) {
      message.error(err?.message || 'به‌روزرسانی انجام نشد')
    } finally {
      setDetailLoading(false)
    }
  }

  const columns = [
    { title: 'شماره سفارش', key: 'order', dataIndex: ['order','orderNumber'] },
    { title: 'کاربر', key: 'user', render: (_, r) => r.user ? `${r.user.name} (${r.user.email})` : '-' },
    { title: 'علت', dataIndex: 'reason', key: 'reason' },
    { title: 'آیتم‌ها', key: 'items', render: (r) => (r.items||[]).reduce((s,it)=> s + (it.quantity||0), 0) },
    { title: 'وضعیت', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s==='approved'?'green':s==='rejected'?'red':s==='processing'?'blue':s==='completed'?'cyan':'orange'}>{s}</Tag> },
    { title: 'تاریخ', dataIndex: 'createdAt', key: 'createdAt', render: (d) => d ? new Date(d).toLocaleString('fa-IR') : '-' },
    { title: 'مدیریت', key: 'actions', render: (_, r) => <Button onClick={() => openManage(r._id)}>مدیریت</Button> },
  ]

  const onTableChange = (pag) => {
    setPagination((prev) => ({ ...prev, current: pag.current, pageSize: pag.pageSize }))
    fetchRMAs(pag.current, pag.pageSize)
  }

  const createRMA = async () => {
    try {
      const values = await createForm.validateFields()
      setCreating(true)
      await api.post('/rma', values)
      message.success('RMA ایجاد شد')
      setCreateOpen(false)
      createForm.resetFields()
      fetchRMAs()
    } catch (err) {
      if (!err?.errorFields) message.error(err?.message || 'ایجاد انجام نشد')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <h1>درخواست‌های بازگشت (RMA)</h1>
        <Space>
          <Select placeholder="وضعیت" style={{ width: 160 }} allowClear onChange={setStatus}>
            {['pending','approved','rejected','processing','completed'].map(s => (
              <Select.Option key={s} value={s}>{s}</Select.Option>
            ))}
          </Select>
          <Input placeholder="User ID" style={{ width: 220 }} allowClear value={userId} onChange={(e)=>setUserId(e.target.value)} onPressEnter={()=>fetchRMAs(1,pagination.pageSize)} onBlur={()=>fetchRMAs(1,pagination.pageSize)} />
          <Input placeholder="Order ID" style={{ width: 220 }} allowClear value={orderId} onChange={(e)=>setOrderId(e.target.value)} onPressEnter={()=>fetchRMAs(1,pagination.pageSize)} onBlur={()=>fetchRMAs(1,pagination.pageSize)} />
          <Button type="primary" onClick={()=>fetchRMAs(1, pagination.pageSize)}>اعمال فیلتر</Button>
          <Button onClick={()=>{ setStatus(undefined); setUserId(''); setOrderId(''); fetchRMAs(1, pagination.pageSize) }}>ریست</Button>
          <Button onClick={()=>setCreateOpen(true)}>ثبت RMA دستی</Button>
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
        />
      </Card>

      <Modal open={manageOpen} onCancel={()=>setManageOpen(false)} onOk={saveManage} okText="ذخیره تغییرات" confirmLoading={detailLoading} title="مدیریت RMA">
        <Card loading={detailLoading} bordered={false}>
          {detail && (
            <>
              <Descriptions bordered size="small">
                <Descriptions.Item label="کاربر">{detail.user ? `${detail.user.name} (${detail.user.email})` : '-'}</Descriptions.Item>
                <Descriptions.Item label="سفارش">{detail.order?.orderNumber || '-'}</Descriptions.Item>
                <Descriptions.Item label="علت" span={2}>{detail.reason}</Descriptions.Item>
                <Descriptions.Item label="وضعیت" span={2}><Tag>{detail.status}</Tag></Descriptions.Item>
              </Descriptions>

              <div style={{ marginTop: 12 }}>
                <strong>آیتم‌ها:</strong>
                <ul>
                  {(detail.items || []).map((it, idx) => (
                    <li key={idx}>{it.product?.name || it.product} × {it.quantity}</li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>وضعیت جدید:</span>
                <Select value={detailStatus} onChange={setDetailStatus} style={{ width: 200 }}>
                  {['pending','approved','rejected','processing','completed'].map(s => (
                    <Select.Option key={s} value={s}>{s}</Select.Option>
                  ))}
                </Select>
              </div>

              <div style={{ marginTop: 12 }}>
                <Form layout="vertical">
                  <Form.Item label="یادداشت ادمین">
                    <Input.TextArea rows={3} value={detailNotes} onChange={(e)=>setDetailNotes(e.target.value)} />
                  </Form.Item>
                </Form>
              </div>
            </>
          )}
        </Card>
      </Modal>

      <Modal open={createOpen} onCancel={()=>setCreateOpen(false)} onOk={createRMA} okText="ثبت RMA" confirmLoading={creating} title="ثبت RMA دستی">
        <Form layout="vertical" form={createForm}>
          <Form.Item name="user" label="User ID (اختیاری - فقط ادمین)" tooltip="اگر خالی بماند، RMA به نام اکانت فعلی ثبت می‌شود (ادمین).">
            <Input />
          </Form.Item>
          <Form.Item name="order" label="Order ID" rules={[{ required: true, message: 'شناسه سفارش را وارد کنید' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="reason" label="علت بازگشت" rules={[{ required: true, message: 'علت بازگشت را وارد کنید' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="آیتم (اختیاری)">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input placeholder="Product ID" onChange={(e)=>{ const val = e.target.value; const items = createForm.getFieldValue('items') || []; items[0] = { ...(items[0]||{}), product: val }; createForm.setFieldsValue({ items }) }} />
              <Input placeholder="Quantity" type="number" onChange={(e)=>{ const val = Number(e.target.value); const items = createForm.getFieldValue('items') || []; items[0] = { ...(items[0]||{}), quantity: val }; createForm.setFieldsValue({ items }) }} />
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default RMAPage

