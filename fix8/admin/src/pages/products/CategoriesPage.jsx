import { useEffect, useState } from 'react'
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
  Popconfirm,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { useCategoryStore } from '../../stores'
import api from '../../api'

function CategoriesPage() {
  // Zustand Store - Single Source of Truth
  const { categoriesTree, loading, fetchCategoriesTree } = useCategoryStore(
    (state) => ({
      categoriesTree: state.categoriesTree,
      loading: state.loading,
      fetchCategoriesTree: state.fetchCategoriesTree,
    }),
  )

  // Local State
  const [modalVisible, setModalVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [form] = Form.useForm()

  // Initial load
  useEffect(() => {
    if (!categoriesTree || categoriesTree.length === 0) {
      fetchCategoriesTree()
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
      if (values.parent) {
        formData.append('parent', values.parent)
      }
      if (values.description) {
        formData.append('description', values.description)
      }
      if (values.isFeatured) {
        formData.append('isFeatured', values.isFeatured)
      }

      const hadIconBefore = Boolean(editingCategory?.iconUrl)
      const hadImageBefore = Boolean(editingCategory?.imageUrl)

      const pickNewFile = (files) => {
        if (!Array.isArray(files)) return null
        return files.find((f) => f.originFileObj) || null
      }

      const iconFile = pickNewFile(values.icon)
      if (iconFile) {
        formData.append('icon', iconFile.originFileObj)
      } else if (hadIconBefore && (!values.icon || values.icon.length === 0)) {
        // Explicitly request icon removal when user cleared existing icon
        formData.append('removeIcon', 'true')
      }

      const imageFile = pickNewFile(values.image)
      if (imageFile) {
        formData.append('image', imageFile.originFileObj)
      } else if (hadImageBefore && (!values.image || values.image.length === 0)) {
        // Explicitly request image removal when user cleared existing image
        formData.append('removeImage', 'true')
      }

      if (editingCategory && editingCategory._id) {
        await api.put(`/categories/${editingCategory._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        message.success('دسته‌بندی با موفقیت ویرایش شد')
      } else {
        await api.post('/categories', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        message.success('دسته‌بندی با موفقیت ایجاد شد')
      }

      await fetchCategoriesTree()
      setModalVisible(false)
      setEditingCategory(null)
      form.resetFields()
    } catch (error) {
      if (error?.errorFields) return
      message.error(
        error?.message || 'خطا در ذخیره‌سازی اطلاعات دسته‌بندی',
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Open Modal for Create
  const handleCreate = () => {
    setEditingCategory(null)
    form.resetFields()
    setModalVisible(true)
  }

  // Open Modal for Edit
  const handleEdit = (category) => {
    const node = {
      ...category,
      _id: category._id || category.key,
    }
    setEditingCategory(node)
    form.setFieldsValue({
      name: node.title,
      parent: node.parent || null,
      description: node.description || '',
      isFeatured: node.isFeatured || false,
      icon: node.iconUrl
        ? [
            {
              uid: '-1',
              name: 'icon',
              status: 'done',
              url: node.iconUrl,
            },
          ]
        : [],
      image: node.imageUrl
        ? [
            {
              uid: '-1',
              name: 'image',
              status: 'done',
              url: node.imageUrl,
            },
          ]
        : [],
    })
    setModalVisible(true)
  }

  // Delete Category
  const handleDelete = async (categoryId) => {
    try {
      await api.delete(`/categories/${categoryId}`)
      message.success('دسته‌بندی با موفقیت حذف شد')
      await fetchCategoriesTree()
    } catch (error) {
      message.error(error?.message || 'خطا در حذف دسته‌بندی')
    }
  }

  // Drag & Drop Handler (change parent)
  const onDrop = async (info) => {
    const dragNodeId = info.dragNode.key
    const dropNodeId = info.node.key
    const dropToGap = info.dropToGap

    try {
      let newParentId = null

      if (!dropToGap) {
        // dropped on node -> make it parent
        newParentId = dropNodeId
      } else if (info.node.parent) {
        // dropped between nodes -> keep same parent as target node
        newParentId = info.node.parent
      }

      await api.put(`/categories/${dragNodeId}`, { parent: newParentId })
      message.success('ساختار دسته‌بندی با موفقیت به‌روزرسانی شد')
      await fetchCategoriesTree()
    } catch (error) {
      message.error(error?.message || 'خطا در جابجایی دسته‌بندی')
    }
  }

  // Render Tree with Actions and icon preview
  const renderTreeNodes = (data) =>
    data.map((item) => ({
      ...item,
      title: (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {item.iconUrl && (
              <img
                src={item.iconUrl}
                alt="icon"
                style={{
                  width: 20,
                  height: 20,
                  objectFit: 'cover',
                  borderRadius: 4,
                }}
              />
            )}
            <span>{item.title}</span>
          </span>
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                handleEdit(item)
              }}
            />
            <Popconfirm
              title="حذف این دسته‌بندی؟"
              onConfirm={(e) => {
                e.stopPropagation()
                handleDelete(item.key)
              }}
              okText="حذف"
              cancelText="انصراف"
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
        <h1>مدیریت دسته‌بندی‌ها</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          افزودن دسته‌بندی جدید
        </Button>
      </div>

      <Card>
        {loading && categoriesTree.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin tip="در حال دریافت دسته‌بندی‌ها..." />
          </div>
        ) : categoriesTree.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 0',
              color: '#999',
            }}
          >
            <p>هنوز هیچ دسته‌بندی‌ای ثبت نشده است.</p>
            <p style={{ fontSize: 12 }}>
              روی «افزودن دسته‌بندی جدید» کلیک کنید تا اولین دسته‌بندی را ایجاد
              کنید.
            </p>
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <h3 style={{ marginBottom: 12 }}>
                ساختار درختی دسته‌بندی‌ها (برای جابجایی، درخت را درگ و دراپ
                کنید):
              </h3>
              <Tree
                treeData={renderTreeNodes(categoriesTree)}
                defaultExpandAll
                showLine
                draggable
                onDrop={onDrop}
                style={{
                  background: '#fafafa',
                  padding: 16,
                  borderRadius: 8,
                }}
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
        title={editingCategory ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}
        okText={editingCategory ? 'ذخیره تغییرات' : 'ایجاد'}
        cancelText="انصراف"
        confirmLoading={submitting}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* 1. Name */}
          <Form.Item
            name="name"
            label="نام دسته‌بندی"
            rules={[
              {
                required: true,
                message: 'وارد کردن نام دسته‌بندی الزامی است',
              },
            ]}
          >
            <Input placeholder="مثلاً: دوربین مداربسته" />
          </Form.Item>

          {/* 2. Parent */}
          <Form.Item
            name="parent"
            label="دسته‌بندی والد (اختیاری)"
            help="در صورت خالی بودن، این دسته در سطح ریشه قرار می‌گیرد."
          >
            <TreeSelect
              treeData={categoriesTree}
              loading={loading}
              placeholder="انتخاب دسته‌بندی والد..."
              allowClear
              showSearch
              treeDefaultExpandAll
              filterTreeNode={(input, node) =>
                node.title.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          {/* 3. Description */}
          <Form.Item name="description" label="توضیحات (اختیاری)">
            <Input.TextArea rows={3} placeholder="توضیحات کوتاه درباره دسته‌بندی" />
          </Form.Item>

          {/* 4. Icon */}
          <Form.Item
            name="icon"
            label="آیکون دسته‌بندی (اختیاری)"
            help="برای نمایش درخت و لیست‌ها، یک آیکون کوچک انتخاب کنید."
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
                آیکون را بکشید و رها کنید یا برای انتخاب کلیک کنید.
              </p>
            </Upload.Dragger>
          </Form.Item>

          {/* 5. Image */}
          <Form.Item
            name="image"
            label="تصویر دسته‌بندی (اختیاری)"
            help="این تصویر می‌تواند در صفحات فروشگاه نمایش داده شود."
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
                تصویر را بکشید و رها کنید یا برای انتخاب کلیک کنید.
              </p>
            </Upload.Dragger>
          </Form.Item>

          {/* 6. Featured */}
          <Form.Item name="isFeatured" valuePropName="checked">
            <Checkbox>نمایش به‌عنوان دسته‌بندی ویژه (Featured)</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CategoriesPage
