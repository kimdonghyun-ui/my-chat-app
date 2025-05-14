"use client";

import { useEffect } from 'react';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { useRedirectStore } from '@/store/redirectStore';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';


export default function LayoutGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const linkName = useRedirectStore((state) => state.linkName); // 리다이렉트 할 링크 이름 불러오기
  const { isLoading } = useAuthStore();

  // ### linkName 상태 변경시 리다이렉트 처리 (router를 .ts에서 사용못하 므로 해결책으로 사용) (linkName = 리다이렉트 할 링크 이름) ###
  useEffect(() => {
    if (!linkName) { // linkName이 없으면 무시
      return
    }
    
    router.replace(linkName);    
    useRedirectStore.getState().setLinkName(''); //초기화
  }, [linkName, router]);
  // ### linkName ###



  // isInitialized = 인증 상태 확인 (확인전까지는 false이다가 확인되면 true로 변경됨) + 아래 두줄
    //(인증ok상황 = accessToken 을 httpOnly 쿠키에서 불러오고 그걸 스토어에 넣어줘서 로그인 상태 유지)
    //(인증no상황 = accessToken null)
    const { isInitialized } = useAuthStatus();


    // 인증 상태 확인 전까지 로딩 스피너 표시
    if (!isInitialized) {
        return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        );
    }

  return (// 인증 상태 확인 후 아래 내용 노출
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      {children}
    </>
  );
}


