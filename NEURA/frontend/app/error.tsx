'use client';
import { useEffect } from 'react';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
    useEffect(() => {
        console.error('Neura Frontend Error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#0a0f1c] text-white">
            <h2 className="text-3xl font-bold text-red-500 mb-4">Something went wrong!</h2>
            <p className="text-gray-400 mb-8 max-w-lg text-center">
                {error.message || 'An unexpected error occurred in the application.'}
            </p>
            <button
                onClick={() => reset()}
                className="px-6 py-3 bg-[#00f2ff] text-black rounded-lg font-bold hover:bg-[#00d0ff] transition-colors"
            >
                Try again
            </button>
        </div>
    );
}
