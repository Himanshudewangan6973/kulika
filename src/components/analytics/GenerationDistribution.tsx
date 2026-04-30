'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface GenerationDistributionProps {
  data?: Record<string, number>
}

const COLORS = ['#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd']

export default function GenerationDistribution({ data }: GenerationDistributionProps) {
  // Convert object to array for Recharts
  const chartData = data 
    ? Object.entries(data).map(([gen, count]) => ({ name: `Gen ${gen}`, value: count }))
    : []

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
        />
        <Legend verticalAlign="bottom" height={36}/>
      </PieChart>
    </ResponsiveContainer>
  )
}
