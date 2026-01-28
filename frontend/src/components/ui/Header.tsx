'use client';

import { Bell, Search } from 'lucide-react';

interface HeaderProps {
    title: string;
    subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
    return (
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="pl-12 lg:pl-0">
                <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)]">{title}</h1>
                {subtitle && (
                    <p className="text-[var(--text-secondary)] mt-1">{subtitle}</p>
                )}
            </div>

            <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="input pl-10 w-64"
                    />
                </div>

                {/* Notifications */}
                <button className="relative p-3 rounded-xl bg-white border border-[var(--border)] hover:border-[var(--primary-light)] transition-colors">
                    <Bell size={20} className="text-[var(--text-secondary)]" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--danger)] rounded-full animate-pulse" />
                </button>
            </div>
        </header>
    );
}
