import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OracleLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

/**
 * Loader mystique avec rotation et halo pulsant
 */
export function OracleLoader({
  className,
  size = 'md',
  message = 'L\'oracle médite...',
}: OracleLoaderProps) {
  const shouldReduceMotion = useReducedMotion();

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl',
  };

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Loader container */}
      <div className={cn('relative', sizeClasses[size])}>
        {/* Halo pulsant */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--mp-brand-violet) / 0.3), transparent 70%)',
          }}
          animate={shouldReduceMotion ? {} : {
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Second halo (gold) */}
        <motion.div
          className="absolute inset-2 rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--mp-brand-gold) / 0.2), transparent 70%)',
          }}
          animate={shouldReduceMotion ? {} : {
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        />

        {/* Rotating symbol container */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={shouldReduceMotion ? {} : { rotate: 360 }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {/* Outer ring with symbols */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#oracleGradient)"
              strokeWidth="1"
              strokeDasharray="8 4"
              opacity="0.6"
            />
            <defs>
              <linearGradient id="oracleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--mp-brand-violet))" />
                <stop offset="50%" stopColor="hsl(var(--mp-brand-gold))" />
                <stop offset="100%" stopColor="hsl(var(--mp-brand-violet))" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Center symbol (counter-rotating for visual effect) */}
        <motion.div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            iconSizes[size]
          )}
          animate={shouldReduceMotion ? {} : { rotate: -360 }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <span 
            className="filter drop-shadow-lg"
            style={{ color: 'hsl(var(--mp-brand-gold))' }}
          >
            ✦
          </span>
        </motion.div>

        {/* Orbiting dots */}
        {!shouldReduceMotion && [0, 120, 240].map((angle, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: i === 0 
                ? 'hsl(var(--mp-brand-gold))' 
                : 'hsl(var(--mp-brand-violet))',
              top: '50%',
              left: '50%',
              marginTop: -4,
              marginLeft: -4,
            }}
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: 'linear',
            }}
            initial={{
              x: Math.cos((angle * Math.PI) / 180) * 35,
              y: Math.sin((angle * Math.PI) / 180) * 35,
            }}
          />
        ))}
      </div>

      {/* Message */}
      {message && (
        <motion.p
          className="text-muted-foreground text-sm font-medium"
          animate={shouldReduceMotion ? {} : { opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}

export default OracleLoader;
