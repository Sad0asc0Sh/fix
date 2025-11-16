import { useEffect, useState } from 'react'
import { Card, Form, Input, Tabs, Button, Space, message } from 'antd'
import api from '../../api'

function SettingsPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await api.get('/settings')
      const data = res?.data?.data || {}

      form.setFieldsValue({
        storeName: data.storeName || '',
        storeEmail: data.storeEmail || '',
        storePhone: data.storePhone || '',
        storeAddress: data.storeAddress || '',
        notificationSettings: {
          ...(data.notificationSettings || {}),
          emailFrom:
            (data.notificationSettings && data.notificationSettings.emailFrom) ||
            'noreply@example.com',
        },
      })
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'خطا در دریافت تنظیمات فروشگاه'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      const payload = {
        storeName: values.storeName || '',
        storeEmail: values.storeEmail || '',
        storePhone: values.storePhone || '',
        storeAddress: values.storeAddress || '',
      }

      if (values.notificationSettings) {
        const ns = {}

        if (
          Object.prototype.hasOwnProperty.call(
            values.notificationSettings,
            'emailFrom',
          )
        ) {
          ns.emailFrom = values.notificationSettings.emailFrom
        }

        if (
          values.notificationSettings.smsApiKey !== undefined &&
          values.notificationSettings.smsApiKey !== null &&
          values.notificationSettings.smsApiKey !== ''
        ) {
          ns.smsApiKey = values.notificationSettings.smsApiKey
        }

        if (Object.keys(ns).length > 0) {
          payload.notificationSettings = ns
        }
      }

      if (values.paymentGatewayKeys) {
        const pgk = {}

        if (
          values.paymentGatewayKeys.apiKey !== undefined &&
          values.paymentGatewayKeys.apiKey !== null &&
          values.paymentGatewayKeys.apiKey !== ''
        ) {
          pgk.apiKey = values.paymentGatewayKeys.apiKey
        }

        if (
          values.paymentGatewayKeys.apiSecret !== undefined &&
          values.paymentGatewayKeys.apiSecret !== null &&
          values.paymentGatewayKeys.apiSecret !== ''
        ) {
          pgk.apiSecret = values.paymentGatewayKeys.apiSecret
        }

        if (Object.keys(pgk).length > 0) {
          payload.paymentGatewayKeys = pgk
        }
      }

      setSaving(true)
      await api.put('/settings', payload)
      message.success('تنظیمات با موفقیت ذخیره شد')
      fetchSettings()
    } catch (err) {
      if (err?.errorFields) {
        return
      }

      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'خطا در ذخیره تنظیمات فروشگاه'
      message.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    {
      key: 'general',
      label: 'تنظیمات عمومی',
      children: (
        <>
          <Form.Item
            name="storeName"
            label="نام فروشگاه"
            rules={[
              {
                required: true,
                message: 'لطفاً نام فروشگاه را وارد کنید',
              },
            ]}
          >
            <Input placeholder="مثلاً: فروشگاه من" />
          </Form.Item>

          <Form.Item
            name="storeEmail"
            label="ایمیل فروشگاه"
            rules={[
              {
                type: 'email',
                message: 'ایمیل وارد شده معتبر نیست',
              },
            ]}
          >
            <Input placeholder="info@example.com" />
          </Form.Item>

          <Form.Item name="storePhone" label="شماره تماس فروشگاه">
            <Input placeholder="مثلاً: 0912..." />
          </Form.Item>

          <Form.Item name="storeAddress" label="آدرس فروشگاه">
            <Input.TextArea rows={3} />
          </Form.Item>
        </>
      ),
    },
    {
      key: 'payment',
      label: 'تنظیمات درگاه پرداخت',
      children: (
        <>
          <Form.Item
            name={['paymentGatewayKeys', 'apiKey']}
            label="API Key درگاه پرداخت"
          >
            <Input.Password placeholder="********" />
          </Form.Item>

          <Form.Item
            name={['paymentGatewayKeys', 'apiSecret']}
            label="API Secret درگاه پرداخت"
          >
            <Input.Password placeholder="********" />
          </Form.Item>
        </>
      ),
    },
    {
      key: 'notifications',
      label: 'تنظیمات اعلان‌ها',
      children: (
        <>
          <Form.Item
            name={['notificationSettings', 'smsApiKey']}
            label="SMS API Key"
          >
            <Input placeholder="مثلاً: کلید API سرویس SMS" />
          </Form.Item>

          <Form.Item
            name={['notificationSettings', 'emailFrom']}
            label="ایمیل فرستنده اعلان‌ها"
          >
            <Input placeholder="noreply@example.com" />
          </Form.Item>
        </>
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
        <h1>تنظیمات فروشگاه</h1>
        <Space>
          <Button onClick={fetchSettings} disabled={loading || saving}>
            بارگذاری مجدد تنظیمات
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={saving}
            disabled={loading}
          >
            ذخیره تغییرات
          </Button>
        </Space>
      </div>

      <Card loading={loading}>
        <Form form={form} layout="vertical">
          <Tabs defaultActiveKey="general" items={tabs} />
        </Form>
      </Card>
    </div>
  )
}

export default SettingsPage

