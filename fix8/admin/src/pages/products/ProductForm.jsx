import { useEffect, useState } from 'react'
import { Card, Form, Input, InputNumber, TreeSelect, Button, Upload, Tabs, message, Spin } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { useCategoryStore } from '../../stores'
import api from '../../api'

function ProductForm() {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState([])

  // ============================================
  // استفاده از Zustand Store برای دسته‌بندی‌ها
  // ============================================
  const { categoriesTree, loading: categoriesLoading } = useCategoryStore((state) => ({
    categoriesTree: state.categoriesTree,
    loading: state.loading,
  }))

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
        message.success('محصول با موفقیت ایجاد شد')
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
      message.error(err?.message || 'خطا در ذخیره محصول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>{isEdit ? 'ویرایش محصول' : 'ایجاد محصول جدید'}</h1>
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
                    <Form.Item name="name" label="نام محصول" rules={[{ required: true, message: 'نام محصول را وارد کنید' }]}>
                      <Input placeholder="مثال: گوشی سامسونگ Galaxy S23" />
                    </Form.Item>
                    
                    <Form.Item name="sku" label="کد محصول (SKU)" rules={[{ required: true, message: 'کد محصول را وارد کنید' }]}>
                      <Input placeholder="مثال: PROD-001" />
                    </Form.Item>
                    
                    <Form.Item 
                      name="category" 
                      label="دسته‌بندی" 
                      rules={[{ required: true, message: 'لطفاً دسته‌بندی را انتخاب کنید' }]}
                      help={categoriesTree.length === 0 ? "هیچ دسته‌بندی موجود نیست. لطفاً ابتدا از منوی دسته‌بندی‌ها، یک دسته ایجاد کنید." : null}
                    >
                      {categoriesLoading && categoriesTree.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center' }}>
                          <Spin tip="در حال بارگذاری دسته‌بندی‌ها..." />
                        </div>
                      ) : (
                        <TreeSelect
                          treeData={categoriesTree}
                          placeholder="یک دسته‌بندی انتخاب کنید..."
                          allowClear
                          showSearch
                          treeDefaultExpandAll
                          filterTreeNode={(input, node) => 
                            node.title.toLowerCase().includes(input.toLowerCase())
                          }
                          disabled={categoriesTree.length === 0}
                        />
                      )}
                    </Form.Item>
                    
                    <Form.Item name="price" label="قیمت (تومان)" rules={[{ required: true, message: 'قیمت را وارد کنید' }]}>
                      <InputNumber 
                        style={{ width: '100%' }} 
                        min={0} 
                        step={10000}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      />
                    </Form.Item>
                    
                    <Form.Item name="stock" label="موجودی" rules={[{ required: true, message: 'موجودی را وارد کنید' }]}>
                      <InputNumber style={{ width: '100%' }} min={0} step={1} />
                    </Form.Item>
                    
                    <Form.Item name="description" label="توضیحات">
                      <Input.TextArea rows={5} placeholder="توضیحات کامل محصول را وارد کنید..." />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: 'images',
                label: 'تصاویر محصول',
                children: (
                  <>
                    <Upload.Dragger
                      multiple
                      beforeUpload={() => false}
                      fileList={files}
                      onChange={({ fileList }) => setFiles(fileList)}
                      listType="picture"
                    >
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                      </p>
                      <p className="ant-upload-text">
                        تصاویر را اینجا بکشید و رها کنید یا کلیک کنید
                      </p>
                      <p className="ant-upload-hint">
                        می‌توانید چندین تصویر را همزمان انتخاب کنید
                      </p>
                    </Upload.Dragger>
                  </>
                ),
              },
            ]}
          />

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" loading={loading} size="large">
              {isEdit ? 'ذخیره تغییرات' : 'ایجاد محصول'}
            </Button>
            <Button 
              style={{ marginRight: 8 }} 
              onClick={() => navigate('/products')}
              disabled={loading}
            >
              انصراف
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default ProductForm

