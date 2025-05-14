import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { protectedRoutes, authRoutes } from "@/lib/constants/auth";
import { isProtectedRoute } from "@/utils/utils";

export function middleware(request: NextRequest) {
  console.log('middleware 실행');
  const { pathname } = request.nextUrl; // 현재 페이지의 경로
  
  // 새로고치믕을 했을때 middleware 에서 쿠키에 accessToken 토큰 확인
  const token = request.cookies.get('accessToken')?.value;
  const isAuthenticated = !!token; // 토큰이 있으면 true 없으면 false

  const needsAuth = isProtectedRoute(pathname, protectedRoutes, { match: "startsWith" }); // 인증이 필요한 페이지에 접근하려는 경우
  // 인증이 필요한 페이지에 접근하려는 경우
  if (needsAuth) {
    if (!isAuthenticated) {
      const url = new URL('/login', request.url);
      return NextResponse.redirect(url);
    }
  }

  // 이미 인증된 사용자가 로그인 또는 회원가입 페이지 등에 접근하려는 경우
  if (authRoutes.includes(pathname)) {
    if (isAuthenticated) {
      const url = new URL('/friends', request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}


// 미들웨어가 적용될 경로 설정
export const config = {

  matcher: [
    '/',  // 홈(해당 프로젝트에서는 사용안함)
    '/login', // 로그인
    '/register', // 회원가입
    '/profile', // 프로필
    '/friends', // 친구
    '/chats', // 채팅
    //'/transactions/(.*)', // transactions/new 또는 transactions/123/edit 등의 transactions/ 뒤에 뭐가 더붙는 페이지 전부
    
  ],
};