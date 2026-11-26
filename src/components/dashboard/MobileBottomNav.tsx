import React from 'react';
import { Bell, FileCheck, LayoutDashboard, MessageCircle } from 'lucide-react';
import { PortalTab } from './navTypes';

interface MobileBottomNavProps {
  activeTab: PortalTab;
  onSelectTab: (tab: PortalTab) => void;
  onOpenMenu?: () => void;
  alertCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  alertCount = 0,
}) => {
  const items: { id: PortalTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'overview', label: 'Home', icon: LayoutDashboard },
    { id: 'ai-guidance', label: 'Chat', icon: MessageCircle },
    { id: 'checklist', label: 'Checklist', icon: FileCheck },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: alertCount },
  ];

  return (
    <nav
      aria-label="Mobile Quick Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-pearl-navy/95 backdrop-blur-md border-t border-pearl-dark grid grid-cols-4 items-center px-1"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-label={`Open ${item.label}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onSelectTab(item.id)}
            className={`min-h-[52px] min-w-0 flex flex-col items-center justify-center gap-1 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pearl-gold ${
              isActive ? 'text-pearl-gold' : 'text-pearl-placeholder hover:text-pearl-text'
            }`}
          >
            <span className="relative">
              <Icon className="w-5 h-5" />
              {item.badge ? <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-1 rounded-full bg-pearl-gold text-pearl-navy text-[9px] font-bold flex items-center justify-center">{item.badge}</span> : null}
            </span>
            <span className="text-[10px] font-semibold tracking-tight leading-none">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
