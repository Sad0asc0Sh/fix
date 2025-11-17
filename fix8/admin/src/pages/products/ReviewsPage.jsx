import { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Tag,
  Select,
  Space,
  Button,
  Popconfirm,
  message,
  Switch,
  Rate,
  Typography,
  Form,
  Input,
  Divider,
} from 'antd'
import { ReloadOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import jalaliday from 'jalaliday'
import api from '../../api'

dayjs.extend(jalaliday)
dayjs.calendar('jalali')

const formatPersianDate = (date, includeTime = false) => {
  if (!date) return '-'
  const jalaliDate = dayjs(date).calendar('jalali').locale('fa')
  const year = jalaliDate.format('YYYY')
  const month = jalaliDate.format('MM')
  const day = jalaliDate.format('DD')

  if (includeTime) {
    const time = jalaliDate.format('HH:mm')
    return `${year}/${month}/${day} - ${time}`
  }
  return `${year}/${month}/${day}`
}

function ReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [replyLoading, setReplyLoading] = useState({}) // برای نمایش loading در هر ردیف
  const [replyTexts, setReplyTexts] = useState({}) // برای نگهداری متن پاسخ هر نظر
  const [filters, setFilters] = useState({
    isApproved: null,
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [form] = Form.useForm()

  const fetchReviews = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(pageSize))

      if (filters.isApproved !== null) {
        params.set('isApproved', String(filters.isApproved))
      }

      const res = await api.get('/reviews/admin', { params })
      const list = res?.data?.data || []
      const pg = res?.data?.pagination

      setReviews(list)
      if (pg) {
        setPagination({
          current: pg.currentPage || page,
          pageSize: pg.itemsPerPage || pageSize,
          total: pg.totalItems || list.length,
        })
      }
    } catch (err) {
      message.error('خطا در دریافت نظرات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews(1, pagination.pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.isApproved])

  // Initialize reply texts when reviews are loaded
  useEffect(() => {
    const initialTexts = {}
    reviews.forEach((review) => {
      if (review.adminReply?.message) {
        initialTexts[review._id] = review.adminReply.message
      }
    })
    setReplyTexts(initialTexts)
  }, [reviews])

  const handleStatusToggle = async (reviewId, currentStatus) => {
    try {
      await api.put(`/reviews/${reviewId}/status`, {
        isApproved: !currentStatus,
      })

      message.success('وضعیت نظر با موفقیت به‌روزرسانی شد.')
      fetchReviews()
    } catch (err) {
      message.error('خطا در به‌روزرسانی وضعیت نظر')
    }
  }

  const handleDelete = async (reviewId) => {
    try {
      await api.delete(`/reviews/${reviewId}`)
      message.success('نظر با موفقیت حذف شد.')
      fetchReviews()
    } catch (err) {
      message.error('خطا در حذف نظر')
    }
  }

  const handleReply = async (reviewId) => {
    const replyMessage = replyTexts[reviewId] || ''

    if (!replyMessage || replyMessage.trim() === '') {
      message.warning('لطفاً متن پاسخ را وارد کنید')
      return
    }

    setReplyLoading((prev) => ({ ...prev, [reviewId]: true }))
    try {
      await api.put(`/reviews/${reviewId}/reply`, {
        replyMessage: replyMessage.trim(),
      })
      message.success('پاسخ شما با موفقیت ثبت شد')
      fetchReviews()
    } catch (err) {
      message.error('خطا در ثبت پاسخ')
    } finally {
      setReplyLoading((prev) => ({ ...prev, [reviewId]: false }))
    }
  }

  const handleReplyTextChange = (reviewId, text) => {
    setReplyTexts((prev) => ({ ...prev, [reviewId]: text }))
  }

  const columns = [
    {
      title: 'محصول',
      dataIndex: ['product', 'name'],
      key: 'product',
      ellipsis: true,
      render: (name, record) => name || record.product?._id || '-',
    },
    {
      title: 'کاربر',
      dataIndex: ['user', 'name'],
      key: 'user',
      render: (name, record) => (
        <div>
          <div>{name || '-'}</div>
          <div style={{ fontSize: '0.85em', color: '#888' }}>
            {record.user?.email || '-'}
          </div>
        </div>
      ),
    },
    {
      title: 'امتیاز',
      dataIndex: 'rating',
      key: 'rating',
      width: 150,
      align: 'center',
      render: (rating) => <Rate disabled value={rating} />,
    },
    {
      title: 'متن نظر',
      dataIndex: 'comment',
      key: 'comment',
      ellipsis: true,
    },
    {
      title: 'وضعیت',
      dataIndex: 'isApproved',
      key: 'isApproved',
      width: 120,
      align: 'center',
      render: (isApproved) => (
        <Tag color={isApproved ? 'green' : 'orange'}>
          {isApproved ? 'تأیید شده' : 'در انتظار تأیید'}
        </Tag>
      ),
    },
    {
      title: 'تاریخ ثبت',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => formatPersianDate(date, true),
    },
    {
      title: 'عملیات',
      key: 'actions',
      width: 200,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Switch
            checked={record.isApproved}
            onChange={() => handleStatusToggle(record._id, record.isApproved)}
            checkedChildren="تأیید"
            unCheckedChildren="عدم تأیید"
          />
          <Popconfirm
            title="حذف نظر"
            description="آیا از حذف این نظر مطمئن هستید؟"
            onConfirm={() => handleDelete(record._id)}
            okText="حذف"
            cancelText="انصراف"
          >
            <Button type="primary" danger size="small" icon={<DeleteOutlined />}>
              حذف
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const onTableChange = (pag) => {
    setPagination((prev) => ({
      ...prev,
      current: pag.current,
      pageSize: pag.pageSize,
    }))
    fetchReviews(pag.current, pag.pageSize)
  }

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
        <h1>مدیریت نظرات محصولات</h1>
        <Button icon={<ReloadOutlined />} onClick={() => fetchReviews()} loading={loading}>
          بارگذاری مجدد
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <span>فیلتر وضعیت:</span>
            <Select
              style={{ width: 180 }}
              placeholder="همه"
              allowClear
              value={filters.isApproved}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  isApproved: value,
                }))
              }
            >
              <Select.Option value={true}>تأیید شده</Select.Option>
              <Select.Option value={false}>در انتظار تأیید</Select.Option>
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={reviews}
          rowKey="_id"
          loading={loading}
          pagination={pagination}
          onChange={onTableChange}
          locale={{
            emptyText: 'نظری یافت نشد.',
          }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: '16px 24px' }}>
                {/* ۱. نمایش نظر کاربر */}
                <Typography.Title level={5}>نظر کاربر:</Typography.Title>
                <Typography.Paragraph style={{ marginBottom: 16 }}>
                  {record.comment}
                </Typography.Paragraph>

                {/* ۲. نمایش پاسخ قبلی ادمین (اگر وجود داشت) */}
                {record.adminReply && record.adminReply.message && (
                  <>
                    <Divider style={{ margin: '16px 0' }} />
                    <Typography.Title level={5} style={{ color: '#1890ff' }}>
                      پاسخ شما:
                    </Typography.Title>
                    <Typography.Paragraph
                      style={{
                        fontStyle: 'italic',
                        background: '#f0f5ff',
                        padding: '12px',
                        borderRadius: '4px',
                        marginBottom: 16,
                      }}
                    >
                      {record.adminReply.message}
                    </Typography.Paragraph>
                    {record.adminReply.repliedAt && (
                      <Typography.Text type="secondary" style={{ fontSize: '0.85em' }}>
                        تاریخ پاسخ: {formatPersianDate(record.adminReply.repliedAt, true)}
                      </Typography.Text>
                    )}
                  </>
                )}

                {/* ۳. فرم ارسال/ویرایش پاسخ جدید */}
                <Divider style={{ margin: '16px 0' }} />
                <Typography.Title level={5}>ثبت/ویرایش پاسخ:</Typography.Title>
                <Form
                  layout="vertical"
                  onFinish={() => handleReply(record._id)}
                >
                  <Form.Item label="متن پاسخ">
                    <Input.TextArea
                      rows={4}
                      value={replyTexts[record._id] || ''}
                      onChange={(e) => handleReplyTextChange(record._id, e.target.value)}
                      placeholder="پاسخ خود را اینجا بنویسید..."
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SendOutlined />}
                      loading={replyLoading[record._id]}
                    >
                      ارسال پاسخ
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            ),
          }}
        />
      </Card>
    </div>
  )
}

export default ReviewsPage

