import { useEffect, useState } from 'react'
import { Card, Tree, TreeSelect, Button, Modal, Form, Input, message, Space } from 'antd'
import api from '../../api'

function toAntTree(nodes = []) {
  return nodes.map((n) => ({
    title: n.name,
    key: n._id,
    value: n._id,
    children: n.children ? toAntTree(n.children) : [],
  }))
}

function CategoriesPage() {
  const [treeData, setTreeData] = useState([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchTree = async () => {
    setLoading(true)
    try {
      const res = await api.get('/categories/tree')
      setTreeData(toAntTree(res?.data?.data || []))
    } catch (err) {
      message.error(err?.message || 'خطا در دریافت دسته‌بندی‌ها')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTree() }, [])

  const onCreate = async () => {
    try {
      const values = await form.validateFields()
      await api.post('/categories', { name: values.name, parent: values.parent || null })
      message.success('دسته‌بندی ایجاد شد')
      setCreateOpen(false)
      form.resetFields()
      fetchTree()
    } catch (err) {
      if (err?.errorFields) return
      message.error(err?.message || 'ایجاد انجام نشد')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>دسته‌بندی‌ها</h1>
        <Button type="primary" onClick={() => setCreateOpen(true)}>دسته‌بندی جدید</Button>
      </div>
      <Card loading={loading}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Tree treeData={treeData} defaultExpandAll />
          <div>
            <span style={{ marginRight: 8 }}>انتخاب والد:</span>
            <TreeSelect
              style={{ width: 300 }}
              treeData={treeData}
              placeholder="بدون والد"
              allowClear
              onChange={(val) => form.setFieldValue('parent', val)}
            />
          </div>
        </Space>
      </Card>

      <Modal open={createOpen} onCancel={() => setCreateOpen(false)} onOk={onCreate} title="ایجاد دسته‌بندی">
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="نام" rules={[{ required: true, message: 'نام را وارد کنید' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="parent" label="والد">
            <TreeSelect treeData={treeData} allowClear placeholder="بدون والد" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CategoriesPage

