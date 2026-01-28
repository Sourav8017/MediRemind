'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '../lib/axios';
import { useRouter, usePathname } from 'next/navigation';

interface User {
    id: number;
    email: string;
    is_active: boolean;
    full_name?: string;
    phone_number?: string;
    email_notifications?: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const fetchUser = async () => {
        try {
            const res = await api.get('/users/me');
            setUser(res.data);
        } catch (error) {
            console.error('Failed to fetch user', error);
            logout();
        }
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            // Fetch user details immediately to populate profile
            // We use a small timeout or just call it directly since Axios interceptor will pick up token
            // But we need to ensure token state is set first.
            // Actually, we can pass storedToken to a fetcher if needed, but interceptor uses localStorage directly 
            // generally, or we rely on token state. 
            // In lib/axios.ts, it reads localStorage.getItem('token'). So it works.
            api.get('/users/me')
                .then(res => setUser(res.data))
                .catch(() => logout())
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const response = await api.post('/auth/token', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const { access_token } = response.data;
            localStorage.setItem('token', access_token);
            setToken(access_token);

            // Fetch real user data
            await fetchUser();

            router.push('/');
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const signup = async (email: string, password: string) => {
        try {
            await api.post('/auth/signup', { email, password });
            await login(email, password);
        } catch (error) {
            console.error('Signup failed:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        router.push('/login');
    };

    // Public API to refresh user data (e.g. after profile update)
    const refreshUser = async () => {
        await fetchUser();
    };

    // Route Protection
    useEffect(() => {
        const publicPaths = ['/login', '/signup'];
        if (!isLoading && !token && !publicPaths.includes(pathname)) {
            router.push('/login');
        }
    }, [isLoading, token, pathname, router]);

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
