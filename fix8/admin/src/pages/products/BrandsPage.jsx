import { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Upload,
  message,
  Space,
  Popconfirm,
  Image,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { useBrandStore } from '../../stores'
import api from '../../api'

function BrandsPage() {
  // Zustand Store - Single Source of Truth
  const { brands, loading, fetchBrands } = useBrandStore((state) => ({
    brands: state.brands,
    loading: state.loading,
    fetchBrands: state.fetchBrands,
  }))

  // Local State
  const [modalVisible, setModalVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingBrand, setEditingBrand] = useState(null)
  const [form] = Form.useForm()

  // Initial load
  useEffect(() => {
    if (!brands || brands.length === 0) {
      fetchBrands()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Normalize Upload event to fileList
  const normFileList = (e) => {
    if (Array.isArray(e)) return e
    return e?.fileList || []
  }

  // Submit handler (create / update)
  const onFinish = async (values) => {
    try {
      setSubmitting(true)

      const formData = new FormData()

      formData.append('name', values.name)
      if (values.description) {
        formData.append('description', values.description)
      }

      const hadLogoBefore = Boolean(editingBrand?.logo?.url)

      const pickNewFile = (files) => {
        if (!Array.isArray(files)) return null
        return files.find((f) => f.originFileObj) || null
      }

      const logoFile = pickNewFile(values.logo)
      if (logoFile) {
        formData.append('logo', logoFile.originFileObj)
      } else if (hadLogoBefore && (!values.logo || values.logo.length === 0)) {
        // Explicitly request logo removal when user cleared existing logo
        formData.append('removeLogo', 'true')
      }

      if (editingBrand && editingBrand._id) {
        await api.put(`/brands/${editingBrand._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        message.success('برند با موفقیت ویرایش شد')
      } else {
        await api.post('/brands', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        message.success('برند با موفقیت ایجاد شد')
      }

      await fetchBrands()
      setModalVisible(false)
      setEditingBrand(null)
      form.resetFields()
    } catch (error) {
      if (error?.errorFields) return
      message.error(error?.message || 'خطا در ذخیره‌سازی اطلاعات برند')
    } finally {
      setSubmitting(false)
    }
  }

  // Open Modal for Create
  const handleCreate = () => {
    setEditingBrand(null)
    form.resetFields()
    setModalVisible(true)
  }

  // Open Modal for Edit
  const handleEdit = (brand) => {
    setEditingBrand(brand)
    form.setFieldsValue({
      name: brand.name,
      description: brand.description || '',
      logo:
        brand.logo && brand.logo.url
          ? [
              {
                uid: '-1',
                name: 'logo',
                status: 'done',
                url: brand.logo.url,
              },
            ]
          : [],
    })
    setModalVisible(true)
  }

  // Delete Brand
  const handleDelete = async (brandId) => {
    try {
      await api.delete(`/brands/${brandId}`)
      message.success('برند با موفقیت حذف شد')
      await fetchBrands()
    } catch (error) {
      message.error(error?.message || 'خطا در حذف برند')
    }
  }

  // Table Columns
  const columns = [
    {
      title: 'لوگو',
      dataIndex: 'logo',
      key: 'logo',
      width: 100,
      render: (logo) => {
        if (logo && logo.url) {
          return (
            <Image
              src={logo.url}
              alt="logo"
              width={50}
              height={50}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              preview={{
                mask: 'مشاهده',
              }}
            />
          )
        }
        return (
          <div
            style={{
              width: 50,
              height: 50,
              background: '#f0f0f0',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#999',
            }}
          >
            بدون لوگو
          </div>
        )
      },
    },
    {
      title: 'نام برند',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'توضیحات',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => text || <span style={{ color: '#999' }}>—</span>,
    },
    {
      title: 'عملیات',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            ویرایش
          </Button>
          <Popconfirm
            title="حذف این برند؟"
            onConfirm={() => handleDelete(record._id)}
            okText="حذف"
            cancelText="انصراف"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />}>
              حذف
            </Button>
          </Popconfirm>
        </Space>
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
        <h1>مدیریت برندها</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          افزودن برند جدید
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={brands}
          loading={loading}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `مجموع: ${total} برند`,
          }}
          locale={{
            emptyText: (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: '#999',
                }}
              >
                <p>هنوز هیچ برندی ثبت نشده است.</p>
                <p style={{ fontSize: 12 }}>
                  روی «افزودن برند جدید» کلیک کنید تا اولین برند را ایجاد کنید.
                </p>
              </div>
            ),
          }}
        />
      </Card>

      {/* Modal: Create/Edit Brand */}
      <Modal
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingBrand(null)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        title={editingBrand ? 'ویرایش برند' : 'برند جدید'}
        okText={editingBrand ? 'ذخیره تغییرات' : 'ایجاد'}
        cancelText="انصراف"
        confirmLoading={submitting}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* 1. Name */}
          <Form.Item
            name="name"
            label="نام برند"
            rules={[
              {
                required: true,
                message: 'وارد کردن نام برند الزامی است',
              },
            ]}
          >
            <Input placeholder="مثلاً: Samsung" />
          </Form.Item>

          {/* 2. Description */}
          <Form.Item name="description" label="توضیحات (اختیاری)">
            <Input.TextArea rows={3} placeholder="توضیحات کوتاه درباره برند" />
          </Form.Item>

          {/* 3. Logo */}
          <Form.Item
            name="logo"
            label="لوگوی برند (اختیاری)"
            help="یک لوگو برای نمایش در لیست محصولات انتخاب کنید."
            valuePropName="fileList"
            getValueFromEvent={normFileList}
          >
            <Upload.Dragger
              maxCount={1}
              accept="image/*"
              beforeUpload={() => false}
              listType="picture"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                لوگو را بکشید و رها کنید یا برای انتخاب کلیک کنید.
              </p>
              <p className="ant-upload-hint">
                فایل انتخاب‌شده بعد از ذخیره‌سازی، روی Cloudinary آپلود می‌شود.
              </p>
            </Upload.Dragger>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default BrandsPage
