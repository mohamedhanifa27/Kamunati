"use client";

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsChartProps {
  data: any[];
  title?: string;
  value?: string;
  description?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface/90 backdrop-blur-xl border border-white/10 p-3 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-sm font-semibold text-foreground">
          {payload[0].value} <span className="text-muted-foreground font-normal ml-1">views</span>
        </p>
      </div>
    );
  }
  return null;
};

export function AnalyticsChart({ data, title, value, description }: AnalyticsChartProps) {
  return (
    <div className="w-full h-full flex flex-col p-6 bg-surface/30 backdrop-blur-sm border border-border/50 rounded-2xl">
      <div className="mb-6">
        {title && <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>}
        {value && <p className="text-3xl font-semibold text-foreground mt-1">{value}</p>}
        {description && <p className="text-sm text-primary/80 mt-1">{description}</p>}
      </div>
      
      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#501A96" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#108AC2" stopOpacity={0.8}/>
              </linearGradient>
              <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#108AC2" stopOpacity={0.3}/>
                <stop offset="100%" stopColor="#501A96" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="url(#colorValue)" 
              strokeWidth={3}
              fill="url(#fillValue)" 
              activeDot={{ r: 6, fill: '#108AC2', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
