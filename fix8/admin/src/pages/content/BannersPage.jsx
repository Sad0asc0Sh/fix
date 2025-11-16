import { useEffect, useState } from 'react'
import { Card, Table, Button, Space, Input, Select, Modal, Form, Tag, message, Popconfirm, Upload } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import jalaliday from 'jalaliday'
import api from '../../api'

// فعال‌سازی تقویم جلالی
dayjs.extend(jalaliday)
dayjs.calendar('jalali')

// نام ماه‌های شمسی
const persianMonths = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

// تابع برای فرمت کردن تاریخ با نام ماه فارسی
const formatPersianDate = (date, includeTime = false) => {
  if (!date) return '—'
  const jalaliDate = dayjs(date).calendar('jalali').locale('fa')
  const year = jalaliDate.format('YYYY')
  const month = persianMonths[parseInt(jalaliDate.format('M')) - 1]
  const day = jalaliDate.format('DD')

  if (includeTime) {
    const time = jalaliDate.format('HH:mm')
    return `${day} ${month} ${year} - ساعت ${time}`
  }
  return `${day} ${month} ${year}`
}

function BannersPage() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [position, setPosition] = useState()

  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [fileList, setFileList] = useState([])

  const fetchBanners = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const params = { page, limit: pageSize, sort: '-createdAt' }
      if (position) params.position = position
      const res = await api.get('/banners', { params })
      const list = res?.data?.data || []
      const pg = res?.data?.pagination
      setBanners(list)
      if (pg) setPagination({ current: pg.currentPage || page, pageSize, total: pg.totalItems || list.length })
    } catch (err) {
      message.error(err?.message || 'خطا در دریافت بنرها')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBanners(1, pagination.pageSize) }, [])
  useEffect(() => { fetchBanners(1, pagination.pageSize) }, [position])

  const columns = [
    { title: 'عنوان', dataIndex: 'title', key: 'title' },
    { title: 'موقعیت', dataIndex: 'position', key: 'position' },
    { title: 'وضعیت', dataIndex: 'isActive', key: 'isActive', render: (v)=> <Tag color={v?'green':'red'}>{v?'فعال':'غیرفعال'}</Tag> },
    { title: 'لینک', dataIndex: 'link', key: 'link' },
    { title: 'تصویر', dataIndex: ['image','url'], key: 'image', render: (u)=> u? <a href={u} target="_blank" rel="noreferrer">مشاهده</a> : '-' },
    { title: 'تاریخ', dataIndex: 'createdAt', key: 'createdAt', render: (d)=> formatPersianDate(d, true) },
    { title: 'عملیات', key: 'actions', render: (_, r) => (
      <Space>
        <Button size="small" onClick={()=>onEdit(r)}>ویرایش</Button>
        <Popconfirm title="حذف این بنر؟" onConfirm={()=>onDelete(r._id)}>
          <Button size="small" danger>حذف</Button>
        </Popconfirm>
      </Space>
    ) },
  ]

  const onTableChange = (pag) => {
    setPagination((prev) => ({ ...prev, current: pag.current, pageSize: pag.pageSize }))
    fetchBanners(pag.current, pag.pageSize)
  }

  const onNew = () => {
    setEditing(null)
    form.resetFields()
    setFileList([])
    form.setFieldsValue({ position: 'homepage-slider', isActive: true })
    setOpen(true)
  }

  const onEdit = (b) => {
    setEditing(b)
    setFileList([])
    form.setFieldsValue({ title: b.title, link: b.link, position: b.position, isActive: b.isActive, imageUrl: b.image?.url })
    setOpen(true)
  }

  const onDelete = async (id) => {
    try { await api.delete(`/banners/${id}`); message.success('حذف شد'); fetchBanners() } catch (err) { message.error(err?.message || 'حذف انجام نشد') }
  }

  const toBase64 = (file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=reject; reader.readAsDataURL(file); })

  const save = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      let image = values.imageUrl ? { url: values.imageUrl } : undefined
      if (fileList.length > 0) { const b64 = await toBase64(fileList[0].originFileObj); image = { url: String(b64) } }
      const payload = { title: values.title, link: values.link, position: values.position, isActive: values.isActive, image }
      if (editing) { await api.put(`/banners/${editing._id}`, payload); message.success('ویرایش شد') } else { await api.post('/banners', payload); message.success('ایجاد شد') }
      setOpen(false)
      setEditing(null)
      fetchBanners()
    } catch (err) { if (!err?.errorFields) message.error(err?.message || 'ذخیره انجام نشد') } finally { setSaving(false) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>بنرها</h1>
        <Space>
          <Select placeholder="موقعیت" allowClear style={{ width: 200 }} onChange={setPosition}>
            <Select.Option value="homepage-slider">homepage-slider</Select.Option>
            <Select.Option value="sidebar">sidebar</Select.Option>
            <Select.Option value="product-page">product-page</Select.Option>
          </Select>
          <Button onClick={()=>fetchBanners(1,pagination.pageSize)}>اعمال</Button>
          <Button type="primary" onClick={onNew}>بنر جدید</Button>
        </Space>
      </div>
      <Card>
        <Table columns={columns} dataSource={banners} loading={loading} rowKey="_id" pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true }} onChange={onTableChange} />
      </Card>

      <Modal open={open} onCancel={()=>setOpen(false)} onOk={save} okText={editing?'ذخیره':'ایجاد'} confirmLoading={saving} title={editing?'ویرایش بنر':'بنر جدید'} width={700}>
        <Form layout="vertical" form={form}>
          <Form.Item name="title" label="عنوان" rules={[{ required: true, message: 'عنوان را وارد کنید' }]}><Input /></Form.Item>
          <Form.Item name="link" label="لینک"><Input placeholder="https://..." /></Form.Item>
          <Form.Item name="position" label="موقعیت" rules={[{ required: true }]}><Select>
            <Select.Option value="homepage-slider">homepage-slider</Select.Option>
            <Select.Option value="sidebar">sidebar</Select.Option>
            <Select.Option value="product-page">product-page</Select.Option>
          </Select></Form.Item>
          <Form.Item name="isActive" label="فعال"><Select><Select.Option value={true}>فعال</Select.Option><Select.Option value={false}>غیرفعال</Select.Option></Select></Form.Item>
          <Form.Item name="imageUrl" label="آدرس تصویر (اختیاری)"><Input placeholder="https://..." /></Form.Item>
          <Form.Item label="آپلود تصویر (اختیاری)">
            <Upload.Dragger beforeUpload={()=>false} fileList={fileList} onChange={({fileList})=>setFileList(fileList)} maxCount={1}>
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p className="ant-upload-text">فایل تصویر را رها کنید یا کلیک کنید</p>
            </Upload.Dragger>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default BannersPage

