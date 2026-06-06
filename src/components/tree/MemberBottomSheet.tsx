/**
 * @file src/components/tree/MemberBottomSheet.tsx
 * @description Native-feeling bottom sheet for member details on mobile devices.
 * Requirement: Provides a high-density metadata view without interrupting the family tree context.
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Users, FileText, Calendar, ExternalLink, UserPlus } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FamilyMember } from './types';
import { useTreeStore } from './store';

interface MemberBottomSheetProps {
  member: FamilyMember | null;
  onClose: () => void;
}

export default function MemberBottomSheet({ member, onClose }: MemberBottomSheetProps) {
  const router = useRouter();
  const setFocusNode = useTreeStore(state => state.setFocusNode);
  const focusNodeId = useTreeStore(state => state.focusNode);
  const setMode = useTreeStore(state => state.setMode);

  if (!member) return null;

  const isFocus = focusNodeId === member.id;
  const displayName = member.preferred_display_name || member.full_name;

  return (
    <AnimatePresence>
      {member && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[400] md:hidden"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-[401] md:hidden px-6 pt-2 pb-8 max-h-[85vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />

            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-indigo-50 shadow-inner relative">
                  {member.avatarUrl ? (
                    <Image src={member.avatarUrl} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-2xl font-bold text-indigo-600">
                      {displayName[0]}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 leading-tight">{displayName}</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                    Generation {member.generation} • {member.status || 'Active'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <MetricCard icon={<Users size={16} />} label="Children" value={member.children_count || 0} color="bg-blue-50 text-blue-600" />
              <MetricCard icon={<FileText size={16} />} label="Stories" value={member.stories_count || 0} color="bg-purple-50 text-purple-600" />
              <MetricCard icon={<Calendar size={16} />} label="Born" value={member.dateOfBirth?.split('-')[0] || 'Unknown'} color="bg-emerald-50 text-emerald-600" />
              <MetricCard icon={<MapPin size={16} />} label="Location" value="Raipur" color="bg-amber-50 text-amber-600" />
            </div>

            <div className="space-y-4">
               {member.bio && (
                 <div className="p-4 bg-slate-50 rounded-2xl">
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Short Bio</h3>
                   <p className="text-sm text-slate-600 leading-relaxed">{member.bio}</p>
                 </div>
               )}

               <div className="flex flex-col gap-3">
                 <div className="flex gap-3">
                    <button 
                      onClick={() => { setFocusNode(isFocus ? null : member.id); onClose(); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm shadow-sm transition-all ${
                        isFocus ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Users size={18} /> {isFocus ? 'Reset' : 'Focus'}
                    </button>
                    <button 
                      onClick={() => { setMode('ADD'); onClose(); }}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-100"
                    >
                      <UserPlus size={18} /> Add Relative
                    </button>
                 </div>
                 <button 
                   onClick={() => router.push(`/members/${member.id}`)}
                   className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm transition-all"
                 >
                   View Full Profile <ExternalLink size={18} />
                 </button>
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MetricCard({ icon, label, value, color }: any) {
  return (
    <div className={`p-3 rounded-2xl flex items-center gap-3 ${color} bg-opacity-40 border border-current border-opacity-10`}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] font-bold uppercase opacity-60 leading-none mb-1">{label}</p>
        <p className="text-sm font-black leading-none">{value}</p>
      </div>
    </div>
  );
}
