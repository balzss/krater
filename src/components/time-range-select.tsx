import { CalendarFold, ChevronDown } from 'lucide-react'

interface TimeRangeSelectProps {
  value: '1month' | '3month' | '6month' | '12month' | 'overall'
  onChange: (value: '1month' | '3month' | '6month' | '12month' | 'overall') => void
}

export function TimeRangeSelect({ value, onChange }: TimeRangeSelectProps) {
  return (
    <div className="relative inline-flex items-center">
      <CalendarFold className="absolute left-3 pointer-events-none text-gray-600" size={18} />
      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value as '1month' | '3month' | '6month' | '12month' | 'overall')
        }
        className="pl-10 pr-10 py-3 border border-(--border) rounded-lg bg-(--card) text-(--foreground) hover:bg-(--item) cursor-pointer transition appearance-none"
      >
        <option value="1month">Last Month</option>
        <option value="3month">Last 3 Months</option>
        <option value="6month">Last 6 Months</option>
        <option value="12month">Last Year</option>
        <option value="overall">All Time</option>
      </select>
      <ChevronDown className="absolute right-3 pointer-events-none text-gray-600" size={18} />
    </div>
  )
}
