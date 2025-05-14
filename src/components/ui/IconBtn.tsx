import React, { ReactElement, cloneElement, isValidElement } from "react";

export function IconBtn({
  onClick,
  icon,
  title,
  active,
}: {
  onClick: () => void;
  icon: ReactElement<{ className?: string }>; // 💡 여기!
  title: string;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-1 sm:p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors ${active ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
      title={title}
    >
      {isValidElement(icon) &&
        cloneElement(icon, {
          className: 'w-4 h-4 sm:w-5 sm:h-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white',
        })}
    </button>
  );
}
