import { getTeamColor } from '@/lib/utils/team-colors';

interface TeamPillProps {
  teamName: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  className?: string;
}

export default function TeamPill({ 
  teamName, 
  primaryColor, 
  secondaryColor,
  className = "inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium transition-colors"
}: TeamPillProps) {
  return (
    <span 
      className={className}
      style={{ 
        backgroundColor: getTeamColor(primaryColor),
        color: getTeamColor(secondaryColor) || '#ffffff',
        WebkitTextFillColor: getTeamColor(secondaryColor) || '#ffffff'
      }}
    >
      {teamName}
    </span>
  );
}
