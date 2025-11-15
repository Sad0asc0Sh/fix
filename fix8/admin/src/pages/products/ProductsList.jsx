import { useEffect, useMemo, useState } from 'react'
import { Table, Button, Input, Select, Space, Switch, Tag, Image, Modal, message } from 'antd'
import { PlusOutlined, SearchOutlined, ExportOutlined, ImportOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import api from '../../api'

function ProductsList() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [filters, setFilters] = useState({ search: '', category: null, status: null })
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [categories, setCategories] = useState([])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.get('/categories', { params: { limit: 1000, fields: 'name,slug,_id' } })
        setCategories(res?.data?.data || [])
      } catch (_) {}
    })()
  }, [])

  const categoryOptions = useMemo(() => categories.map((c) => ({ text: c.name, value: c._id })), [categories])

  const fetchProducts = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(pageSize))
      params.set('sort', '-createdAt')
      params.set('fields', 'name,sku,price,stock,isActive,images,_id,category')
      if (filters.search) params.set('search', filters.search)
      if (filters.category) params.set('category[eq]', filters.category)
      if (filters.status) {
        if (filters.status === 'active') {
          params.set('isActive[eq]', 'true')
        } else if (filters.status === 'inactive') {
          params.set('includeInactive', 'true')
          params.set('isActive[eq]', 'false')
        }
      }

      const res = await api.get('/products', { params })
      const list = res?.data?.data || []
      const pg = res?.data?.pagination
      setProducts(list)
      if (pg) {
        setPagination({
          current: pg.currentPage || page,
          pageSize: pg.itemsPerPage || pageSize,
          total: pg.totalItems || list.length,
        })
      }
    } catch (err) {
      message.error(err?.message || 'خطا در دریافت محصولات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts(1, pagination.pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.status])

  const handleBulkDelete = () => {
    Modal.confirm({
      title: 'حذف گروهی محصولات',
      content: `آیا از حذف ${selectedRowKeys.length} محصول انتخاب‌شده اطمینان دارید؟`,
      okText: 'حذف موارد انتخاب‌شده',
      cancelText: 'انصراف',
      okType: 'danger',
      onOk: async () => {
        try {
          await Promise.all(selectedRowKeys.map((id) => api.delete(`/products/${id}`)))
          setSelectedRowKeys([])
          fetchProducts()
          message.success('محصولات انتخاب‌شده حذف شدند')
        } catch (err) {
          message.error(err?.message || 'حذف انجام نشد')
        }
      },
    })
  }

  const handleStatusToggle = async (record) => {
    const nextActive = !record.isActive
    try {
      await api.put(`/products/${record._id}`, { isActive: nextActive })
      setProducts((prev) => prev.map((p) => (p._id === record._id ? { ...p, isActive: nextActive } : p)))
      message.success('وضعیت محصول به‌روزرسانی شد')
    } catch (err) {
      message.error(err?.message || 'خطا در تغییر وضعیت')
    }
  }

  const columns = [
    {
      title: 'تصویر',
      dataIndex: 'images',
      key: 'image',
      render: (images) => {
        let url = null

        if (Array.isArray(images) && images.length > 0) {
          const first = images[0]
          url = typeof first === 'string' ? first : first?.url
        } else if (typeof images === 'string') {
          url = images
        } else if (images && typeof images === 'object' && images.url) {
          url = images.url
        }

        return url ? (
          <Image src={url} width={50} height={50} style={{ borderRadius: 4 }} />
        ) : null
      },
    },
    {
      title: 'نام محصول',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: 'دسته‌بندی',
      dataIndex: 'category',
      key: 'category',
      render: (category) => categories.find((c) => c._id === category)?.name || '-',
      filters: categoryOptions,
    },
    {
      title: 'قیمت',
      dataIndex: 'price',
      key: 'price',
      render: (price) => new Intl.NumberFormat('fa-IR').format(price) + ' تومان',
    },
    {
      title: 'موجودی',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock) => <Tag color={stock > 10 ? 'green' : stock > 0 ? 'orange' : 'red'}>{stock} عدد</Tag>,
    },
    {
      title: 'وضعیت',
      dataIndex: 'isActive',
      key: 'status',
      render: (status, record) => (
        <Switch checked={!!status} onChange={() => handleStatusToggle(record)} checkedChildren="فعال" unCheckedChildren="غیرفعال" />
      ),
    },
    {
      title: 'عملیات',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Link to={`/products/edit/${record._id}`}>
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
                onOk: async () => {
                  try {
                    await api.delete(`/products/${record._id}`)
                    message.success('محصول حذف شد')
                    fetchProducts()
                  } catch (err) {
                    message.error(err?.message || 'حذف انجام نشد')
                  }
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

  const onTableChange = (pag) => {
    setPagination((prev) => ({ ...prev, current: pag.current, pageSize: pag.pageSize }))
    fetchProducts(pag.current, pag.pageSize)
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>لیست محصولات</h1>
        <Space>
          <Button icon={<ImportOutlined />}>درون‌ریزی CSV</Button>
          <Button icon={<ExportOutlined />}>برون‌ریزی Excel</Button>
          <Link to="/products/new">
            <Button type="primary" icon={<PlusOutlined />}>محصول جدید</Button>
          </Link>
        </Space>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Input
          placeholder="جستجو نام یا SKU..."
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          allowClear
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          onPressEnter={() => fetchProducts(1, pagination.pageSize)}
          onBlur={() => fetchProducts(1, pagination.pageSize)}
        />
        <Select
          placeholder="دسته‌بندی"
          style={{ width: 200 }}
          allowClear
          onChange={(value) => setFilters({ ...filters, category: value })}
        >
          {categories.map((c) => (
            <Select.Option key={c._id} value={c._id}>{c.name}</Select.Option>
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

      {selectedRowKeys.length > 0 && (
        <div style={{ marginBottom: 16, padding: 16, background: '#e6f7ff', borderRadius: 8 }}>
          <Space>
            <span>{selectedRowKeys.length} مورد انتخاب شده</span>
            <Button size="small" danger onClick={handleBulkDelete}>حذف</Button>
          </Space>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={products}
        loading={loading}
        rowKey="_id"
        rowSelection={rowSelection}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `${total} محصول`,
        }}
        onChange={onTableChange}
      />
    </div>
  )
}

export default ProductsList
