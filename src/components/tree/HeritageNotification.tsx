/**
 * @file src/components/tree/HeritageNotification.tsx
 * @description Smart notification system for heritage milestones and community validation.
 * Requirement: Drives engagement by highlighting historical anniversaries and crowdsourced verification needs.
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, History, CheckSquare, X } from 'lucide-react';
import { useTreeStore } from './store';
import { useRouter } from 'next/navigation';
import { useFamilySpaceStore } from '@/store/familySpaceStore';
import { createClient } from '@/lib/supabase/client';

export default function HeritageNotification() {
  const router = useRouter();
  const { currentSpace } = useFamilySpaceStore();
  const setMode = useTreeStore(state => state.setMode);
  
  const [notification, setNotification] = useState<{
    id: string;
    type: 'history' | 'verify';
    message: string;
    actionLabel: string;
  } | null>(null);

  const nodes = useTreeStore(state => state.nodes);

  useEffect(() => {
    const today = new Date();
    const todayStr = `${today.getMonth() + 1}-${today.getDate()}`; // M-D format
    
    // 1. Birthdays
    const birthdayNode = nodes.find(n => {
      if (!n.data.birthDate) return false;
      const bDay = new Date(n.data.birthDate);
      return `${bDay.getMonth() + 1}-${bDay.getDate()}` === todayStr;
    });

    if (birthdayNode) {
      const bYear = new Date(birthdayNode.data.birthDate!).getFullYear();
      const age = today.getFullYear() - bYear;
      setNotification({
        id: `birth-${birthdayNode.id}`,
        type: 'history',
        message: `Exactly ${age} years ago today, your ancestor ${birthdayNode.data.full_name} was born.`,
        actionLabel: 'View Profile'
      });
      return;
    }

    // 2. Real Verification Request
    const checkPending = async () => {
      const supabase = createClient();
      if (!supabase || !currentSpace?.id) return;

      try {
        const { data } = await supabase
          .from('inbox')
          .select('*')
          .eq('status', 'Pending')
          .eq('community_id', currentSpace.id)
          .limit(1);

        if (data && data.length > 0) {
          const item = data[0];
          setNotification({
            id: `verify-${item.id}`,
            type: 'verify',
            message: `A community member added ${item.raw_data.full_name || 'a new record'}. Can you verify this?`,
            actionLabel: 'Verify Now'
          });
        }
      } catch (err) {
        console.warn('Notification check failed:', err);
      }
    };

    const timer = setTimeout(checkPending, 8000);
    return () => clearTimeout(timer);
  }, [nodes, currentSpace?.id]);

  if (!notification) return null;

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 z-[500] p-5 flex gap-4 overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
          
          <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center ${
            notification.type === 'history' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
          }`}>
            {notification.type === 'history' ? <History size={24} /> : <CheckSquare size={24} />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {notification.type === 'history' ? 'Heritage Milestone' : 'Community Validation'}
              </span>
              <button onClick={() => setNotification(null)} className="text-slate-300 hover:text-slate-500">
                <X size={16} />
              </button>
            </div>
            <p className="text-sm font-bold text-slate-800 leading-tight mb-3">
              {notification.message}
            </p>
            <button 
              onClick={() => {
                if (notification.type === 'history') {
                  const memberId = notification.id.split('-')[1];
                  router.push(`/members/${memberId}`);
                } else {
                  setMode('REVIEW');
                }
                setNotification(null);
              }}
              className="text-xs font-black text-indigo-600 flex items-center gap-1 hover:gap-2 transition-all"
            >
              {notification.actionLabel} <Bell size={12} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
