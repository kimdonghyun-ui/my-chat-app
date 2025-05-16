'use client';

import { useThemeStore } from '@/store/themeStore';
import { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { IconBtn } from '@/components/ui/IconBtn'; // ✅ 경로는 맞게 수정

export default function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useThemeStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <IconBtn
      onClick={toggleDarkMode}
      title="다크 모드 전환"
      icon={isDarkMode ? <Sun className="text-yellow-500" /> : <Moon className="text-gray-700" />}
      active={isDarkMode}
    />
  );
} 