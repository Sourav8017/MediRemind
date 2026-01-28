'use client';

interface RiskScoreWidgetProps {
    score: number;
    category: 'LOW' | 'MODERATE' | 'HIGH';
    factors: string[];
}

export default function RiskScoreWidget({ score, category, factors }: RiskScoreWidgetProps) {
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (score / 100) * circumference;

    const getColor = () => {
        switch (category) {
            case 'LOW': return 'var(--success)';
            case 'MODERATE': return 'var(--warning)';
            case 'HIGH': return 'var(--danger)';
        }
    };

    const getCategoryLabel = () => {
        switch (category) {
            case 'LOW': return 'Low Risk';
            case 'MODERATE': return 'Moderate Risk';
            case 'HIGH': return 'High Risk';
        }
    };

    return (
        <div className="card p-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">Health Risk Score</h3>

            <div className="flex items-center gap-6">
                {/* Risk Ring */}
                <div className="risk-ring">
                    <svg width="120" height="120" viewBox="0 0 120 120">
                        <circle
                            className="risk-ring-bg"
                            cx="60"
                            cy="60"
                            r="52"
                        />
                        <circle
                            className="risk-ring-progress"
                            cx="60"
                            cy="60"
                            r="52"
                            stroke={getColor()}
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold" style={{ color: getColor() }}>{score}</span>
                        <span className="text-xs text-[var(--text-muted)]">/100</span>
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                    <div className={`badge ${category === 'LOW' ? 'badge-success' : category === 'MODERATE' ? 'badge-warning' : 'badge-danger'} mb-3`}>
                        {getCategoryLabel()}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-3">Contributing Factors:</p>
                    <ul className="space-y-1">
                        {factors.map((factor, i) => (
                            <li key={i} className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getColor() }} />
                                {factor}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <button className="btn btn-secondary w-full mt-4 text-sm">
                View Full Report
            </button>
        </div>
    );
}
