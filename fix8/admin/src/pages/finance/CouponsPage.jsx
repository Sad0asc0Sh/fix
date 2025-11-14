import { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Input, InputNumber, DatePicker, Select, message, Space } from 'antd'
import api from '../../api'

function CouponsPage() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const res = await api.get('/coupons', { params: { limit: 100 } })
      const list = res?.data?.data?.coupons || res?.data?.data || res?.data?.coupons || []
      setCoupons(list)
    } catch (err) {
      message.error(err?.message || 'خطا در دریافت کوپن‌ها')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCoupons() }, [])

  const onCreate = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        code: values.code,
        type: values.type,
        value: values.value,
        description: values.description,
        validFrom: values.valid?.[0]?.toISOString?.(),
        validUntil: values.valid?.[1]?.toISOString?.(),
        isActive: true,
      }
      await api.post('/coupons', payload)
      message.success('کوپن ایجاد شد')
      setOpen(false)
      form.resetFields()
      fetchCoupons()
    } catch (err) {
      if (err?.errorFields) return
      message.error(err?.message || 'ایجاد انجام نشد')
    }
  }

  const toggleActive = async (id) => {
    try {
      await api.patch(`/coupons/${id}/toggle`)
      fetchCoupons()
    } catch (err) {
      message.error(err?.message || 'به‌روزرسانی انجام نشد')
    }
  }

  const removeCoupon = async (id) => {
    Modal.confirm({
      title: 'حذف کوپن',
      content: 'این عمل غیرقابل بازگشت است. ادامه می‌دهید؟',
      okText: 'حذف',
      okType: 'danger',
      cancelText: 'انصراف',
      onOk: async () => {
        try {
          await api.delete(`/coupons/${id}`)
          message.success('حذف شد')
          fetchCoupons()
        } catch (err) {
          message.error(err?.message || 'حذف انجام نشد')
        }
      }
    })
  }

  const columns = [
    { title: 'کد', dataIndex: 'code', key: 'code' },
    { title: 'نوع', dataIndex: 'type', key: 'type' },
    { title: 'مقدار', dataIndex: 'value', key: 'value' },
    { title: 'وضعیت', dataIndex: 'isActive', key: 'isActive', render: (v) => <Tag color={v?'green':'red'}>{v?'فعال':'غیرفعال'}</Tag> },
    {
      title: 'عملیات', key: 'actions', render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => toggleActive(r._id)}>{r.isActive ? 'غیرفعال' : 'فعال'}</Button>
          <Button size="small" danger onClick={() => removeCoupon(r._id)}>حذف</Button>
        </Space>
      )
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>کوپن‌ها</h1>
        <Button type="primary" onClick={() => setOpen(true)}>کوپن جدید</Button>
      </div>
      <Card>
        <Table columns={columns} dataSource={coupons} loading={loading} rowKey="_id" />
      </Card>

      <Modal open={open} onCancel={() => setOpen(false)} onOk={onCreate} title="ایجاد کوپن">
        <Form layout="vertical" form={form}>
          <Form.Item name="code" label="کد" rules={[{ required: true, message: 'کد کوپن را وارد کنید' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="نوع" initialValue="percentage" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="percentage">درصدی</Select.Option>
              <Select.Option value="fixed">مبلغ ثابت</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="value" label="مقدار" rules={[{ required: true, message: 'مقدار را وارد کنید' }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="description" label="توضیحات">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="valid" label="بازه اعتبار">
            <DatePicker.RangePicker style={{ width: '100%' }} showTime />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CouponsPage

