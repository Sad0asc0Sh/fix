import { useEffect, useState } from 'react'
import { Card } from 'antd'
import api from '../../api'

function SettingsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const res = await api.get('/admin/settings')
        setData(res?.data)
      } catch (_) {}
      finally { setLoading(false) }
    })()
  }, [])

  return (
    <div>
      <h1>تنظیمات</h1>
      <Card loading={loading}>
        <pre style={{ direction: 'ltr', whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>
      </Card>
    </div>
  )
}

export default SettingsPage

