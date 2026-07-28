import type { ElementType, InputHTMLAttributes } from 'react';
import { Lock } from 'lucide-react';
import { Input } from './Input';

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: ElementType;
}

export function PasswordInput({ label, error, icon: Icon = Lock, className, ...props }: PasswordInputProps) {
  return <Input label={label} error={error} icon={Icon} type="password" className={className} {...props} />;
}
