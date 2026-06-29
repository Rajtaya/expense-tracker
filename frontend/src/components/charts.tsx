'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMoney } from '@/lib/format';
import { CategoryTotal, TrendPoint } from '@/lib/types';

const ACCENT = '#6366f1';

function Empty({ h = 260 }: { h?: number }) {
  return (
    <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height: h }}>
      No data yet
    </div>
  );
}

export function CategoryPie({ data }: { data: CategoryTotal[] }) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color || ACCENT} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => formatMoney(Number(v))} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TrendChart({ data, kind = 'bar' }: { data: TrendPoint[]; kind?: 'bar' | 'line' }) {
  if (!data.length) return <Empty h={280} />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      {kind === 'line' ? (
        <LineChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="period" fontSize={12} />
          <YAxis fontSize={12} width={56} tickFormatter={(v) => '₹' + v} />
          <Tooltip formatter={(v) => formatMoney(Number(v))} />
          <Line dataKey="total" stroke={ACCENT} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      ) : (
        <BarChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="period" fontSize={12} />
          <YAxis fontSize={12} width={56} tickFormatter={(v) => '₹' + v} />
          <Tooltip formatter={(v) => formatMoney(Number(v))} />
          <Bar dataKey="total" fill={ACCENT} radius={[4, 4, 0, 0]} />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}
