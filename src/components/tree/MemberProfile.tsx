/**
 * @file src/components/tree/MemberProfile.tsx
 * @description Detailed profile view for a single family member.
 * Requirement: Displays comprehensive member information including bio, media, stories, and claims.
 */

"use client"

import { useState } from 'react'
import Image from 'next/image'
import { Globe } from 'lucide-react'
import MemberMedia from '@/components/members/MemberMedia'
import MemberStories from '@/components/members/MemberStories'
import MemberTimeline from '@/components/members/MemberTimeline'
import { useClaimsQuery } from '@/hooks/useClaimsQuery'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'

interface MemberProfileProps {
  member: any
  media: any[]
  stories: any[]
  events: any[]
  marriages: any[]
}

export default function MemberProfile({ member, media, stories, events, marriages }: MemberProfileProps) {
  const [activeTab, setActiveTab] = useState('bio')
  
  // Fetch claims in the background
  useClaimsQuery(member.id)
  
  const displayName = member.preferred_display_name || member.full_name

  const tabs = [
    { id: 'bio', label: 'Bio' },
    { id: 'relationships', label: 'Relationships' },
    { id: 'photos', label: 'Photos' },
    { id: 'stories', label: 'Stories' },
    { id: 'timeline', label: 'Timeline' },
  ]

  useSwipeGesture(
    () => {
      const currentIndex = tabs.findIndex(t => t.id === activeTab);
      if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1].id);
    },
    () => {
      const currentIndex = tabs.findIndex(t => t.id === activeTab);
      if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1].id);
    }
  );

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">

      {/* Header / Basic Info */}
      <div className="bg-primary p-8 text-white">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 bg-blue-100 rounded-2xl flex items-center justify-center text-primary text-5xl font-bold border-4 border-white/20 shadow-inner overflow-hidden relative">
            {member.profile_photo_url ? (
              <Image 
                src={member.profile_photo_url} 
                alt={displayName} 
                fill 
                className="object-cover"
                sizes="128px"
              />
            ) : (
              displayName?.charAt(0)
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-extrabold">{displayName}</h1>
            {member.nickname && <p className="text-blue-100 text-lg mt-1 italic">&quot;{member.nickname}&quot;</p>}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-sm">
              <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5">
                <Globe size={14} /> {member.community_id || member.community_override || 'Global Community'}
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20">
                Born: {member.date_of_birth || 'Unknown'}
              </span>
              {member.status === 'Deceased' && (
                <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20">
                  Died: {member.date_of_death || 'Unknown'}
                </span>
              )}
              <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20">
                {member.lineage} Side
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20 font-bold">
                Gen {member.generation}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button className="px-6 py-2 bg-white text-primary font-bold rounded-lg hover:bg-blue-50 transition-colors shadow-md">
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 bg-gray-50/50 px-8">
        <nav className="flex gap-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.id === 'photos' && media.length > 0 && <span className="ml-2 bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full text-[10px]">{media.length}</span>}
              {tab.id === 'stories' && stories.length > 0 && <span className="ml-2 bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full text-[10px]">{stories.length}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="p-8 min-h-[400px]">
        {activeTab === 'bio' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-primary">📝</span> Biography Summary
              </h3>
              <p className="text-gray-600 leading-relaxed bg-blue-50/30 p-4 rounded-xl border border-blue-100/50">
                {member.bio_summary || "No biography provided yet. Help us preserve their story by adding a summary."}
              </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-primary">💼</span> Occupation
                </h3>
                <div className="space-y-3">
                  {member.occupations?.length > 0 ? (
                    member.occupations.map((occ: any, i: number) => (
                      <div key={i} className="border-l-2 border-primary/20 pl-4 py-1">
                        <p className="font-bold text-gray-800">{occ.occupation_name}</p>
                        <p className="text-sm text-gray-500">{occ.start_year} - {occ.end_year || 'Present'}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic">No occupation data added.</p>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-primary">🎓</span> Education
                </h3>
                <div className="space-y-3">
                  {member.education?.length > 0 ? (
                    member.education.map((edu: any, i: number) => (
                      <div key={i} className="border-l-2 border-primary/20 pl-4 py-1">
                        <p className="font-bold text-gray-800">{edu.degree}</p>
                        <p className="text-sm text-gray-600">{edu.institution_name}</p>
                        <p className="text-xs text-gray-500">{edu.year_completed}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic">No education data added.</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'relationships' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-primary">👨‍👩‍👧‍👦</span> Family Members
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Parents</p>
                  <div className="space-y-2">
                    <p className="text-gray-800 flex justify-between">
                      <span>Father:</span> <span className="font-semibold text-primary">{member.parent1_name || 'Unknown'}</span>
                    </p>
                    <p className="text-gray-800 flex justify-between">
                      <span>Mother:</span> <span className="font-semibold text-primary">{member.parent2_name || 'Unknown'}</span>
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Marriages</p>
                  {marriages.length > 0 ? (
                    <div className="space-y-2">
                      {marriages.map((m, i) => (
                        <p key={i} className="text-sm">
                          <span className="font-semibold text-primary">
                            {m.spouse1?.full_name === member.full_name ? (m.spouse2?.preferred_display_name || m.spouse2?.full_name) : (m.spouse1?.preferred_display_name || m.spouse1?.full_name)}
                          </span>
                          <span className="text-gray-400 ml-2">({m.marriage_date ? new Date(m.marriage_date).getFullYear() : 'Unknown'})</span>
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="font-semibold text-gray-400">None recorded</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'photos' && <MemberMedia media={media} />}
        {activeTab === 'stories' && <MemberStories stories={stories} />}
        {activeTab === 'timeline' && <MemberTimeline member={member} events={events} marriages={marriages} />}
      </div>
      
      {/* Footer Stats */}
      <div className="bg-gray-50 border-t border-gray-100 px-8 py-4 flex justify-around text-center">
        <div>
          <p className="text-2xl font-bold text-gray-800">{media.length}</p>
          <p className="text-xs font-bold text-gray-400 uppercase">Photos</p>
        </div>
        <div className="border-x border-gray-200 px-8">
          <p className="text-2xl font-bold text-gray-800">{stories.length}</p>
          <p className="text-xs font-bold text-gray-400 uppercase">Stories</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800">{events.length}</p>
          <p className="text-xs font-bold text-gray-400 uppercase">Events</p>
        </div>
      </div>
    </div>
  )
}
