import { useState } from 'react'
import { 
  Card, 
  Tree, 
  TreeSelect, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Upload, 
  Checkbox,
  message, 
  Space, 
  Spin,
  Popconfirm 
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  InboxOutlined 
} from '@ant-design/icons'
import { useCategoryStore } from '../../stores'
import api from '../../api'

function CategoriesPage() {
  // ============================================
  // Zustand Store - Single Source of Truth
  // ============================================
  const { categoriesTree, loading, fetchCategoriesTree } = useCategoryStore((state) => ({
    categoriesTree: state.categoriesTree,
    loading: state.loading,
    fetchCategoriesTree: state.fetchCategoriesTree,
  }))

  // ============================================
  // Local State
  // ============================================
  const [modalVisible, setModalVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [form] = Form.useForm()

  // ============================================
  // Form Submit Handler (تست ۲ و ۳)
  // ============================================
  const onFinish = async (values) => {
    try {
      setSubmitting(true)

      // ساخت FormData برای ارسال فایل‌ها
      const formData = new FormData()
      
      // فیلدهای متنی
      formData.append('name', values.name)
      if (values.parent) {
        formData.append('parent', values.parent)
      }
      if (values.description) {
        formData.append('description', values.description)
      }
      if (values.isFeatured) {
        formData.append('isFeatured', values.isFeatured)
      }

      // فایل آیکون (اگر آپلود شده باشد)
      if (values.icon && values.icon.fileList && values.icon.fileList[0]?.originFileObj) {
        formData.append('icon', values.icon.fileList[0].originFileObj)
      }

      // فایل تصویر (اگر آپلود شده باشد)
      if (values.image && values.image.fileList && values.image.fileList[0]?.originFileObj) {
        formData.append('image', values.image.fileList[0].originFileObj)
      }

      // ارسال به API
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        message.success('دسته‌بندی با موفقیت ویرایش شد')
      } else {
        await api.post('/categories', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        message.success('دسته‌بندی با موفقیت ایجاد شد')
      }

      // *** اجباری: رفرش انبار سراسری ***
      await fetchCategoriesTree()

      // بستن Modal و ریست فرم
      setModalVisible(false)
      setEditingCategory(null)
      form.resetFields()

    } catch (error) {
      if (error?.errorFields) return // خطای Validation
      message.error(error?.message || 'خطا در ذخیره دسته‌بندی')
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================
  // Open Modal for Create
  // ============================================
  const handleCreate = () => {
    setEditingCategory(null)
    form.resetFields()
    setModalVisible(true)
  }

  // ============================================
  // Open Modal for Edit
  // ============================================
  const handleEdit = (category) => {
    setEditingCategory(category)
    form.setFieldsValue({
      name: category.title,
      parent: category.parent,
      description: category.description,
      isFeatured: category.isFeatured || false,
      // فایل‌ها را نمی‌توان در فرم پیش‌پر کرد
    })
    setModalVisible(true)
  }

  // ============================================
  // Delete Category
  // ============================================
  const handleDelete = async (categoryId) => {
    try {
      await api.delete(`/categories/${categoryId}`)
      message.success('دسته‌بندی حذف شد')
      
      // *** اجباری: رفرش انبار سراسری ***
      await fetchCategoriesTree()
    } catch (error) {
      message.error(error?.message || 'خطا در حذف دسته‌بندی')
    }
  }

  // ============================================
  // Drag & Drop Handler (تست ۴)
  // ============================================
  const onDrop = async (info) => {
    const dragNodeId = info.dragNode.key
    const dropNodeId = info.node.key
    const dropToGap = info.dropToGap

    try {
      let newParentId = null
      
      if (!dropToGap) {
        // جابجایی به داخل نود (به عنوان child)
        newParentId = dropNodeId
      } else {
        // جابجایی در کنار نود (هم‌سطح)
        // در این حالت، والد نود مقصد را می‌گیریم
        // برای سادگی، می‌توانیم از parent فعلی نود مقصد استفاده کنیم
        // یا null (برای ریشه)
        newParentId = info.node.parent || null
      }

      // ارسال به API
      await api.put(`/categories/${dragNodeId}`, { parent: newParentId })
      message.success('دسته‌بندی جابجا شد')

      // *** اجباری: رفرش انبار سراسری ***
      await fetchCategoriesTree()

    } catch (error) {
      message.error(error?.message || 'خطا در جابجایی دسته‌بندی')
    }
  }

  // ============================================
  // Render Tree with Actions
  // ============================================
  const renderTreeNodes = (data) => {
    return data.map((item) => ({
      ...item,
      title: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{item.title}</span>
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                handleEdit({ _id: item.key, title: item.title })
              }}
            />
            <Popconfirm
              title="آیا از حذف این دسته‌بندی مطمئن هستید؟"
              onConfirm={(e) => {
                e.stopPropagation()
                handleDelete(item.key)
              }}
              okText="بله"
              cancelText="خیر"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </Space>
        </div>
      ),
      children: item.children ? renderTreeNodes(item.children) : undefined,
    }))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>مدیریت دسته‌بندی‌ها</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          افزودن دسته‌بندی جدید
        </Button>
      </div>

      <Card>
        {loading && categoriesTree.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin tip="در حال بارگذاری دسته‌بندی‌ها..." />
          </div>
        ) : categoriesTree.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <p>هیچ دسته‌بندی موجود نیست</p>
            <p style={{ fontSize: 12 }}>برای شروع، یک دسته‌بندی اصلی ایجاد کنید</p>
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <h3 style={{ marginBottom: 12 }}>
                درخت دسته‌بندی‌ها (می‌توانید با کشیدن، دسته‌ها را جابجا کنید):
              </h3>
              <Tree
                treeData={renderTreeNodes(categoriesTree)}
                defaultExpandAll
                showLine
                draggable
                onDrop={onDrop}
                style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}
              />
            </div>
          </Space>
        )}
      </Card>

      {/* Modal: Create/Edit Category */}
      <Modal
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingCategory(null)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        title={editingCategory ? 'ویرایش دسته‌بندی' : 'ایجاد دسته‌بندی جدید'}
        okText={editingCategory ? 'ذخیره' : 'ایجاد'}
        cancelText="انصراف"
        confirmLoading={submitting}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* 1. نام */}
          <Form.Item
            name="name"
            label="نام دسته‌بندی"
            rules={[{ required: true, message: 'لطفاً نام دسته‌بندی را وارد کنید' }]}
          >
            <Input placeholder="مثال: الکترونیک، پوشاک، کتاب، ..." />
          </Form.Item>

          {/* 2. والد (TreeSelect) */}
          <Form.Item
            name="parent"
            label="دسته‌بندی والد (اختیاری)"
            help="برای ایجاد یک دسته اصلی (ریشه)، این فیلد را خالی بگذارید."
          >
            <TreeSelect
              treeData={categoriesTree}
              loading={loading}
              placeholder="برای انتخاب دسته والد کلیک کنید"
              allowClear={true}
              showSearch={true}
              treeDefaultExpandAll={true}
              filterTreeNode={(input, node) =>
                node.title.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          {/* 3. توضیحات */}
          <Form.Item name="description" label="توضیحات (اختیاری)">
            <Input.TextArea
              rows={3}
              placeholder="توضیحات کوتاهی درباره این دسته‌بندی..."
            />
          </Form.Item>

          {/* 4. آیکون */}
          <Form.Item
            name="icon"
            label="آیکون دسته‌بندی (اختیاری)"
            help="یک تصویر کوچک برای آیکون (مثلاً 64x64 پیکسل)"
            valuePropName="file"
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
                آیکون را اینجا بکشید یا کلیک کنید
              </p>
            </Upload.Dragger>
          </Form.Item>

          {/* 5. تصویر */}
          <Form.Item
            name="image"
            label="تصویر دسته‌بندی (اختیاری)"
            help="یک تصویر بزرگتر برای نمایش در صفحه دسته‌بندی"
            valuePropName="file"
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
                تصویر را اینجا بکشید یا کلیک کنید
              </p>
            </Upload.Dragger>
          </Form.Item>

          {/* 6. ویژه */}
          <Form.Item name="isFeatured" valuePropName="checked">
            <Checkbox>این دسته‌بندی را به عنوان ویژه (Featured) نشان بده</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CategoriesPage

