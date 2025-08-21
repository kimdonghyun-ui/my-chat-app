"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";


interface UseAuthStatusReturn {
	isInitialized: boolean;
}

export function useAuthStatus(): UseAuthStatusReturn {
	const { checkAuth } = useAuthStore();
	const [isInitialized, setIsInitialized] = useState(false);
	
	useEffect(() => {
		(async () => {
			await checkAuth();   // ✅ 쿠키에 접근해서 값을 읽어서 setAccessToken 해주기위함
			setIsInitialized(true);       // ✅ 여기서 추가로 처리 가능
		})();
	}, [checkAuth]);
	// 의존성에 user 추가 이유
	// 로그인을 하면 user를 넣어주기때문에 위에 useEffect 가 반응하게 된다.
	// 로그인 성공하자마자 httpOnly 쿠키에 접근이 어려워서 해당 useEffect 를 실행하게되면 쿠키에 접근해서 값을 읽어서 setAccessToken 해주기위함

	return { isInitialized };
}
