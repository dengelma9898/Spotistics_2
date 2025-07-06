'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface LibraryGrowthChartProps {
  data: Array<{
    date: string
    count: number
  }>
}

export function LibraryGrowthChart({ data }: LibraryGrowthChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        <p>Keine Daten verfügbar</p>
      </div>
    )
  }

  // Formatiere Daten für bessere Darstellung
  const chartData = data.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('de-DE', {
      month: 'short',
      year: '2-digit'
    })
  }))

  // Reduziere Datenpunkte für bessere Lesbarkeit (zeige nur jeden 30. Tag)
  const reducedData = chartData.filter((_, index) => index % 30 === 0 || index === chartData.length - 1)

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={reducedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="formattedDate" 
            stroke="#9CA3AF"
            fontSize={12}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="#9CA3AF"
            fontSize={12}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F9FAFB'
            }}
            formatter={(value: number) => [value.toLocaleString(), 'Tracks']}
            labelFormatter={(label) => `Datum: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#10B981" 
            strokeWidth={2}
            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
} 