import { Star } from 'lucide-react';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md';
  label?: string;
  disabled?: boolean;
}

export function FavoriteButton({
  isFavorite,
  onToggle,
  size = 'md',
  label,
  disabled = false,
}: FavoriteButtonProps) {
  const sizeClass = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]';

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onToggle();
      }}
      disabled={disabled}
      className={`inline-flex ${sizeClass} items-center justify-center rounded-md transition-all hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50 ${
        isFavorite ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'
      }`}
      aria-label={label || (isFavorite ? '관심 공고 해제' : '관심 공고 등록')}
      title={isFavorite ? '관심 공고 해제' : '관심 공고 등록'}
    >
      <Star className={iconSize} fill={isFavorite ? 'currentColor' : 'none'} />
    </button>
  );
}
