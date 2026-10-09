'use client'

import Link from 'next/link'

/**
 * Agrupa un bloque de ítems de navegación bajo un header colapsable.
 * El estado de colapsado vive en el componente padre (DashboardLayout) para
 * que el sidebar móvil y el de desktop —montados los dos a la vez, solo uno
 * oculto con CSS— compartan el mismo estado y no se desincronicen.
 */
export default function NavCategorySection({
  title,
  items,
  pathname,
  collapsed,
  onToggle,
  textSizeClass = 'text-sm'
}) {
  if (items.length === 0) return null

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
      >
        <span>{title}</span>
        <svg
          className={`h-3.5 w-3.5 transition-transform ${collapsed ? '' : 'rotate-90'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {!collapsed && items.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`${
              isActive
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            } group flex items-center px-2 py-2 ${textSizeClass} font-medium rounded-md`}
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            {item.name}
          </Link>
        )
      })}
    </div>
  )
}
