import { useEffect, useState } from 'react'
import { Card, DatePicker, Row, Col, Statistic, Spin, message } from 'antd'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import api from '../../api'

const { RangePicker } = DatePicker

function SalesReports() {
  const [loading, setLoading] = useState(false)
  const [range, setRange] = useState([])
  const [summary, setSummary] = useState({
    totalSales: 0,
    ordersCount: 0,
  })
  const [series, setSeries] = useState([])

  const fetchReports = async (params = {}) => {
    setLoading(true)
    try {
      const res = await api.get('/reports/sales', { params })
      const data = res?.data?.data || {}

      setSummary({
        totalSales: data.summary?.totalSales || 0,
        ordersCount: data.summary?.ordersCount || 0,
      })
      setSeries(Array.isArray(data.series) ? data.series : [])
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'خطا در دریافت گزارش فروش'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleRangeChange = (values) => {
    setRange(values || [])
    if (!values || values.length !== 2) {
      fetchReports()
      return
    }

    const [start, end] = values
    fetchReports({
      startDate: start?.toISOString(),
      endDate: end?.toISOString(),
    })
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
        <h1>گزارش فروش</h1>
        <RangePicker
          value={range}
          onChange={handleRangeChange}
          allowClear
          style={{ maxWidth: 320 }}
        />
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12}>
            <Card>
              <Statistic
                title="مجموع فروش (پرداخت‌شده)"
                value={summary.totalSales}
                precision={0}
                valueStyle={{ color: '#3f8600' }}
                suffix="تومان"
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card>
              <Statistic
                title="تعداد سفارشات پرداخت‌شده"
                value={summary.ordersCount}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        <Card title="نمودار فروش">
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="totalSales"
                  stroke="#1890ff"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Spin>
    </div>
  )
}

export default SalesReports

