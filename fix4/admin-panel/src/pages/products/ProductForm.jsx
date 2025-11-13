import { useEffect, useState } from 'react'
import { Card, Form, Input, InputNumber, Select, Button, Upload, Tabs, message } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api'

function ProductForm() {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [files, setFiles] = useState([])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.get('/categories', { params: { limit: 1000, fields: 'name,_id' } })
        setCategories(res?.data?.data || [])
      } catch (_) {}
    })()
  }, [])

  useEffect(() => {
    if (!isEdit) return
    ;(async () => {
      setLoading(true)
      try {
        const res = await api.get(`/products/${id}`)
        const p = res?.data?.data
        if (p) form.setFieldsValue({
          name: p.name,
          sku: p.sku,
          price: p.price,
          stock: p.stock,
          category: p.category,
          description: p.description,
        })
      } catch (err) {
        message.error(err?.message || 'خطا در دریافت محصول')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, isEdit, form])

  const handleFinish = async (values) => {
    setLoading(true)
    try {
      if (!isEdit) {
        const fd = new FormData()
        Object.entries(values).forEach(([k, v]) => {
          if (v !== undefined && v !== null) fd.append(k, v)
        })
        files.forEach((f) => fd.append('images', f.originFileObj))
        const res = await api.post('/v1/admin/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        message.success('محصول ایجاد شد')
        const newId = res?.data?.data?._id
        navigate(newId ? `/products/edit/${newId}` : '/products')
      } else {
        await api.put(`/products/${id}`, values)
        if (files.length > 0) {
          const fd = new FormData()
          files.forEach((f) => fd.append('images', f.originFileObj))
          await api.post(`/products/${id}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        }
        message.success('محصول به‌روزرسانی شد')
      }
    } catch (err) {
      message.error(err?.message || 'ذخیره انجام نشد')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>{isEdit ? 'ویرایش محصول' : 'ایجاد محصول'}</h1>
      <Card loading={loading}>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Tabs
            defaultActiveKey="basic"
            items={[
              {
                key: 'basic',
                label: 'اطلاعات پایه',
                children: (
                  <>
                    <Form.Item name="name" label="نام" rules={[{ required: true, message: 'نام را وارد کنید' }]}>
                      <Input placeholder="نام محصول" />
                    </Form.Item>
                    <Form.Item name="sku" label="SKU" rules={[{ required: true, message: 'SKU را وارد کنید' }]}>
                      <Input placeholder="SKU" />
                    </Form.Item>
                    <Form.Item name="category" label="دسته‌بندی" rules={[{ required: true, message: 'دسته‌بندی را انتخاب کنید' }]}>
                      <Select placeholder="انتخاب دسته">
                        {categories.map((c) => (
                          <Select.Option key={c._id} value={c._id}>{c.name}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item name="price" label="قیمت" rules={[{ required: true, message: 'قیمت را وارد کنید' }]}>
                      <InputNumber style={{ width: '100%' }} min={0} step={1000} />
                    </Form.Item>
                    <Form.Item name="stock" label="موجودی" rules={[{ required: true, message: 'موجودی را وارد کنید' }]}>
                      <InputNumber style={{ width: '100%' }} min={0} step={1} />
                    </Form.Item>
                    <Form.Item name="description" label="توضیحات">
                      <Input.TextArea rows={5} placeholder="توضیحات محصول" />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: 'images',
                label: 'تصاویر',
                children: (
                  <>
                    <Upload.Dragger
                      multiple
                      beforeUpload={() => false}
                      fileList={files}
                      onChange={({ fileList }) => setFiles(fileList)}
                    >
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                      </p>
                      <p className="ant-upload-text">تصاویر را اینجا بکشید و رها کنید یا کلیک کنید</p>
                    </Upload.Dragger>
                  </>
                ),
              },
            ]}
          />

          <Form.Item style={{ marginTop: 16 }}>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEdit ? 'ذخیره تغییرات' : 'ایجاد محصول'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default ProductForm

