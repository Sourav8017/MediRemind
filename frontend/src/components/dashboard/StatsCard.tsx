'use client';

import { Pill, TrendingUp, TrendingDown, Calendar, Clock } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: 'medications' | 'adherence' | 'streak' | 'next';
    trend?: { value: number; isPositive: boolean };
}

export default function StatsCard({ title, value, subtitle, icon, trend }: StatsCardProps) {
    const getIcon = () => {
        const iconClass = "w-6 h-6";
        switch (icon) {
            case 'medications': return <Pill className={iconClass} />;
            case 'adherence': return <TrendingUp className={iconClass} />;
            case 'streak': return <Calendar className={iconClass} />;
            case 'next': return <Clock className={iconClass} />;
        }
    };

    const getIconBg = () => {
        switch (icon) {
            case 'medications': return 'from-[var(--primary)] to-[var(--primary-dark)]';
            case 'adherence': return 'from-[var(--success)] to-emerald-600';
            case 'streak': return 'from-[var(--warning)] to-amber-600';
            case 'next': return 'from-[var(--accent)] to-[var(--primary-light)]';
        }
    };

    return (
        <div className="card p-5 group hover:scale-[1.02] transition-transform">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-[var(--text-muted)] mb-1">{title}</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1">{subtitle}</p>
                    )}
                    {trend && (
                        <div className={`flex items-center gap-1 mt-2 text-xs ${trend.isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                            {trend.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span>{trend.isPositive ? '+' : ''}{trend.value}% vs last week</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${getIconBg()} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    {getIcon()}
                </div>
            </div>
        </div>
    );
}
