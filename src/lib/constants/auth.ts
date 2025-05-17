// lib/constants/auth.ts

//인증이 있어야만들어갈수 있는 페이지들(여기다 추가하면됨)
export const protectedRoutes = [
    '/', 
    '/profile',
    '/friends',
    '/rooms',
    // '/dashboard',
    // '/statistics',
    // '/transactions'
];

// 인증된 사용자가 접근하면 리다이렉션할 경로
export const authRoutes = ['/login', '/register'];
