'use client';

import { useEffect, useState } from 'react';
import { Bell, X, AlertCircle, Check, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
    id: string;
    medicationName: string;
    dosage: string;
    instructions?: string;
    message: string;
    isHighRisk?: boolean;
    disclaimer?: string | null;
    actionLabel?: string;
}

import { useAuth } from '@/context/AuthContext'; // NEW

export default function NotificationManager() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const { token } = useAuth(); // NEW

    useEffect(() => {
        if (!token) return; // Don't connect if no token

        // Connect to SSE stream
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        // Pass token in query param
        const eventSource = new EventSource(`${API_URL}/notifications/stream?token=${token}`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.error === 'Unauthorized') {
                    console.error('SSE Unauthorized');
                    eventSource.close();
                    return;
                }

                console.log('Received notification:', data);

                const newNotification: Notification = {
                    id: data.id?.toString() || Date.now().toString(),
                    medicationName: data.medicationName,
                    dosage: data.dosage,
                    instructions: data.instructions,
                    message: data.message,
                    isHighRisk: data.isHighRisk || false,
                    disclaimer: data.disclaimer || null,
                    actionLabel: data.actionLabel || 'Got it'
                };

                setNotifications(prev => [...prev, newNotification]);

                // Play a gentle notification sound if available
                const audio = new Audio('/notification.mp3');
                audio.volume = 0.5; // Keep it gentle
                audio.play().catch(() => { }); // Silently fail if no sound available

                // Auto dismiss after 15s (longer for high-risk)
                const dismissTime = newNotification.isHighRisk ? 20000 : 12000;
                setTimeout(() => {
                    setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
                }, dismissTime);

            } catch (e) {
                console.error('Error parsing notification:', e);
            }
        };

        eventSource.onerror = (err) => {
            // EventSource has built-in retry; we just log quietly
            console.log('Notification stream reconnecting...', err);
        };

        return () => {
            eventSource.close();
        };
    }, [token]); // Re-run when token changes

    const dismiss = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const markAsTaken = (id: string) => {
        // TODO: Call API to update reminder status to TAKEN
        console.log('Marking reminder as taken:', id);
        dismiss(id);
    };

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none max-w-sm">
            <AnimatePresence>
                {notifications.map((notification) => (
                    <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 50, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 30, scale: 0.95, transition: { duration: 0.2 } }}
                        className={`pointer-events-auto bg-white shadow-2xl rounded-xl overflow-hidden ${notification.isHighRisk
                            ? 'border-l-4 border-amber-500'
                            : 'border-l-4 border-[var(--primary)]'
                            }`}
                    >
                        {/* Header */}
                        <div className={`px-4 py-3 flex items-center gap-3 ${notification.isHighRisk ? 'bg-amber-50' : 'bg-blue-50'
                            }`}>
                            <div className={`p-2 rounded-full ${notification.isHighRisk
                                ? 'bg-amber-100 text-amber-600'
                                : 'bg-blue-100 text-[var(--primary)]'
                                }`}>
                                {notification.isHighRisk ? <AlertCircle size={18} /> : <Bell size={18} />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 text-sm">
                                    {notification.isHighRisk ? 'Important Reminder' : 'Medication Reminder'}
                                </h4>
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                    <Clock size={12} />
                                    <span>Just now</span>
                                </div>
                            </div>
                            <button
                                onClick={() => dismiss(notification.id)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                aria-label="Dismiss notification"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-4 py-3">
                            <p className="text-gray-700 text-sm leading-relaxed">
                                {notification.message}
                            </p>

                            {/* Instructions if different from message */}
                            {notification.instructions &&
                                notification.instructions.toLowerCase() !== 'test' &&
                                notification.instructions.toLowerCase() !== 'take as directed' && (
                                    <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                                        <span className="text-gray-400">💊</span>
                                        {notification.instructions}
                                    </p>
                                )}

                            {/* Medical Disclaimer for high-risk medications */}
                            {notification.isHighRisk && notification.disclaimer && (
                                <div className="mt-3 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                        ⚠️ {notification.disclaimer}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="px-4 pb-3 flex gap-2">
                            <button
                                onClick={() => markAsTaken(notification.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${notification.isHighRisk
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                    : 'bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white'
                                    }`}
                            >
                                <Check size={16} />
                                {notification.actionLabel || 'Mark as Taken'}
                            </button>
                            <button
                                onClick={() => dismiss(notification.id)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                Later
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
