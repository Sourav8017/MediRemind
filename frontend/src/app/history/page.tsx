'use client';

import { useState, useEffect } from 'react';
import { History, Calendar, CheckCircle, XCircle, Clock, Pill } from 'lucide-react';
import api from '@/lib/axios';

interface ReminderHistory {
    id: number;
    scheduled_time: string;
    status: 'TAKEN' | 'SKIPPED';
    medication: {
        name: string;
        dosage: string;
    };
}

export default function HistoryPage() {
    const [history, setHistory] = useState<ReminderHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/users/me/reminders/history');
                setHistory(res.data);
            } catch (err) {
                console.error('Failed to fetch history', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit'
        });
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                <History className="text-[var(--primary)]" />
                Medication History
            </h1>

            <div className="card overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-[var(--text-muted)] animate-pulse">Loading history...</div>
                ) : history.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center gap-3 text-[var(--text-muted)]">
                        <Clock size={40} className="opacity-20" />
                        <p>No history found. Taken or skipped medications will appear here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--border)] bg-[var(--surface-hover)]">
                                    <th className="p-4 font-medium text-[var(--text-secondary)]">Date & Time</th>
                                    <th className="p-4 font-medium text-[var(--text-secondary)]">Medication</th>
                                    <th className="p-4 font-medium text-[var(--text-secondary)]">Dosage</th>
                                    <th className="p-4 font-medium text-[var(--text-secondary)]">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {history.map((record) => (
                                    <tr key={record.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                                        <td className="p-4 text-[var(--text-primary)] font-medium flex items-center gap-2">
                                            <Calendar size={14} className="text-[var(--text-muted)]" />
                                            {formatDate(record.scheduled_time)}
                                        </td>
                                        <td className="p-4 text-[var(--text-primary)]">
                                            <div className="flex items-center gap-2">
                                                <Pill size={14} className="text-[var(--primary)]" />
                                                {record.medication.name}
                                            </div>
                                        </td>
                                        <td className="p-4 text-[var(--text-secondary)]">{record.medication.dosage}</td>
                                        <td className="p-4">
                                            {record.status === 'TAKEN' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircle size={12} /> TAKEN
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                    <XCircle size={12} /> SKIPPED
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
