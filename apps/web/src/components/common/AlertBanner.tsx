import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

interface AlertBannerProps {
  to: string;
  icon: LucideIcon;
  text: string;
  tooltip?: string;
  variant?: 'warning' | 'danger' | 'info';
}

const variantStyles = {
  warning: 'bg-yellow-500/15 border-yellow-500/50',
  danger: 'bg-red-500/15 border-red-500/50',
  info: 'bg-blue-500/15 border-blue-500/50',
};

const iconStyles = {
  warning: 'text-yellow-600',
  danger: 'text-red-600',
  info: 'text-blue-600',
};

const AlertBanner = ({ to, icon: Icon, text, tooltip, variant = 'warning' }: AlertBannerProps) => {
  return (
    <Link
      className={`flex items-center justify-between w-full px-3 py-2 mb-4 rounded-md border text-foreground no-underline shadow ${variantStyles[variant]}`}
      to={to}
      title={tooltip}
      aria-label={text}
    >
      <div className="flex items-center">
        <Icon className={`h-5 w-5 mr-2 ${iconStyles[variant]}`} />
        <span className="font-semibold">{text}</span>
      </div>
      <ChevronRight className="h-4 w-4 ml-2" />
    </Link>
  );
};

export default AlertBanner;
