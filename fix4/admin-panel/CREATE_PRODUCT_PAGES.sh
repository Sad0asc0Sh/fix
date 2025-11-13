#!/bin/bash

cd /home/claude/admin-panel

# ===========================================
# صفحات محصولات
# ===========================================

# 1. ProductsList با جدول پیشرفته
cat > src/pages/products/ProductsList.jsx << 'PRODLIST'
import { useState } from 'react'
import { Table, Button, Input, Select, Space, Switch, Tag, Image, Modal, message } from 'antd'
import { 
  PlusOutlined, 
  SearchOutlined, 
  ExportOutlined, 
  ImportOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { mockProducts, mockCategories } from '../../data/mockData'

function ProductsList() {
  const [products, setProducts] = useState(mockProducts)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [filters, setFilters] = useState({
    search: '',
    category: null,
    status: null,
  })

  const handleBulkDelete = () => {
    Modal.confirm({
      title: 'حذف محصولات',
      content: `آیا از حذف ${selectedRowKeys.length} محصول اطمینان دارید؟`,
      okText: 'بله، حذف شود',
      cancelText: 'انصراف',
      okType: 'danger',
      onOk: () => {
        setProducts(products.filter(p => !selectedRowKeys.includes(p.id)))
        setSelectedRowKeys([])
        message.success('محصولات با موفقیت حذف شدند')
      },
    })
  }

  const handleStatusToggle = (id, currentStatus) => {
    setProducts(products.map(p => 
      p.id === id ? { ...p, status: currentStatus === 'active' ? 'inactive' : 'active' } : p
    ))
  }

  const columns = [
    {
      title: 'تصویر',
      dataIndex: 'image',
      key: 'image',
      render: (image) => <Image src={image} width={50} height={50} style={{ borderRadius: 4 }} />,
    },
    {
      title: 'نام محصول',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'کد کالا (SKU)',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: 'دسته‌بندی',
      dataIndex: 'categoryName',
      key: 'category',
      filters: mockCategories.map(c => ({ text: c.name, value: c.id })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: 'قیمت',
      dataIndex: 'price',
      key: 'price',
      render: (price) => new Intl.NumberFormat('fa-IR').format(price) + ' تومان',
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: 'موجودی',
      dataIndex: 'stock',
      key: 'stock',
      sorter: (a, b) => a.stock - b.stock,
      render: (stock) => (
        <Tag color={stock > 10 ? 'green' : stock > 0 ? 'orange' : 'red'}>
          {stock} عدد
        </Tag>
      ),
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Switch 
          checked={status === 'active'} 
          onChange={() => handleStatusToggle(record.id, status)}
          checkedChildren="فعال"
          unCheckedChildren="غیرفعال"
        />
      ),
    },
    {
      title: 'عملیات',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Link to={`/products/edit/${record.id}`}>
            <Button type="primary" size="small" icon={<EditOutlined />}>ویرایش</Button>
          </Link>
          <Button 
            danger 
            size="small" 
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'حذف محصول',
                content: 'آیا از حذف این محصول اطمینان دارید؟',
                okText: 'حذف',
                cancelText: 'انصراف',
                okType: 'danger',
                onOk: () => {
                  setProducts(products.filter(p => p.id !== record.id))
                  message.success('محصول حذف شد')
                },
              })
            }}
          >
            حذف
          </Button>
        </Space>
      ),
    },
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  }

  // فیلتر محصولات
  const filteredProducts = products.filter(p => {
    if (filters.search && !p.name.includes(filters.search) && !p.sku.includes(filters.search)) {
      return false
    }
    if (filters.category && p.category !== filters.category) {
      return false
    }
    if (filters.status && p.status !== filters.status) {
      return false
    }
    return true
  })

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>لیست محصولات</h1>
        <Space>
          <Button icon={<ImportOutlined />}>واردات CSV</Button>
          <Button icon={<ExportOutlined />}>صادرات Excel</Button>
          <Link to="/products/new">
            <Button type="primary" icon={<PlusOutlined />}>افزودن محصول</Button>
          </Link>
        </Space>
      </div>

      {/* فیلترها */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Input
          placeholder="جستجو بر اساس نام یا کد..."
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <Select
          placeholder="دسته‌بندی"
          style={{ width: 200 }}
          allowClear
          onChange={(value) => setFilters({ ...filters, category: value })}
        >
          {mockCategories.map(c => (
            <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
          ))}
        </Select>
        <Select
          placeholder="وضعیت"
          style={{ width: 150 }}
          allowClear
          onChange={(value) => setFilters({ ...filters, status: value })}
        >
          <Select.Option value="active">فعال</Select.Option>
          <Select.Option value="inactive">غیرفعال</Select.Option>
        </Select>
      </div>

      {/* عملیات گروهی */}
      {selectedRowKeys.length > 0 && (
        <div style={{ marginBottom: 16, padding: 16, background: '#e6f7ff', borderRadius: 8 }}>
          <Space>
            <span>{selectedRowKeys.length} مورد انتخاب شده</span>
            <Button size="small" onClick={() => message.info('فعال‌سازی گروهی')}>فعال‌سازی</Button>
            <Button size="small" onClick={() => message.info('غیرفعال‌سازی گروهی')}>غیرفعال‌سازی</Button>
            <Button size="small" danger onClick={handleBulkDelete}>حذف</Button>
            <Button size="small" onClick={() => message.info('تغییر دسته‌بندی')}>تغییر دسته‌بندی</Button>
          </Space>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={filteredProducts}
        rowKey="id"
        rowSelection={rowSelection}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `مجموع ${total} محصول` }}
      />
    </div>
  )
}

export default ProductsList
PRODLIST

echo "✅ ProductsList ایجاد شد"

