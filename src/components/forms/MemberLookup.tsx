'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, User, X } from 'lucide-react';

interface MemberLookupProps {
  label: string;
  onSelect: (id: string, name: string) => void;
  placeholder?: string;
  value?: string;
  onClear: () => void;
}

export default function MemberLookup({ label, onSelect, placeholder, value, onClear }: MemberLookupProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (value) {
      // If we have an ID but no name, we might want to fetch it
      // For now, we assume the parent component handles the name if it's already selected
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchMembers = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        if (!supabase) throw new Error('Supabase not initialized');
        const { data, error } = await supabase
          .from('family_members')
          .select('id, full_name, preferred_display_name, date_of_birth, birth_place')
          .or(`full_name.ilike.%${query}%,preferred_display_name.ilike.%${query}%`)
          .limit(5);

        if (error) throw error;
        setResults(data || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchMembers, 300);
    return () => clearTimeout(timeoutId);
  }, [query, supabase]);

  const handleSelect = (member: any) => {
    const name = member.preferred_display_name || member.full_name;
    setSelectedName(name);
    onSelect(member.id, name);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    setSelectedName(null);
    onClear();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      
      {selectedName ? (
        <div className="flex items-center justify-between px-3 py-2 border border-indigo-200 bg-indigo-50 rounded-md text-indigo-700 font-bold">
          <div className="flex items-center gap-2">
            <User size={16} />
            <span>{selectedName}</span>
          </div>
          <button onClick={handleClear} className="text-indigo-400 hover:text-indigo-600">
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            placeholder={placeholder || "Type to search..."}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          {isLoading && (
            <div className="absolute right-3 top-2.5">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1">
          {results.map((member) => (
            <button
              key={member.id}
              onClick={() => handleSelect(member)}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
            >
              <div className="font-bold text-sm text-slate-800">
                {member.preferred_display_name || member.full_name}
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                {member.date_of_birth && <span>b. {new Date(member.date_of_birth).getFullYear()}</span>}
                {member.birth_place && <span className="truncate">• {member.birth_place}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
