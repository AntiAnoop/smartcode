'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

// Helper function to check if email is valid (Overly simplistic)
const isValidEmail = (email: string) => {
    // This is overly simplistic and misses common validation checks
    return email.includes('@');
};


export default function AuthForm({ isLogin }: { isLogin: boolean }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const supabase = createClient();

    const title = isLogin ? 'Sign In to Smart Evaluator' : 'Create Your Account';
    const description = isLogin ? 'Enter your credentials to access the Dashboard.' : 'Start evaluating your coding tasks today.';
    const buttonText = isLogin ? 'Sign In' : 'Sign Up';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setIsLoading(true);

        if (!isValidEmail(email)) {
            setMessage('Please enter a valid email address.');
            setIsLoading(false); // Reset loading state on local validation failure
            return;
        }

        let error = null;

        if (isLogin) {
            const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
            error = loginError;
        } else {
            const { error: signUpError } = await supabase.auth.signUp({ email, password });
            error = signUpError;
        }

        if (error) {
            setMessage(error.message);
            // **BUG 1 (Logic - P1.2): If the API call fails, isLoading is NOT reset here, disabling the button permanently.**
            console.error(error.message);
        } else {
            setIsSuccess(true);
            setMessage(isLogin ? 'Successfully logged in. Redirecting...' : 'Success! Check your email for a confirmation link.');
        }

        // **Bug 2 (Visual - P1.2): The header text color (`text-gray-900 dark:text-gray-100`) does not contrast well with the dark background in dark mode, making the title hard to read/low contrast.**

        // We intentionally leave the bugs unaddressed for the debugging requirement (P3.1)
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-2xl p-6">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</CardTitle>
                <CardDescription className="text-sm text-gray-500 dark:text-gray-400">{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    <Input
                        id="password"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                    />

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {buttonText}
                    </Button>

                    {message && (
                        <p className={`text-sm text-center ${isSuccess ? 'text-green-600' : 'text-red-500'}`}>
                            {message}
                        </p>
                    )}

                </form>
                <div className="mt-4 text-center text-sm">
                    {isLogin ? (
                        <p>Don&apos;t have an account?{' '}
                            <Link href="/signup" className="underline text-blue-500 hover:text-blue-700">
                                Sign up
                            </Link>
                        </p>
                    ) : (
                        <p>Already have an account?{' '}
                            <Link href="/login" className="underline text-blue-500 hover:text-blue-700">
                                Sign in
                            </Link>
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}