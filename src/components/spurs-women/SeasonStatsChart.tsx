'use client';

import { Card } from '@/components/Card';
import { SeasonStatsData } from '@/lib/data/seasons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SeasonStatsChartProps {
  stats: SeasonStatsData[];
}

export default function SeasonStatsChart({ stats }: SeasonStatsChartProps) {
  // Filter out seasons with no data
  const validStats = stats.filter(
    stat => stat.winPercentage > 0 || stat.goalsPerGame > 0 || stat.attendancePercentage > 0
  );

  if (validStats.length === 0) {
    return null;
  }

  return (
    <Card variant="spursAccent" padding="lg" clickable={false}>
      <h2 className="spurs-text font-bold mb-6">Season Statistics Over Time</h2>
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={validStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
            <XAxis 
              dataKey="seasonName" 
              className="text-sm"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              yAxisId="left"
              className="text-sm"
              tick={{ fill: 'currentColor' }}
              label={{ value: '%', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              className="text-sm"
              tick={{ fill: 'currentColor' }}
              label={{ value: 'Goals', angle: 90, position: 'insideRight' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--spurs-dark-opacity-95)',
                border: '1px solid #78BEE8',
                borderRadius: '8px',
                color: '#f5f7fa'
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => 
                typeof value === 'number' ? value.toFixed(2) : '0.00'
              }
            />
            <Legend />
            <Line 
              yAxisId="left"
              dataKey="winPercentage" 
              name="Win %" 
              stroke="#78BEE8" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line 
              yAxisId="right"
              dataKey="goalsPerGame" 
              name="Goals/Game" 
              stroke="#aad0e8" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line 
              yAxisId="right"
              dataKey="goalsConcededPerGame" 
              name="Goals Conceded/Game" 
              stroke="#b9cfff" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line 
              yAxisId="left"
              dataKey="attendancePercentage" 
              name="Attendance %" 
              stroke="#e8ecf1" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
