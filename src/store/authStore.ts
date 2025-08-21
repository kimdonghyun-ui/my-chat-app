import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Login, LoginResponse, User, Register, ProfileUpdate } from '../types/auth';
import { fetchApi } from "@/lib/fetchApi";
import { toast } from 'react-hot-toast';
import { useRedirectStore } from './redirectStore';
import { useFriendStore } from './friendStore';
import { useChatStore } from './chatStore';
import { useRoomStore } from './roomStore';
import { parseStrapiError } from "@/utils/parseStrapiError";

interface AuthStore {
  error: string | null;
  isLoading: boolean;
  accessToken: string | null;
  user: User | null;

  setIsLoading: (isLoading: boolean) => void;
  setAccessToken: (token: string | null) => void;
  setUser: (data: User) => void;

  // 로그인 처리
  handleLogin: (data: Login) => Promise<void>;
  // 회원가입 처리
  handleRegister: (data: Register) => Promise<void>;
  // 프로필 업데이트 처리
  handleProfileUpdate: (data: ProfileUpdate) => Promise<void>;
  // 로그아웃 처리
  performLogout: () => Promise<void>;
  // 인증 상태 확인
  checkAuth: () => Promise<void>;
  // 스토어 초기화
  reset: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      error: null,
      isLoading: false,
      accessToken: null,
      user: null,
      setIsLoading: (isLoading: boolean) => set({ isLoading }),
     
      setAccessToken: (data) => set({ accessToken: data }),
      
      setUser: (data) => set({ user: data }),

      // handleLogin = 로그인 처리
      handleLogin: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetchApi<LoginResponse>("/auth/local", {
            method: "POST",
            credentials: "include", //httpOnly 쿠키 를 제어하려면 필요
            body: JSON.stringify(data),
          }, false);

          // 로그인 성공시 유저 정보 저장
          const { user } = response;
          set({ user: user });

          // 토큰은 응답값으로 서버에서 주지 않고 httpOnly 쿠키에 저장 해줌
          // httpOnly 쿠키는 바로 접근이 어려우므로
          // useAuthStatus.ts 에서 useEffect 에 user 를 의존하여 실행되게 하고 그안에서 쿠키 토큰을 불러오고 그걸 setAccessToken 에 저장해줌
          await get().checkAuth();
          toast.success('로그인 성공!');
          useRedirectStore.getState().setLinkName('/friends'); // ✅ 로그인 후 리다이렉트 처리

        } catch (err) {
          const errorMessage = parseStrapiError(err, "로그인 실패!");
          toast.error(`"로그인 실패 : "${errorMessage}`);
          set({ error: errorMessage });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      // handleRegister = 회원가입 처리
      handleRegister: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await fetchApi<LoginResponse>("/auth/local/register", {
            method: "POST",
            credentials: "include", //httpOnly 쿠키 를 제어하려면 필요
            body: JSON.stringify(data),
          }, false);
          toast.success('회원가입 성공!');
          await get().handleLogin({ 
            identifier: data.email,
            password: data.password 
          });
        } catch (err) {
          const errorMessage = parseStrapiError(err, "회원가입 실패!");
          toast.error(`"회원가입 실패 : "${errorMessage}`);
          set({ error: errorMessage });
          throw err;

        } finally {
          set({ isLoading: false });
        }
      },

      // handleProfileUpdate = 프로필 업데이트 처리
      handleProfileUpdate: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const user = get().user;
          const response = await fetchApi<User>(`/users/${user?.id}`, {
            method: "PUT",
            credentials: "include", //httpOnly 쿠키 를 제어하려면 필요
            body: JSON.stringify(data),
          }, true);
          console.log("response", response);
          set({ user: response });
          toast.success('프로필 업데이트 성공!');
        } catch (err) {
          const errorMessage = parseStrapiError(err, "프로필 업데이트 실패!");
          toast.error(`"프로필 업데이트 실패 : "${errorMessage}`);
          set({ error: errorMessage });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      // performLogout = 로그아웃 처리
      performLogout: async () => {
        set({ isLoading: true, error: null });
        const user = get().user;
        if (user?.id) {
          await (async () => {
            const socket = (await import("@/lib/socket")).default;
            await useFriendStore.getState().updateFriendOnlineStatus(user.id, false);
            
            const updatedFriends = await useFriendStore.getState().getFriends();
            const simplifiedUsers = updatedFriends.map((friend) => ({
              id: friend.id,
              isOnline: friend.isOnline,
            }));
        
            socket.emit("updated-friends", simplifiedUsers);
          })();
        }

        
        try {
 
          await fetchApi("/auth/logout", {
            method: "POST",
            credentials: "include", //httpOnly 쿠키 를 제어하려면 필요
          }, false,false);

          toast.success('로그아웃 성공!');
        } catch (err) {
          console.log(err);
          //refreshToken 쿠키 삭제(위에 로그아웃 api 실패시를 대비)
          await fetch("/api/set-cookie", {
            method: "POST",
            credentials: "include", //httpOnly 쿠키 를 제어하려면 필요
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "refreshToken",
              action: "delete",
            }),
          });
          toast.success('로그아웃 실패지만 강제로 로그아웃 처리!');
        } finally {
          
          // HttpOnly 쿠키 제거 요청 (Next.js API route)
          //accessToken 쿠키 삭제
          await fetch("/api/set-cookie", {
            method: "POST",
            credentials: "include", //httpOnly 쿠키 를 제어하려면 필요
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "accessToken",
                action: "delete",
            }),
          });

          //##### 스토어 초기화(Zustand) 시작#####
          get().reset(); //useAuthStore = localStorage + 메모리 상태 초기화
          useFriendStore.getState().reset(); //useFriendStore = localStorage + 메모리 상태 초기화
          useChatStore.getState().reset(); //useChatStore = localStorage + 메모리 상태 초기화
          useRoomStore.getState().reset(); //useRoomStore = localStorage + 메모리 상태 초기화
          //##### 스토어 초기화(Zustand) 끝#####

          useRedirectStore.getState().setLinkName('/login'); // 로그인 페이지로 리다이렉트(.ts에서는 router를 사용못하므로 해결책으로 사용)

        }
      },

      // 인증 상태 확인
      checkAuth: async () => {
        try {
          const res = await fetch("/api/auth/status", {
            method: "GET",
            credentials: "include",
          });
    
          
          const data: { token: string | null } = await res.json();
          set({ accessToken: data.token });
        } catch (error) {
          console.error("Auth status check failed:", error);
          set({ accessToken: null, user: null });
        }
      },

      // reset = 스토어 초기화
      reset: () => {
        set({
          accessToken: null,
          user: null,
          error: null,
          isLoading: false,
        });
        useAuthStore.persist.clearStorage();
      },
    }),
    {
      name: 'auth-store',
      //partialize = 이거 내부에 넣는 항목만 로컬스토리지에 저장이 됨(partialize 사용안하면 모든 항목이 저장됨)
      partialize: (state) => ({
        user: state.user,
        // accessToken: state.accessToken, 토큰은 보안성 정보이므로 로컬 스토리지에 저장하지 않음
      }),
    }
  )
);
