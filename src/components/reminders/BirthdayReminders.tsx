'use client'

const MOCK_REMINDERS = [
  { name: 'Ramesh Dewangan', date: 'Feb 10', turns: 72, icon: '🎂' },
  { name: 'Priya Sharma', date: 'Feb 15', turns: 28, icon: '🎉' },
  { name: 'Somu Dewangan', date: 'Feb 22', turns: 30, icon: '🎁' },
]

export default function BirthdayReminders() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>📅</span> Upcoming Birthdays
        </h3>
        <button className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">
          View Calendar
        </button>
      </div>

      <div className="space-y-4">
        {MOCK_REMINDERS.map((reminder, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center text-xl">
                {reminder.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{reminder.name}</p>
                <p className="text-xs text-gray-400 font-medium">Turns {reminder.turns} on {reminder.date}</p>
              </div>
            </div>
            <button className="text-[10px] font-black uppercase tracking-widest text-pink-600 bg-pink-50 px-2 py-1 rounded-md">
              Send Wish
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
