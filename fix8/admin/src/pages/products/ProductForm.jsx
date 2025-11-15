import { useEffect, useState } from 'react'
import {
  Card,
  Form,
  Input,
  InputNumber,
  TreeSelect,
  Button,
  Upload,
  Tabs,
  message,
  Spin,
} from 'antd'
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

  // Category store (Zustand)
  const { categoriesTree, loading: categoriesLoading } = useCategoryStore(
    (state) => ({
      categoriesTree: state.categoriesTree,
      loading: state.loading,
    }),
  )

  // Helper: map product.images from API to AntD Upload fileList
  const toFileList = (images) => {
    if (!Array.isArray(images)) return []
    return images
      .map((img, index) => {
        const url = typeof img === 'string' ? img : img?.url
        if (!url) return null
        return {
          uid: String(index),
          name: `image-${index + 1}`,
          status: 'done',
          url,
        }
      })
      .filter(Boolean)
  }

  // Load product for edit mode
  useEffect(() => {
    if (!isEdit) return
    ;(async () => {
      setLoading(true)
      try {
        const res = await api.get(`/products/${id}`)
        const p = res?.data?.data
        if (p) {
          form.setFieldsValue({
            name: p.name,
            sku: p.sku,
            price: p.price,
            stock: p.stock,
            category: p.category,
            description: p.description,
          })
          setFiles(toFileList(p.images))
        }
      } catch (err) {
        message.error(
          err?.message || 'خطا در دریافت اطلاعات محصول از سرور',
        )
      } finally {
        setLoading(false)
      }
    })()
  }, [id, isEdit, form])

  const handleFinish = async (values) => {
    setLoading(true)
    try {
      if (!isEdit) {
        // 1) ایجاد محصول با بدنه JSON
        const res = await api.post('/v1/admin/products', values)
        message.success('محصول با موفقیت ایجاد شد')
        const newId = res?.data?.data?._id

        // 2) در صورت انتخاب تصویر، آپلود آن از طریق Cloudinary
        if (newId && files.length > 0) {
          const fd = new FormData()
          files.forEach((f) => {
            if (f.originFileObj) {
              fd.append('images', f.originFileObj)
            }
          })
          if ([...fd.keys()].length > 0) {
            await api.post(`/products/${newId}/images`, fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
          }
        }

        navigate(newId ? `/products/edit/${newId}` : '/products')
      } else {
        // ویرایش اطلاعات متنی
        await api.put(`/products/${id}`, {
          ...values,
          removeAllImages: files.length === 0,
        })

        // در صورت انتخاب عکس‌های جدید، آن‌ها را آپلود کن
        if (files.length > 0) {
          const fd = new FormData()
          files.forEach((f) => {
            if (f.originFileObj) {
              fd.append('images', f.originFileObj)
            }
          })
          if ([...fd.keys()].length > 0) {
            await api.post(`/products/${id}/images`, fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
          }
        }

        message.success('محصول با موفقیت به‌روزرسانی شد')
      }
    } catch (err) {
      message.error(err?.message || 'خطا در ذخیره‌سازی اطلاعات محصول')
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
                    <Form.Item
                      name="name"
                      label="نام محصول"
                      rules={[
                        {
                          required: true,
                          message: 'وارد کردن نام محصول الزامی است',
                        },
                      ]}
                    >
                      <Input placeholder="مثلاً: دوربین مداربسته 4 مگاپیکسل" />
                    </Form.Item>

                    <Form.Item
                      name="sku"
                      label="کد محصول (SKU)"
                      rules={[
                        {
                          required: true,
                          message: 'وارد کردن SKU الزامی است',
                        },
                      ]}
                    >
                      <Input placeholder="مثلاً: PROD-001" />
                    </Form.Item>

                    <Form.Item
                      name="category"
                      label="دسته‌بندی محصول"
                      rules={[
                        {
                          required: true,
                          message: 'انتخاب دسته‌بندی محصول الزامی است',
                        },
                      ]}
                      help={
                        categoriesTree.length === 0
                          ? 'هنوز هیچ دسته‌بندی‌ای بارگذاری نشده است. ابتدا دسته‌بندی‌ها را بسازید.'
                          : null
                      }
                    >
                      {categoriesLoading && categoriesTree.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center' }}>
                          <Spin tip="در حال دریافت دسته‌بندی‌ها..." />
                        </div>
                      ) : (
                        <TreeSelect
                          treeData={categoriesTree}
                          placeholder="انتخاب دسته‌بندی..."
                          allowClear
                          showSearch
                          treeDefaultExpandAll
                          filterTreeNode={(input, node) =>
                            node.title
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                          disabled={categoriesTree.length === 0}
                        />
                      )}
                    </Form.Item>

                    <Form.Item
                      name="price"
                      label="قیمت (تومان)"
                      rules={[
                        {
                          required: true,
                          message: 'وارد کردن قیمت الزامی است',
                        },
                      ]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        step={10000}
                        formatter={(value) =>
                          `${value}`.replace(
                            /\B(?=(\d{3})+(?!\d))/g,
                            ',',
                          )
                        }
                        parser={(value) =>
                          value.replace(/\$\s?|(,*)/g, '')
                        }
                      />
                    </Form.Item>

                    <Form.Item
                      name="stock"
                      label="موجودی"
                      rules={[
                        {
                          required: true,
                          message: 'وارد کردن موجودی الزامی است',
                        },
                      ]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        step={1}
                      />
                    </Form.Item>

                    <Form.Item name="description" label="توضیحات">
                      <Input.TextArea
                        rows={5}
                        placeholder="توضیحات کامل محصول را وارد کنید..."
                      />
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
                        تصاویر را بکشید و رها کنید یا برای انتخاب کلیک کنید.
                      </p>
                      <p className="ant-upload-hint">
                        تصاویر انتخاب‌شده بعد از ذخیره‌سازی، روی Cloudinary آپلود
                        شده و در لیست محصولات نمایش داده می‌شوند.
                      </p>
                    </Upload.Dragger>
                  </>
                ),
              },
            ]}
          />

          <Form.Item style={{ marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
            >
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
