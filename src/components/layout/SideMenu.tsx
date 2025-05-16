"use client";


import { usePathname, useRouter } from 'next/navigation';
import { UserCircle, MessageSquare, Settings, Search, LogOut, User } from "lucide-react";
import DarkModeToggle from "../DarkModeToggle";
import { IconBtn } from "../ui/IconBtn";
import { useAuthStore } from '@/store/authStore';


export function SideMenu() {
  const router = useRouter();
  const path = usePathname();
  const { performLogout } = useAuthStore();

  const handleLogout = async () => {
    await performLogout();
  };

  const isActive = (tab: string) => {
    return path === `/${tab}`;
  };

  return (
    <div className="w-16 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* 상단 검색바 */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <button className="w-full p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
          <Search className="w-6 h-6" />
        </button>
      </div>

      {/* 메인 메뉴 */}
      <div className="flex-1 flex flex-col items-center py-4 space-y-4">

        <IconBtn
          active={isActive("friends")}
          onClick={() => router.push("/friends")}
          icon={<UserCircle />}
          title="친구목록"
        />
        <IconBtn
          active={isActive("rooms")}
          onClick={() => router.push("/rooms")}
          icon={<MessageSquare />}
          title="채팅방"
        />




      </div>

      {/* 하단 설정 메뉴 */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        <DarkModeToggle />
        <IconBtn
          active={isActive("profile")}
          onClick={() => router.push("/profile")}
          icon={<Settings />}
          title="설정"
        />
        <IconBtn
          active={isActive("profile")}
          onClick={() => router.push("/profile")}
          icon={<User />}
          title="프로필"
        />
        <IconBtn
          active={isActive("profile")}
          onClick={handleLogout}
          icon={<LogOut />}
          title="로그아웃"
        />
      </div>
    </div>
  );
}
