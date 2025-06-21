'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Use the 'credentials' provider and redirect to the content page on success
    await signIn('credentials', { email, callbackUrl: '/dashboard/content' });
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md max-w-sm w-full">
        <h1 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          Development Login
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 sr-only">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter any email to log in"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In as Dev'}
          </Button>
        </form>
        <p className="text-xs text-gray-500 mt-4 text-center">
          This login is for development purposes only.
        </p>
      </div>
    </div>
  );
} 