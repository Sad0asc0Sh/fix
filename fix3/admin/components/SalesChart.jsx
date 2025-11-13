"use client";
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// This wrapper component makes the chart responsive
const ChartContainer = ({ children }) => (
  <div className="w-full h-[350px]">
    <ResponsiveContainer width="100%" height="100%">
      {children}
    </ResponsiveContainer>
  </div>
);

// Custom Tooltip component for Persian localization
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-md shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="text-indigo-600">{`فروش: ${new Intl.NumberFormat('fa-IR').format(payload[0].value)} تومان`}</p>
      </div>
    );
  }
  return null;
};

export default function SalesChart({ data }) {
  return (
    <ChartContainer>
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 10,
          left: 20, // Space for Persian Y-axis labels
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis 
          dataKey="date" 
          stroke="#6b7280"
          tick={{ fill: '#374151', dx: 0, dy: 10 }}
          style={{ direction: 'ltr' }}
        />
        <YAxis 
          stroke="#6b7280"
          tickFormatter={(value) => new Intl.NumberFormat('fa-IR').format(value)}
          tick={{ fill: '#374151', dx: -10 }}
          style={{ direction: 'ltr' }}
          domain={['auto', 'auto']}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ direction: 'rtl', paddingTop: '10px' }} 
          formatter={() => 'فروش'}
        />
        <Line 
          type="monotone" 
          dataKey="sales" 
          stroke="#4f46e5" // Indigo color
          strokeWidth={2}
          dot={{ r: 4, fill: '#4f46e5' }}
          activeDot={{ r: 6, stroke: '#4f46e5', fill: '#ffffff' }}
        />
      </LineChart>
    </ChartContainer>
  );
}

