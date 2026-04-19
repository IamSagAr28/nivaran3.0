import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  trend?: { value: number; isPositive: boolean };
}

export function StatsCard({
  title,
  value,
  icon,
  color,
  loading = false,
  trend,
}: StatsCardProps) {
  return (
    <div className="admin-stats-card">
      <div className={`admin-stats-icon ${color}`}>{icon}</div>
      <div className="admin-stats-content">
        <p className="admin-stats-title">{title}</p>
        {loading ? (
          <div className="admin-skeleton" style={{ width: '100px', height: '32px' }} />
        ) : (
          <h3 className="admin-stats-value">{value}</h3>
        )}
        {trend && (
          <p className={`admin-stats-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
            {trend.isPositive ? '📈' : '📉'} {trend.value}% this month
          </p>
        )}
      </div>
    </div>
  );
}

export default StatsCard;
