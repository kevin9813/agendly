import { Bell } from 'lucide-react'
import { useState } from 'react'

export default function NotificationsMenu() {

  const [open, setOpen] = useState(false)

  const notifications = [
    {
      id: 1,
      title: 'Edit your information in a swipe',
      text: 'Sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim.',
      date: 'Feb 12, 2024'
    },
    {
      id: 2,
      title: 'Edit your information in a swipe',
      text: 'Sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim.',
      date: 'Feb 9, 2024'
    },
    {
      id: 3,
      title: 'Say goodbye to paper receipts!',
      text: 'Sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim.',
      date: 'Jan 24, 2024'
    }
  ]

  return (
    <div className="relative">

      {/* BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="
          relative
          w-10 h-10
          rounded-full
          flex items-center justify-center
          text-slate-400
          hover:text-white
          hover:bg-slate-800
          transition-all
        "
      >

        <Bell size={20} />

        {/* RED DOT */}
        <span
          className="
            absolute top-2 right-2
            w-2 h-2
            bg-red-500
            rounded-full
          "
        />

      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          className="
            absolute right-0 mt-3
            w-[380px]
            bg-slate-800
            border border-slate-700
            rounded-2xl
            shadow-2xl
            overflow-hidden
            z-50
          "
        >

          {/* HEADER */}
          <div
            className="
              px-5 py-4
              border-b border-slate-700
            "
          >
            <p
              className="
                text-xs
                font-semibold
                tracking-widest
                text-slate-400
                uppercase
              "
            >
              Notifications
            </p>
          </div>

          {/* ITEMS */}
          <div className="max-h-[420px] overflow-y-auto">

            {notifications.map((item) => (
              <button
                key={item.id}
                className="
                  w-full
                  text-left
                  px-5 py-4
                  border-b border-slate-700
                  hover:bg-slate-700/40
                  transition-all
                "
              >

                <p
                  className="
                    text-[15px]
                    text-white
                    leading-6
                  "
                >
                  <span className="mr-1">📣</span>

                  <span className="font-semibold">
                    {item.title}
                  </span>

                  <span className="text-slate-300">
                    {' '}
                    {item.text}
                  </span>
                </p>

                <p
                  className="
                    mt-3
                    text-sm
                    text-slate-500
                  "
                >
                  {item.date}
                </p>

              </button>
            ))}

          </div>

        </div>
      )}
    </div>
  )
}