import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Tabs,
  Table,
  Tag,
  message,
  Form,
  Input,
  Switch,
  Button,
  Space,
  Select,
  Divider,
} from 'antd'
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import jalaliday from 'jalaliday'
import api from '../../api'
import { useAuthStore } from '../../stores'

dayjs.extend(jalaliday)
dayjs.calendar('jalali')

const formatPersianDate = (date, includeTime = false) => {
  if (!date) return '-'
  const jalaliDate = dayjs(date).calendar('jalali').locale('fa')
  const year = jalaliDate.format('YYYY')
  const month = jalaliDate.format('MM')
  const day = jalaliDate.format('DD')

  if (includeTime) {
    const time = jalaliDate.format('HH:mm')
    return `${year}/${month}/${day} - ${time}`
  }
  return `${year}/${month}/${day}`
}

const ROLE_ORDER = ['user', 'manager', 'admin', 'superadmin']
const ROLE_LABELS = {
  user: 'کاربر',
  manager: 'مدیر',
  admin: 'ادمین',
  superadmin: 'سوپر ادمین',
}

function CustomerProfile() {
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [form] = Form.useForm()

  const currentRole = useAuthStore((state) => state.user?.role || 'user')
  const selectableRoles =
    currentRole === 'superadmin' ? ROLE_ORDER : ['user']

  const fetchUser = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/users/admin/${id}`)
      const userData = res?.data?.data
      setUser(userData)
      form.setFieldsValue({
        name: userData?.name || '',
        email: userData?.email || '',
        phoneNumber: userData?.phoneNumber || '',
        isActive: userData?.isActive ?? true,
        role: userData?.role || 'user',
      })
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'خطا در دریافت اطلاعات کاربر'
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    setOrdersLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('userId', id)
      params.set('limit', '100')

      const res = await api.get('/orders', { params })
      setOrders(res?.data?.data || [])
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'خطا در دریافت سفارش‌ها'
      message.error(errorMsg)
    } finally {
      setOrdersLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
    fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSaveProfile = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)

      await api.put(`/users/admin/${id}`, {
        name: values.name,
        email: values.email,
        phoneNumber: values.phoneNumber,
        isActive: values.isActive,
        role: values.role,
      })

      message.success('اطلاعات کاربر با موفقیت به‌روزرسانی شد.')
      fetchUser()
    } catch (err) {
      if (err?.errorFields) {
        message.error('لطفاً خطاهای فرم را برطرف کنید.')
      } else {
        const errorMsg =
          err?.response?.data?.message ||
          err?.message ||
          'خطا در به‌روزرسانی اطلاعات کاربر'
        message.error(errorMsg)
      }
    } finally {
      setSaving(false)
    }
  }

  const orderColumns = [
    {
      title: 'شماره سفارش',
      key: 'orderId',
      width: 150,
      render: (_, record) => (
        <Link to={`/orders/${record._id}`}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>
            #{record._id?.slice(-8) || '-'}
          </span>
        </Link>
      ),
    },
    {
      title: 'مبلغ کل',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 150,
      render: (price) =>
        `${new Intl.NumberFormat('fa-IR').format(price || 0)} تومان`,
    },
    {
      title: 'وضعیت سفارش',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      width: 140,
      render: (status) => {
        const colors = {
          Pending: 'orange',
          Processing: 'blue',
          Shipped: 'cyan',
          Delivered: 'green',
          Cancelled: 'red',
        }
        return <Tag color={colors[status] || 'default'}>{status}</Tag>
      },
    },
    {
      title: 'وضعیت پرداخت',
      dataIndex: 'isPaid',
      key: 'isPaid',
      width: 130,
      align: 'center',
      render: (isPaid) => (
        <Tag color={isPaid ? 'green' : 'red'}>
          {isPaid ? 'پرداخت شده' : 'پرداخت نشده'}
        </Tag>
      ),
    },
    {
      title: 'تاریخ ثبت',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 200,
      render: (date) => formatPersianDate(date, true),
    },
  ]

  const tabItems = [
    {
      key: 'profile',
      label: 'پروفایل کاربر',
      children: (
        <div style={{ maxWidth: 800 }}>
          {user && (
            <>
              <div style={{ marginBottom: 24 }}>
                <h3>اطلاعات پایه</h3>
                <Descriptions bordered size="small" column={2}>
                  <Descriptions.Item label="شناسه کاربر" span={2}>
                    <span style={{ fontFamily: 'monospace' }}>{user._id}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="تاریخ ایجاد">
                    {formatPersianDate(user.createdAt, true)}
                  </Descriptions.Item>
                  <Descriptions.Item label="آخرین ورود">
                    {formatPersianDate(user.lastLogin, true)}
                  </Descriptions.Item>
                </Descriptions>
              </div>

              <Divider />

              <div>
                <h3>ویرایش اطلاعات</h3>
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                  <Form.Item
                    name="name"
                    label="نام"
                    rules={[
                      { required: true, message: 'لطفاً نام را وارد کنید.' },
                    ]}
                  >
                    <Input placeholder="نام کاربر" size="large" />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="ایمیل"
                    rules={[
                      { required: true, message: 'لطفاً ایمیل را وارد کنید.' },
                      { type: 'email', message: 'ایمیل وارد شده معتبر نیست.' },
                    ]}
                  >
                    <Input placeholder="ایمیل کاربر" size="large" />
                  </Form.Item>

                  <Form.Item
                    name="phoneNumber"
                    label="شماره تماس"
                  >
                    <Input placeholder="شماره تماس" size="large" />
                  </Form.Item>

                  <Form.Item name="role" label="نقش کاربر">
                    <Select size="large">
                      {selectableRoles.map((role) => (
                        <Select.Option key={role} value={role}>
                          {ROLE_LABELS[role] || role}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="isActive"
                    label="وضعیت حساب"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="فعال"
                      unCheckedChildren="غیرفعال"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      size="large"
                      icon={<SaveOutlined />}
                      onClick={handleSaveProfile}
                      loading={saving}
                    >
                      ذخیره تغییرات
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'orders',
      label: 'سفارش‌های کاربر',
      children: (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <h3>لیست سفارش‌ها</h3>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchOrders}
              loading={ordersLoading}
            >
              بارگذاری مجدد
            </Button>
          </div>
          <Table
            columns={orderColumns}
            dataSource={orders}
            loading={ordersLoading}
            rowKey="_id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
            }}
          />
        </div>
      ),
    },
  ]

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
        <h1>پروفایل مشتری</h1>
        <Space>
          <Link to="/customers">
            <Button>بازگشت به لیست مشتریان</Button>
          </Link>
        </Space>
      </div>

      <Card loading={loading}>
        {user && (
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>{user.name}</h2>
            <p style={{ color: '#666', margin: '4px 0 0 0' }}>{user.email}</p>
          </div>
        )}
        <Tabs items={tabItems} />
      </Card>
    </div>
  )
}

export default CustomerProfile
