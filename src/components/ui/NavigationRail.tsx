'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  TreeDeciduous, 
  Image as ImageIcon, 
  ScrollText, 
  Hourglass, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  Home,
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTreeStore } from '@/components/tree/store';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: TreeDeciduous, label: 'Family Tree', href: '/tree' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: ImageIcon, label: 'Media Gallery', href: '/media' },
  { icon: ScrollText, label: 'Narratives', href: '/stories' },
  { icon: Hourglass, label: 'Timeline', href: '/timeline' },
  { icon: ShieldCheck, label: 'Admin Panel', href: '/admin/inbox' },
];

export default function NavigationRail() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const setRailExpanded = useTreeStore(state => state.setRailExpanded);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeExpanded = isExpanded || isHovered;

  // Sync global state
  useEffect(() => {
    setRailExpanded(activeExpanded);
  }, [activeExpanded, setRailExpanded]);

  if (!mounted) return null;

  return (
    <motion.div
      initial={false}
      animate={{ width: activeExpanded ? 240 : 80 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-white border-r border-slate-200 z-[900] flex flex-col shadow-xl hidden md:flex transition-all duration-300"
    >
      <div className="p-6 flex items-center justify-between mb-8">
        {activeExpanded ? (
          <span className="text-xl font-black text-slate-900 tracking-tight">
            kulika<span className="text-indigo-600">.</span>
          </span>
        ) : (
          <span className="text-2xl font-black text-indigo-600 mx-auto">k.</span>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
            
          return (
            <Link
              key={item.href}
              href={item.href} // Simplified for now as currentSpace logic is better handled via store
              className={`flex items-center gap-4 p-3 rounded-2xl transition-all group ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className={`shrink-0 ${activeExpanded ? '' : 'mx-auto'}`}>
                <item.icon size={24} />
              </div>
              {activeExpanded && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-bold text-sm whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="m-4 p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-600 transition-all flex items-center justify-center"
      >
        {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
    </motion.div>
  );
}
