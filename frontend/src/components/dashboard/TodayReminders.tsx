'use client';

import { Check, X, Clock, Pill } from 'lucide-react';

interface Reminder {
    id: string;
    medicationName: string;
    dosage: string;
    scheduledTime: string;
    status: 'PENDING' | 'TAKEN' | 'SKIPPED';
}

interface TodayRemindersProps {
    reminders: Reminder[];
    onMarkTaken: (id: string) => void;
    onMarkSkipped: (id: string) => void;
}

export default function TodayReminders({ reminders, onMarkTaken, onMarkSkipped }: TodayRemindersProps) {
    const getStatusBadge = (status: Reminder['status']) => {
        switch (status) {
            case 'TAKEN': return <span className="badge badge-success">Taken</span>;
            case 'SKIPPED': return <span className="badge badge-warning">Skipped</span>;
            default: return <span className="badge badge-info">Pending</span>;
        }
    };

    return (
        <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--text-primary)]">Today's Reminders</h3>
                <span className="text-xs text-[var(--text-muted)]">
                    {reminders.filter(r => r.status === 'TAKEN').length}/{reminders.length} completed
                </span>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {reminders.map((reminder, index) => (
                    <div
                        key={reminder.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-[var(--background)] animate-fadeIn"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {/* Time */}
                        <div className="flex flex-col items-center min-w-[60px]">
                            <Clock size={14} className="text-[var(--text-muted)] mb-1" />
                            <span className="text-sm font-semibold text-[var(--text-primary)]">{reminder.scheduledTime}</span>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-12 bg-[var(--border)]" />

                        {/* Medication Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <Pill size={16} className="text-[var(--primary)]" />
                                <span className="font-medium text-[var(--text-primary)] truncate">{reminder.medicationName}</span>
                            </div>
                            <p className="text-xs text-[var(--text-muted)]">{reminder.dosage}</p>
                        </div>

                        {/* Status / Actions */}
                        {reminder.status === 'PENDING' ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onMarkTaken(reminder.id)}
                                    className="p-2 rounded-lg bg-[var(--success)] text-white hover:opacity-90 transition-opacity"
                                    title="Mark as taken"
                                >
                                    <Check size={18} />
                                </button>
                                <button
                                    onClick={() => onMarkSkipped(reminder.id)}
                                    className="p-2 rounded-lg bg-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--warning)] hover:text-white transition-colors"
                                    title="Skip"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            getStatusBadge(reminder.status)
                        )}
                    </div>
                ))}

                {reminders.length === 0 && (
                    <div className="text-center py-8 text-[var(--text-muted)]">
                        <Pill size={40} className="mx-auto mb-3 opacity-30" />
                        <p>No reminders for today</p>
                    </div>
                )}
            </div>
        </div>
    );
}
