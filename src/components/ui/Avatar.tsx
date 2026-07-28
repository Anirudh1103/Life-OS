import { cn } from '@/utils/classNames';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return src ? (
    <img className={cn('inline-flex rounded-full object-cover', sizes[size])} src={src} alt={name} />
  ) : (
    <div className={cn('inline-flex items-center justify-center rounded-full bg-slate-900 text-white', sizes[size])}>
      {initials || 'U'}
    </div>
  );
}
