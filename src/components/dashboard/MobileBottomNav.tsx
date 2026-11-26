import React from 'react';
import {
  Compass,
  FileCheck,
  LayoutDashboard,
  Menu,
  QrCode,
  User,
} from 'lucide-react';
import { PortalTab } from './navTypes';

interface MobileBottomNavProps {
  activeTab: PortalTab;
  onSelectTab: (tab: PortalTab) => void;
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenMenu,
}) => {
  const items: { id: PortalTab | 'menu'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Home', icon: LayoutDashboard },
    { id: 'journey', label: 'Journey', icon: Compass },
    { id: 'checklist', label: 'Checklist', icon: FileCheck },
    { id: 'qr', label: 'QR Pass', icon: QrCode },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'menu', label: 'Menu', icon: Menu },
  ];

  return (
    <nav
      aria-label="Mobile Quick Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-pearl-navy/95 backdrop-blur-md border-t border-pearl-dark grid grid-cols-6 items-center px-1"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.id !== 'menu' && activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-label={item.id === 'menu' ? 'Open more navigation options' : `Open ${item.label}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => {
              if (item.id === 'menu') {
                onOpenMenu();
              } else {
                onSelectTab(item.id);
              }
            }}
            className={`min-h-[52px] min-w-0 flex flex-col items-center justify-center gap-1 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pearl-gold ${
              isActive ? 'text-pearl-gold' : 'text-pearl-placeholder hover:text-pearl-text'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-tight leading-none">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
