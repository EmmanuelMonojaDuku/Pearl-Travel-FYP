import React, { useState } from 'react';
import {
  LayoutDashboard,
  Compass,
  Globe,
  FileCheck,
  ShieldCheck,
  Bot,
  MapPinned,
  QrCode,
  Video,
  User,
  Settings,
  HelpCircle,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  WifiOff,
} from 'lucide-react';
import { PortalTab } from './navTypes';

interface DashboardSidebarProps {
  activeTab: PortalTab;
  isCollapsed: boolean;
  isMobileDrawerOpen: boolean;
  onSelectTab: (tab: PortalTab) => void;
  onOpenSettings: () => void;
  onOpenSupport: () => void;
  onToggleCollapse: () => void;
  onCloseMobileDrawer: () => void;
  onLogout?: () => void;
  missingMandatoryCount: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tab?: PortalTab;
  action?: 'settings';
  badge?: number;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeTab,
  isCollapsed,
  isMobileDrawerOpen,
  onSelectTab,
  onOpenSettings,
  onOpenSupport,
  onToggleCollapse,
  onCloseMobileDrawer,
  onLogout,
  missingMandatoryCount,
}) => {
  const [logoError, setLogoError] = useState(false);

  const primaryNav: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, tab: 'overview' },
    { id: 'journey', label: 'My Journey', icon: Compass, tab: 'journey' },
    { id: 'guidance', label: 'Requirements', icon: Globe, tab: 'guidance' },
    {
      id: 'checklist',
      label: 'Document Checklist',
      icon: FileCheck,
      tab: 'checklist',
      badge: missingMandatoryCount > 0 ? missingMandatoryCount : undefined,
    },
    { id: 'readiness', label: 'Readiness', icon: ShieldCheck, tab: 'readiness' },
    { id: 'ai-guidance', label: 'Travel Assistant', icon: Bot, tab: 'ai-guidance' },
    { id: 'border-guide', label: 'Border Guide', icon: MapPinned, tab: 'border-guide' },
    { id: 'qr', label: 'QR Summary', icon: QrCode, tab: 'qr' },
    { id: 'multimedia', label: 'Multimedia', icon: Video, tab: 'multimedia' },
    { id: 'alerts', label: 'Notifications', icon: Bell, tab: 'alerts' },
    { id: 'offline', label: 'Offline Access', icon: WifiOff, tab: 'offline' },
    { id: 'profile', label: 'My Profile', icon: User, tab: 'profile' },
    { id: 'settings', label: 'Settings', icon: Settings, action: 'settings' },
  ];

  const handleNavClick = (item: NavItem) => {
    if (item.action === 'settings') {
      onOpenSettings();
    } else if (item.tab) {
      onSelectTab(item.tab);
    }
    onCloseMobileDrawer();
  };

  const renderLogo = (compact: boolean) => (
    <div className={`flex items-center transition-all ${compact ? 'justify-center py-2' : 'gap-3 px-3 py-3'}`}>
      {!logoError ? (
        <img
          src="/pearl-travel-logo.png"
          alt="Pearl Travel — Plan, Prepare, Cross"
          onError={() => setLogoError(true)}
          className={`${compact ? 'w-11 h-11' : 'w-14 h-14'} rounded-xl bg-white p-0.5 object-contain shrink-0`}
        />
      ) : (
        <span className="font-heading font-extrabold text-sm text-pearl-text tracking-tight">PT</span>
      )}
      {!compact && (
        <span className="min-w-0">
          <span className="block font-heading font-extrabold text-sm text-pearl-text leading-tight">Pearl Travel</span>
          <span className="block text-[10px] text-pearl-placeholder">Plan · Prepare · Cross</span>
        </span>
      )}
    </div>
  );

  const sidebarContent = (compact: boolean) => (
    <div className="flex flex-col h-full bg-pearl-navy text-pearl-text select-none">
      {/* Brand Header */}
      <div className="px-3.5 pt-4 pb-3 border-b border-pearl-dark flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          {renderLogo(compact)}
          {isMobileDrawerOpen && (
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              aria-label="Close navigation menu"
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-pearl-text-secondary hover:text-pearl-text hover:bg-pearl-dark transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={compact ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
          className="hidden lg:flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-[11px] font-semibold text-pearl-placeholder hover:text-pearl-text hover:bg-pearl-dark transition-colors cursor-pointer"
        >
          {compact ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Collapse Menu</span>
            </>
          )}
        </button>
      </div>

      {/* Primary Navigation */}
      <nav aria-label="Dashboard Navigation" className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1 scrollbar-none">
        {primaryNav.map((item) => {
          const Icon = item.icon;
          const isActive = item.tab ? activeTab === item.tab : false;

          return (
            <button
              key={item.id}
              type="button"
              id={`tab-nav-${item.id}`}
              title={compact ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center ${
                compact ? 'justify-center px-2' : 'justify-between px-3'
              } min-h-[40px] py-2 rounded-xl text-[13px] transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-pearl-gold text-pearl-navy font-bold shadow-xs'
                  : 'text-pearl-text-secondary hover:bg-pearl-dark hover:text-pearl-text font-medium'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-pearl-navy' : 'text-pearl-placeholder'
                  }`}
                />
                {!compact && <span className="truncate">{item.label}</span>}
              </span>

              {!compact && item.badge !== undefined && (
                <span
                  className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums shrink-0 ${
                    isActive
                      ? 'bg-pearl-gold text-pearl-navy font-bold'
                      : 'bg-pearl-danger text-pearl-text'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Utility Section: Contact Support & Sign Out */}
      <div className="px-2.5 py-3 border-t border-pearl-dark space-y-1">
        <button
          type="button"
          id="btn-sidebar-support"
          title={compact ? 'Contact Support' : undefined}
          onClick={() => {
            onOpenSupport();
            onCloseMobileDrawer();
          }}
          className={`w-full flex items-center ${
            compact ? 'justify-center px-2' : 'gap-2.5 px-3'
          } min-h-[40px] py-2 rounded-xl text-[13px] font-medium text-pearl-text-secondary hover:bg-pearl-dark hover:text-pearl-gold-light transition-colors cursor-pointer whitespace-nowrap`}
        >
          <HelpCircle className="w-4 h-4 shrink-0 text-pearl-gold" />
          {!compact && <span>Contact Support</span>}
        </button>

        {onLogout && (
          <button
            type="button"
            id="btn-portal-logout"
            title={compact ? 'Sign Out' : undefined}
            onClick={onLogout}
            className={`w-full flex items-center ${
              compact ? 'justify-center px-2' : 'gap-2.5 px-3'
            } min-h-[40px] py-2 rounded-xl text-[13px] font-medium text-pearl-placeholder hover:bg-pearl-dark hover:text-pearl-danger-light transition-colors cursor-pointer whitespace-nowrap`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!compact && <span>Sign Out</span>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed/Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-r border-pearl-dark sticky top-0 h-screen z-30 transition-all duration-200 ${
          isCollapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        {sidebarContent(isCollapsed)}
      </aside>

      {/* Tablet / Mobile Slide-Over Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-pearl-navy/60 backdrop-blur-xs"
            onClick={onCloseMobileDrawer}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full border-r border-pearl-dark shadow-2xl">
            {sidebarContent(false)}
          </aside>
        </div>
      )}
    </>
  );
};
