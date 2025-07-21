import { useState, useEffect } from 'react';
import { getUserFromTelegram } from '@/lib/telegram';

interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  role: string;
}

export function useTelegramAuth() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authenticateWithTelegram = async () => {
      try {
        const telegramUser = getUserFromTelegram();
        
        if (telegramUser) {
          // Send Telegram user data to backend for authentication
          const response = await fetch('/api/auth/telegram', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ telegramUser }),
          });

          if (response.ok) {
            const { user: authenticatedUser } = await response.json();
            setUser(authenticatedUser);
          } else {
            setError('Authentication failed');
          }
        } else {
          // Not in Telegram environment - create demo user
          setUser({
            id: 1,
            firstName: 'Demo',
            lastName: 'User',
            username: 'demo_user',
            role: 'customer'
          });
        }
      } catch (err) {
        setError('Authentication error');
        console.error('Auth error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    authenticateWithTelegram();
  }, []);

  return { user, isLoading, error };
}