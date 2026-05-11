'use client';

import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { 
  Plus, 
  UserPlus, 
  Heart, 
  ArrowUp, 
  Users, 
  AlertTriangle 
} from 'lucide-react';

interface AddRelativeDropdownProps {
  onSelect: (type: string) => void;
  children: React.ReactNode;
}

export default function AddRelativeDropdown({ onSelect, children }: AddRelativeDropdownProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {children}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content 
          className="min-w-[200px] bg-white rounded-2xl p-2 shadow-2xl border border-gray-100 z-[500] animate-in fade-in zoom-in-95 duration-100"
          sideOffset={5}
        >
          <div className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Add Connection
          </div>
          
          <DropdownMenu.Item 
            onSelect={() => onSelect('parent')}
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg outline-none cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <ArrowUp size={16} /> Add Parent
          </DropdownMenu.Item>

          <DropdownMenu.Item 
            onSelect={() => onSelect('spouse')}
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg outline-none cursor-pointer hover:bg-pink-50 hover:text-pink-600 transition-colors"
          >
            <Heart size={16} /> Add Spouse
          </DropdownMenu.Item>

          <DropdownMenu.Item 
            onSelect={() => onSelect('sibling')}
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg outline-none cursor-pointer hover:bg-green-50 hover:text-green-600 transition-colors"
          >
            <Users size={16} /> Add Sibling
          </DropdownMenu.Item>

          <DropdownMenu.Item 
            onSelect={() => onSelect('child')}
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg outline-none cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
          >
            <UserPlus size={16} /> Add Child
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />

          <DropdownMenu.Item 
            onSelect={() => onSelect('unknown')}
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg outline-none cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <AlertTriangle size={16} /> Unknown Connection
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
