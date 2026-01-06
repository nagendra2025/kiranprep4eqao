'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ErrorMessage } from '@/components/ui/error-message';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  
  // Prevent auto-fill interference
  useEffect(() => {
    // Clear any auto-filled values
    if (emailRef.current) {
      emailRef.current.value = '';
      setEmail('');
    }
    if (passwordRef.current) {
      passwordRef.current.value = '';
      setPassword('');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setLoading(true);

    try {
      // Get current values directly from refs to avoid state issues
      const emailValue = emailRef.current?.value || email;
      const passwordValue = passwordRef.current?.value || password;

      // Simple email validation
      if (!emailValue || !emailValue.includes('@')) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      if (!passwordValue || passwordValue.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      console.log('🔐 Attempting login with email:', emailValue.trim().toLowerCase());

      // Sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailValue.trim().toLowerCase(),
        password: passwordValue,
      });

      if (signInError) {
        console.error('❌ Login error:', signInError);
        setError(signInError.message || 'Invalid email or password');
        setLoading(false);
        return;
      }

      if (!data?.user || !data?.session) {
        console.error('❌ No user or session returned');
        setError('Login failed. Please try again.');
        setLoading(false);
        return;
      }

      console.log('✅ Login successful! User ID:', data.user.id);
      console.log('✅ Session created');

      // Get user role from profile
      let redirectPath = '/candidate/dashboard'; // Default
      
      try {
        console.log('🔍 Looking up user profile...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('⚠️ Profile lookup error:', profileError);
          console.log('Using default candidate dashboard');
        } else if (profile) {
          redirectPath = profile.role === 'ADMIN' ? '/admin/dashboard' : '/candidate/dashboard';
          console.log('✅ Profile found! Role:', profile.role);
        } else {
          console.warn('⚠️ No profile found');
        }
      } catch (profileErr) {
        console.error('❌ Profile lookup exception:', profileErr);
      }

      console.log('🎯 Redirecting to:', redirectPath);

      // CRITICAL: Wait for session to be saved and cookies to sync
      // The server-side needs cookies, not just localStorage
      console.log('⏳ Waiting for session cookies to sync (3 seconds)...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Final session verification
      const { data: { session: finalSession } } = await supabase.auth.getSession();
      if (!finalSession) {
        console.error('❌ Session lost!');
        setError('Session was lost. Please try again.');
        setLoading(false);
        return;
      }

      console.log('✅ Session verified');
      
      // Make an API call to sync session to server-side cookies
      console.log('🔄 Syncing session to server...');
      try {
        const syncResponse = await fetch('/api/auth/sync', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          console.log('✅ Session synced! Role:', syncData.role);
          // Use the role from server if available
          if (syncData.role === 'ADMIN') {
            redirectPath = '/admin/dashboard';
          } else {
            redirectPath = '/candidate/dashboard';
          }
        } else {
          console.warn('⚠️ Sync failed, using client-side role');
        }
      } catch (syncErr) {
        console.warn('⚠️ Sync error, using client-side role:', syncErr);
      }

      console.log('🔄 Redirecting to:', redirectPath);
      
      // Use window.location.replace to avoid back button issues
      window.location.replace(redirectPath);
      
    } catch (err: any) {
      console.error('❌ Login exception:', err);
      setError(err?.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl w-full">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-xl p-8 mb-6 text-white">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-3">Welcome, Kiranmayi! 🎉</h1>
            <p className="text-xl mb-4 text-indigo-100">
              Your EQAO Preparation Journey Starts Here
            </p>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mt-4">
              <p className="text-lg font-semibold mb-2">📅 Important Dates</p>
              <p className="text-indigo-100">
                EQAO Test Dates: <span className="font-bold">January 20, 21st, and 27th</span>
              </p>
            </div>
          </div>
        </div>

        {/* Preparation Tips */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">💡</span>
            Best Preparation Strategy
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-indigo-600 font-bold mr-2">✓</span>
              <span><strong>Consistency is Key:</strong> Practice daily, even if it's just 15-20 minutes. Regular practice builds confidence and improves retention.</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-600 font-bold mr-2">✓</span>
              <span><strong>Focus on Understanding:</strong> Don't just memorize formulas. Understand the concepts behind each problem type.</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-600 font-bold mr-2">✓</span>
              <span><strong>Review Mistakes:</strong> Learn from every error. Understanding why you got something wrong is more valuable than getting it right.</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-600 font-bold mr-2">✓</span>
              <span><strong>Time Management:</strong> Practice under timed conditions to build speed and accuracy for the actual test.</span>
            </li>
          </ul>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
            <p className="text-gray-600 mt-2">Enter your credentials to continue</p>
          </div>

        <form 
          onSubmit={handleLogin} 
          className="space-y-6"
          autoComplete="off"
          noValidate
        >
          <ErrorMessage error={error} onDismiss={() => setError(null)} />

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                const val = e.target.value;
                setEmail(val);
                if (emailRef.current) {
                  emailRef.current.value = val;
                }
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 bg-white"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              ref={passwordRef}
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => {
                const val = e.target.value;
                setPassword(val);
                if (passwordRef.current) {
                  passwordRef.current.value = val;
                }
              }}
              autoComplete="new-password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 bg-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Contact your administrator for account access</p>
          </div>
        </div>

        {/* Exciting Features */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg shadow-lg p-6 mb-6 border border-yellow-200">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
            <span className="text-2xl mr-2">🚀</span>
            What Makes This Special?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <div className="flex items-start">
              <span className="text-2xl mr-2">🎯</span>
              <div>
                <strong>Progressive Difficulty:</strong> Questions start easy and gradually increase in complexity, just like the real EQAO test.
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-2">📊</span>
              <div>
                <strong>Instant Feedback:</strong> Get immediate results and detailed explanations for every question.
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-2">🔄</span>
              <div>
                <strong>Unlimited Practice:</strong> Take tests as many times as you need to master each concept.
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-2">📈</span>
              <div>
                <strong>Track Progress:</strong> Monitor your improvement over time and see your scores improve.
              </div>
            </div>
          </div>
        </div>

        {/* Motivational Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            <span className="font-semibold text-indigo-600">You've got this, Kiranmayi!</span> 🌟
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Every practice session brings you one step closer to success. Keep going!
          </p>
        </div>
      </div>
    </div>
  );
}
