'use client';

/**
 * NeuralLoader Component
 * Futuristic loading animation with progress tracking
 */

import { motion } from 'framer-motion';

interface NeuralLoaderProps {
    message?: string;
    progress?: number; // 0-100
    step?: string; // e.g., "Step 1 of 2"
}

export default function NeuralLoader({
    message = 'Processing...',
    progress = 0,
    step
}: NeuralLoaderProps) {
    return (
        <div className="flex flex-col items-center justify-center space-y-4 p-6">
            {/* Pulsing neural network visualization */}
            <motion.div
                className="relative h-20 w-20"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            >
                {/* Central node */}
                <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-cyan neural-glow" />

                {/* Surrounding nodes */}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute h-2 w-2 rounded-full bg-primary-cyan"
                        style={{
                            left: '50%',
                            top: '50%',
                            transform: `rotate(${i * 60}deg) translateY(-30px)`,
                        }}
                        animate={{
                            opacity: [0.3, 1, 0.3],
                            scale: [0.8, 1.2, 0.8],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: 'easeInOut',
                        }}
                    />
                ))}
            </motion.div>

            {/* Step indicator */}
            {step && (
                <div className="text-sm font-medium text-primary-cyan">
                    {step}
                </div>
            )}

            {/* Message */}
            <div className="text-center">
                <div className="text-lg font-semibold text-white">{message}</div>
            </div>

            {/* Progress bar */}
            {progress > 0 && (
                <div className="w-full max-w-xs">
                    <div className="neural-progress" style={{ '--progress': `${progress}%` } as React.CSSProperties}>
                        <motion.div
                            className="absolute left-0 top-0 h-full bg-holographic"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </div>
                    <div className="mt-2 text-center text-sm text-gray-400">
                        {progress}% Complete
                    </div>
                </div>
            )}

            {/* Spinning loader */}
            <div className="neural-spinner" />
        </div>
    );
}
