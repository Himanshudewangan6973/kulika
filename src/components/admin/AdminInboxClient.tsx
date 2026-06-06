'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Database, 
  ChevronRight, 
  Trash2, 
  RotateCcw, 
  MessageSquare,
  History,
  Info
} from 'lucide-react';
import Alert from '@/components/ui/Alert';

interface AdminInboxClientProps {
  initialSubmissions: any[];
}

export default function AdminInboxClient({ initialSubmissions }: AdminInboxClientProps) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [selectedId, setSelectedId] = useState<string | null>(initialSubmissions[0]?.id || null);
  const [loadingAction, setLoadingAction] = useState<{ id: string, type: string } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [viewTab, setViewTab] = useState<'PENDING' | 'PROCESSED'>('PENDING');
  const [reviewComment, setReviewComment] = useState('');

  const filteredSubmissions = submissions.filter(s => 
    viewTab === 'PENDING' ? s.status === 'Pending' || s.status === 'Needs Info' : s.status === 'Approved' || s.status === 'Rejected'
  );

  const selectedSubmission = submissions.find(s => s.id === selectedId);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'request-info' | 'delete') => {
    setLoadingAction({ id, type: action });
    setMessage(null);
    try {
      let method = 'POST';
      let endpoint = '';
      let body = undefined;

      if (action === 'delete') {
        method = 'DELETE';
        endpoint = `/api/admin/inbox/${id}`;
      } else {
        endpoint = `/api/admin/inbox/${id}/${action}`;
        body = JSON.stringify({ reason: reviewComment || `Action: ${action}` });
      }
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text);
        throw new Error(`Server returned an unexpected response (${response.status}). Please try again later.`);
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || result.error || `Failed to ${action}`);
      }

      setMessage({ type: 'success', text: result.message || `Submission ${action}ed successfully` });
      setReviewComment('');
      
      if (action === 'delete') {
        setSubmissions(subs => subs.filter(s => s.id !== id));
        if (selectedId === id) setSelectedId(null);
      } else {
        const newStatus = action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Needs Info';
        setSubmissions(subs => subs.map(s => s.id === id ? { ...s, status: newStatus, review_notes: reviewComment } : s));
      }
    } catch (error: any) {
      console.error(`${action} error:`, error);
      setMessage({ type: 'error', text: error.message || 'Operation failed' });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-220px)] bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden">
      {/* Master List (Left) */}
      <div className="w-full lg:w-96 border-r border-slate-100 flex flex-col bg-slate-50/30">
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="flex bg-slate-50 p-1 rounded-2xl">
            <button 
              onClick={() => setViewTab('PENDING')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                viewTab === 'PENDING' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Clock size={14} /> Pending
            </button>
            <button 
              onClick={() => setViewTab('PROCESSED')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                viewTab === 'PROCESSED' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <History size={14} /> Processed
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
               <Database className="mx-auto mb-4 opacity-20" size={40} />
               <p className="text-xs font-bold uppercase tracking-widest">No {viewTab.toLowerCase()} records</p>
            </div>
          ) : (
            filteredSubmissions.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedId(sub.id)}
                className={`w-full text-left p-6 border-b border-slate-50 transition-all group ${
                  selectedId === sub.id ? 'bg-white shadow-inner' : 'hover:bg-white/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${
                    sub.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                    sub.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                    sub.status === 'Needs Info' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {sub.status}
                  </span>
                  <time className="text-[10px] text-slate-400 font-bold">
                    {new Date(sub.submission_date).toLocaleDateString()}
                  </time>
                </div>
                <h4 className={`font-black text-sm transition-colors ${selectedId === sub.id ? 'text-indigo-600' : 'text-slate-700'}`}>
                  {sub.raw_data?.full_name || sub.raw_data?.title || sub.submission_type}
                </h4>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                  {sub.submission_type}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail View (Right) */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        <AnimatePresence mode="wait">
          {selectedSubmission ? (
            <motion.div 
              key={selectedSubmission.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 overflow-y-auto custom-scrollbar flex flex-col"
            >
              {/* Detail Header */}
              <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-2 block">{selectedSubmission.submission_type}</span>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                        {selectedSubmission.raw_data?.full_name || selectedSubmission.raw_data?.title || 'Unnamed Contribution'}
                      </h2>
                      <div className="flex items-center gap-4 text-xs text-slate-500 font-bold">
                        <span className="flex items-center gap-1"><User size={14} className="text-slate-400" /> {selectedSubmission.submitter_name}</span>
                        <span className="flex items-center gap-1"><Mail size={14} className="text-slate-400" /> {selectedSubmission.submitter_email}</span>
                      </div>
                    </div>
                    
                    {(selectedSubmission.status === 'Pending' || selectedSubmission.status === 'Needs Info') && (
                      <div className="flex items-center gap-3">
                         <button 
                           onClick={() => handleAction(selectedSubmission.id, 'reject')}
                           disabled={!!loadingAction}
                           className="px-6 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-black text-xs hover:bg-rose-100 transition-all flex items-center gap-2 border border-rose-100 disabled:opacity-50"
                         >
                           {loadingAction?.id === selectedSubmission.id && loadingAction?.type === 'reject' ? (
                             <span className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></span>
                           ) : (
                             <><XCircle size={16} /> Reject</>
                           )}
                         </button>
                         <button 
                           onClick={() => handleAction(selectedSubmission.id, 'approve')}
                           disabled={!!loadingAction}
                           className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 disabled:opacity-50"
                         >
                           {loadingAction?.id === selectedSubmission.id && loadingAction?.type === 'approve' ? (
                             <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                           ) : (
                             <><CheckCircle size={16} /> Approve</>
                           )}
                         </button>
                      </div>
                    )}
                 </div>
              </div>

              {/* Advanced Moderation Actions */}
              {(selectedSubmission.status === 'Pending' || selectedSubmission.status === 'Needs Info') && (
                <div className="px-8 py-6 border-b border-slate-50 bg-indigo-50/20">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare size={16} className="text-indigo-600" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-900">Moderator Review Comment</h4>
                    </div>
                    <textarea 
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Add a reason for rejection or details on what information is missing..."
                      className="w-full bg-white border border-indigo-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleAction(selectedSubmission.id, 'request-info')}
                        disabled={!!loadingAction || !reviewComment.trim()}
                        className="px-6 py-2.5 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-black text-xs hover:bg-indigo-50 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {loadingAction?.id === selectedSubmission.id && loadingAction?.type === 'request-info' ? (
                           <span className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <><RotateCcw size={16} /> Send Back / Request Info</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Comparison / Details */}
              <div className="p-8 flex-1">
                 {message && (
                   <div className="mb-8 animate-in slide-in-from-top-4">
                     <Alert type={message.type} message={message.text} />
                   </div>
                 )}

                 {selectedSubmission.review_notes && (
                   <div className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 flex gap-4">
                      <Info className="text-slate-400 shrink-0" size={20} />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Previous Review Note</p>
                        <p className="text-sm text-slate-800 font-bold italic">"{selectedSubmission.review_notes}"</p>
                      </div>
                   </div>
                 )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                       <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Proposed Data</h3>
                       <div className="bg-slate-50 rounded-[24px] border border-slate-100 overflow-hidden">
                          <table className="w-full text-sm">
                             <tbody className="divide-y divide-slate-100">
                                {Object.entries(selectedSubmission.raw_data || {}).map(([key, value]) => (
                                  <tr key={key} className="group">
                                     <td className="px-6 py-4 font-bold text-slate-400 text-[10px] uppercase w-32 bg-slate-100/30">{key.replace(/_/g, ' ')}</td>
                                     <td className="px-6 py-4 text-slate-800 font-black">{String(value)}</td>
                                  </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </div>

                    <div className="space-y-8">
                       <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Context & History</h3>
                       <div className="p-6 border-2 border-dashed border-slate-100 rounded-[24px] flex flex-col items-center justify-center text-center">
                          <Clock className="text-slate-200 mb-4" size={32} />
                          <p className="text-xs text-slate-400 font-bold leading-relaxed max-w-[200px]">
                            No previous records found for this entity. This will be created as a new entry.
                          </p>
                       </div>
                    </div>
                 </div>
              </div>
              
              {/* Danger Zone */}
              <div className="p-8 border-t border-slate-50 bg-slate-50/10 mt-auto">
                 <button 
                   onClick={() => handleAction(selectedSubmission.id, 'delete')}
                   className="text-slate-300 hover:text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
                 >
                   <Trash2 size={14} /> Purge this submission record
                 </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
               <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-200 mb-6">
                  <ChevronRight size={48} />
               </div>
               <h3 className="text-lg font-black text-slate-800">Select a submission</h3>
               <p className="text-slate-400 text-sm mt-2 max-w-[250px]">Choose an entry from the left panel to review details and take action.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
