import { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Space,
  message,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import api from '../../api'

const { Option } = Select

function ShippingPage() {
  const [methods, setMethods] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingMethod, setEditingMethod] = useState(null)
  const [form] = Form.useForm()

  const fetchMethods = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(pageSize))
      params.set('includeInactive', 'true')

      const res = await api.get('/shipping/admin', { params })
      const list = res?.data?.data || []
      const pg = res?.data?.pagination

      setMethods(list)
      if (pg) {
        setPagination({
          current: pg.currentPage || page,
          pageSize: pg.itemsPerPage || pageSize,
          total: pg.totalItems || list.length,
        })
      } else {
        setPagination((prev) => ({
          ...prev,
          total: list.length,
          current: page,
          pageSize,
        }))
      }
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message || err?.message || 'خطا در دریافت روش‌های ارسال'
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMethods()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreateModal = () => {
    setEditingMethod(null)
    form.resetFields()
    form.setFieldsValue({
      costType: 'fixed',
      cost: 0,
      isActive: true,
    })
    setOpen(true)
  }

  const openEditModal = (method) => {
    setEditingMethod(method)
    form.setFieldsValue({
      name: method.name,
      description: method.description,
      costType: method.costType || 'fixed',
      cost: method.cost || 0,
      isActive: method.isActive,
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      const payload = {
        name: values.name,
        description: values.description || '',
        costType: values.costType || 'fixed',
        cost: values.cost ?? 0,
        isActive: values.isActive !== undefined ? values.isActive : true,
      }

      setSaving(true)

      if (editingMethod) {
        await api.put(`/shipping/${editingMethod._id}`, payload)
        message.success('روش ارسال با موفقیت ویرایش شد')
      } else {
        await api.post('/shipping', payload)
        message.success('روش ارسال با موفقیت ایجاد شد')
      }

      setOpen(false)
      setEditingMethod(null)
      form.resetFields()
      fetchMethods()
    } catch (err) {
      if (err?.errorFields) {
        // خطای ولیدیشن فرم
        return
      }
      const errorMsg =
        err?.response?.data?.message || err?.message || 'خطا در ذخیره روش ارسال'
      message.error(errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (method) => {
    try {
      await api.put(`/shipping/${method._id}`, {
        isActive: !method.isActive,
      })
      message.success('وضعیت روش ارسال به‌روزرسانی شد')
      fetchMethods()
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message || err?.message || 'خطا در به‌روزرسانی وضعیت روش ارسال'
      message.error(errorMsg)
    }
  }

  const removeMethod = (id) => {
    Modal.confirm({
      title: 'حذف روش ارسال',
      content: 'آیا از حذف این روش ارسال مطمئن هستید؟ این عملیات قابل بازگشت نیست.',
      okText: 'حذف',
      okType: 'danger',
      cancelText: 'انصراف',
      onOk: async () => {
        try {
          await api.delete(`/shipping/${id}`)
          message.success('روش ارسال با موفقیت حذف شد')
          fetchMethods()
        } catch (err) {
          const errorMsg =
            err?.response?.data?.message || err?.message || 'خطا در حذف روش ارسال'
          message.error(errorMsg)
        }
      },
    })
  }

  const getCostTypeLabel = (type) => {
    if (type === 'per_item') return 'بر اساس تعداد آیتم'
    if (type === 'weight_based') return 'بر اساس وزن'
    return 'هزینه ثابت'
  }

  const columns = [
    {
      title: 'نام روش',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'توضیحات',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'نوع هزینه',
      dataIndex: 'costType',
      key: 'costType',
      width: 160,
      render: (type) => <Tag>{getCostTypeLabel(type)}</Tag>,
    },
    {
      title: 'هزینه',
      dataIndex: 'cost',
      key: 'cost',
      width: 160,
      render: (value) =>
        `${new Intl.NumberFormat('fa-IR').format(value || 0)} تومان`,
    },
    {
      title: 'وضعیت',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          onChange={() => toggleActive(record)}
          checkedChildren="فعال"
          unCheckedChildren="غیرفعال"
        />
      ),
    },
    {
      title: 'عملیات',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            ویرایش
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => removeMethod(record._id)}
          >
            حذف
          </Button>
        </Space>
      ),
    },
  ]

  const onTableChange = (pag) => {
    setPagination((prev) => ({
      ...prev,
      current: pag.current,
      pageSize: pag.pageSize,
    }))
    fetchMethods(pag.current, pag.pageSize)
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h1>مدیریت روش‌های ارسال</h1>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => fetchMethods()}>
            بارگذاری مجدد
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            ایجاد روش جدید
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={methods}
          loading={loading}
          rowKey="_id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `${total} روش ارسال`,
          }}
          onChange={onTableChange}
        />
      </Card>

      <Modal
        open={open}
        onCancel={() => {
          setOpen(false)
          form.resetFields()
          setEditingMethod(null)
        }}
        onOk={handleSubmit}
        confirmLoading={saving}
        title={editingMethod ? 'ویرایش روش ارسال' : 'ایجاد روش ارسال جدید'}
        okText="ذخیره"
        cancelText="انصراف"
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            name="name"
            label="نام روش ارسال"
            rules={[{ required: true, message: 'نام روش ارسال را وارد کنید' }]}
          >
            <Input placeholder="مثلاً: پست پیشتاز" />
          </Form.Item>

          <Form.Item name="description" label="توضیحات">
            <Input.TextArea rows={3} placeholder="توضیحات اختیاری درباره این روش..." />
          </Form.Item>

          <Form.Item
            name="costType"
            label="نوع هزینه"
            rules={[{ required: true, message: 'نوع هزینه را انتخاب کنید' }]}
          >
            <Select>
              <Option value="fixed">هزینه ثابت</Option>
              <Option value="per_item">بر اساس تعداد آیتم</Option>
              <Option value="weight_based">بر اساس وزن</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="cost"
            label="هزینه (تومان)"
            rules={[{ required: true, message: 'هزینه را وارد کنید' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="وضعیت"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ShippingPage

