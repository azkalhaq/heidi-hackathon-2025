'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Plus, 
  Bell, 
  ChevronRight, 
  HelpCircle, 
  User,
  LayoutGrid,
  Users,
  Settings,
  Gift,
  MessageSquare,
  Keyboard
} from 'lucide-react';

interface SidebarProps {
  onViewSessions?: () => void;
}

export default function Sidebar({ onViewSessions }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleViewSessions = () => {
    if (onViewSessions) {
      onViewSessions();
      return;
    }
    router.push('/sessions');
  };
  
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* User Profile */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
            NA
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">Najih Azkalhaq</div>
            <div className="text-sm text-gray-500 truncate">azkalhaq@gmail.com</div>
          </div>
        </div>
      </div>

      {/* New Session Button + Notifications */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex-1">
            <button className="w-full bg-purple-700 hover:bg-purple-800 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <Plus size={18} />
              <span>New session</span>
            </button>
          </Link>
          <button
            className="flex items-center justify-center w-11 h-11 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="px-4 space-y-1">
          <button
            onClick={handleViewSessions}
            className="w-full flex items-center justify-between py-2 px-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
          >
            <span>View sessions</span>
            <ChevronRight size={16} />
          </button>
          <Link 
            href="/" 
            className={`flex items-center py-2 px-3 rounded-lg transition-colors ${
              pathname === '/' 
                ? 'bg-purple-50 text-purple-700 font-medium' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>Tasks</span>
          </Link>
          
          {/* Templates Section */}
          <div className="pt-4 pb-2">
            <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Templates
            </div>
            <div className="mt-2 space-y-1">
              <a href="#" className="flex items-center py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <span>Template library</span>
              </a>
              <a href="#" className="flex items-center py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <span>Community</span>
              </a>
            </div>
          </div>

          <a href="#" className="flex items-center py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <span>Team</span>
          </a>
          <a href="#" className="flex items-center py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <span>Settings</span>
          </a>
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <a href="#" className="flex items-center py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm">
          <Gift size={16} className="mr-2" />
          <span>Earn $50</span>
        </a>
        <a href="#" className="flex items-center py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm">
          <MessageSquare size={16} className="mr-2" />
          <span>Request a feature</span>
        </a>
        <a href="#" className="flex items-center justify-between py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm">
          <div className="flex items-center">
            <Keyboard size={16} className="mr-2" />
            <span>Shortcuts</span>
          </div>
          <span className="text-xs text-gray-400">S</span>
        </a>
        <button className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
          <HelpCircle size={18} />
          <span>Help</span>
        </button>
      </div>
    </div>
  );
}

