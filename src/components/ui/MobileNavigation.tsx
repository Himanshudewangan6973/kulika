'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  TreeDeciduous, 
  Image as ImageIcon, 
  ScrollText, 
  Home,
  Search
} from 'lucide-react';
import { useFamilySpaceStore } from '@/store/familySpaceStore';

const mobileNavItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: TreeDeciduous, label: 'Tree', href: '/tree' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: ImageIcon, label: 'Media', href: '/media' },
  { icon: ScrollText, label: 'Stories', href: '/stories' },
];

export default function MobileNavigation() {
  const { currentSpace } = useFamilySpaceStore();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <nav 
      onClick={() => setIsExpanded(!isExpanded)}
      className={`fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 z-[100] flex items-center justify-around md:hidden px-2 shadow-lg transition-all duration-300 ${
        isExpanded ? 'h-24' : 'h-16'
      }`}
    >
      {mobileNavItems.map((item) => {
        const isActive = pathname === item.href;
        const hrefWithCommunity = currentSpace?.id && item.href !== '/' 
          ? `${item.href}?communityId=${currentSpace.id}` 
          : item.href;

        return (
          <Link
            key={item.href}
            href={hrefWithCommunity}
            onClick={(e) => e.stopPropagation()}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all ${
              isActive ? 'text-indigo-600 font-bold' : 'text-slate-400'
            }`}
          >
            <item.icon size={isActive || isExpanded ? 22 : 20} className="transition-all" />
            {isExpanded && (
              <span className="text-[10px] uppercase tracking-wider font-bold animate-in fade-in slide-in-from-bottom-1">
                {item.label}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
