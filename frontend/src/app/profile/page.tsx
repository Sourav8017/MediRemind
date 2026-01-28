'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Phone, Save, Loader2, Bell } from 'lucide-react';
import api from '@/lib/axios';

interface UserProfile {
    full_name: string;
    phone_number: string;
    email_notifications: boolean;
    email: string;
}

export default function ProfilePage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile>({
        full_name: '',
        phone_number: '',
        email_notifications: false,
        email: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/users/me');
            setProfile({
                full_name: res.data.full_name || '',
                phone_number: res.data.phone_number || '',
                email_notifications: res.data.email_notifications || false,
                email: res.data.email
            });
        } catch (err) {
            console.error('Failed to fetch profile', err);
            setMessage({ type: 'error', text: 'Failed to load profile' });
        } finally {
            isLoading && setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            await api.put('/users/me', {
                full_name: profile.full_name,
                phone_number: profile.phone_number,
                email_notifications: profile.email_notifications
            });
            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (err) {
            console.error('Failed to update profile', err);
            setMessage({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>;
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                <User className="text-[var(--primary)]" />
                My Profile
            </h1>

            <div className="card p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email (Read Only) */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                            <input
                                type="email"
                                value={profile.email}
                                disabled
                                className="input pl-10 bg-[var(--background)] opacity-70 cursor-not-allowed"
                            />
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-1">Email cannot be changed</p>
                    </div>

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                            Full Name
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                            <input
                                type="text"
                                value={profile.full_name}
                                onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                                placeholder="John Doe"
                                className="input pl-10"
                            />
                        </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                            Phone Number
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                            <input
                                type="tel"
                                value={profile.phone_number}
                                onChange={e => setProfile({ ...profile, phone_number: e.target.value })}
                                placeholder="+1 (555) 000-0000"
                                className="input pl-10"
                            />
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[var(--surface-hover)]">
                                <Bell size={20} className="text-[var(--primary)]" />
                            </div>
                            <div>
                                <p className="font-medium text-[var(--text-primary)]">Email Notifications</p>
                                <p className="text-sm text-[var(--text-muted)]">Receive alerts for missed medications</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={profile.email_notifications}
                                onChange={e => setProfile({ ...profile, email_notifications: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                        </label>
                    </div>

                    {/* Feedback Message */}
                    {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="btn btn-primary w-full flex justify-center items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Save Changes
                    </button>
                </form>
            </div>
        </div>
    );
}
