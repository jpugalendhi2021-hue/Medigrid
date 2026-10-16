import React, { useState } from 'react';
import {
  Bell,
  LogOut,
} from 'lucide-react';
import { useData } from '../store/DataContext';
import { MediGridLogo } from './MediGridLogo';

interface NavbarProps {
  onOpenJavaSpec?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const {
    currentUser,
    currentRole,
    logout,
    notifications,
    clearNotification,
    firebaseUser,
  } = useData();

  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <MediGridLogo size="md" />
          <div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800">
              MediGrid
            </h1>
          </div>
        </div>

        {/* Right: User Account & Notifications */}
        <div className="flex items-center gap-3">
          {/* Notifications Popover (Hidden on Home Page) */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-white"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <span className="text-xs font-bold text-slate-800">Live Network Stream</span>
                    <span className="text-[10px] text-slate-400">{notifications.length} events</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">No events logged yet</div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs flex items-start justify-between gap-2"
                        >
                          <div>
                            <div className="font-semibold text-slate-800">{n.title}</div>
                            <div className="text-slate-600 text-[11px] mt-0.5">{n.message}</div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <button
                            onClick={() => clearNotification(n.id)}
                            className="text-slate-300 hover:text-slate-500 text-xs cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User Profile & Logout (Hidden on Home Page) */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-900 leading-tight flex items-center gap-1.5">
                  <span>{currentUser?.name || 'User'}</span>
                  {firebaseUser && (
                    <span
                      title={`Firebase Verified: ${firebaseUser.email}`}
                      className="px-1.5 py-0.2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-bold font-mono tracking-tight"
                    >
                      Auth
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 capitalize flex items-center gap-1">
                  <span>{currentRole.replace('_', ' ')}</span>
                  {firebaseUser && (
                    <span className="text-[9px] text-slate-400 font-mono">({firebaseUser.email?.split('@')[0]})</span>
                  )}
                </div>
              </div>
              <button
                onClick={logout}
                title="Sign out to unified login"
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition ml-1 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
              <span>PORTAL_GATEWAY</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
