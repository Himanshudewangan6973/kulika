'use client';

import { Share2, Mail, MessageCircle, Copy } from 'lucide-react';
import { useState } from 'react';

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const shareOptions = [
    { 
      label: 'WhatsApp', 
      icon: <MessageCircle size={16} />, 
      onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank') 
    },
    { 
      label: 'Email', 
      icon: <Mail size={16} />, 
      onClick: () => window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + url)}` 
    },
    { 
      label: 'Copy Link', 
      icon: <Copy size={16} />, 
      onClick: () => {
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    }
  ];

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      setIsOpen(!isOpen);
    }
  };
  
  return (
    <div className="relative">
      <button 
        onClick={handleNativeShare} 
        className="flex items-center gap-2 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full font-black hover:bg-indigo-100 transition-all active:scale-95 shadow-sm border border-indigo-100 text-sm"
      >
        <Share2 size={18} />
        Share
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in zoom-in-95 duration-200">
          {shareOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => { opt.onClick(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-sm font-bold text-slate-700 transition-colors"
            >
              <span className="text-slate-400">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
