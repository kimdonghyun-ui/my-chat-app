import { fetchApi } from '@/lib/fetchApi';
import { Friend } from '@/types/type';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FriendState {
    isLoading: boolean;
    error: string | null;
    friends: Friend[];
    onlineUserIds: number[];
    setOnlineUserIds: (ids: number[]) => void;
    getFriends: () => Promise<Friend[]>;
    setFriends: (friends: Friend[]) => void;
    updateFriendOnlineStatus: (userId: number, isOnline: boolean) => Promise<void>;
    reset: () => void;
}

export const useFriendStore = create<FriendState>()(
    persist(
        (set) => ({
            isLoading: false,
            error: null,
            friends: [],
            onlineUserIds: [],
            setOnlineUserIds: (ids: number[]) => set({ onlineUserIds: ids }),

            //getFriends = 친구 목록 서버에서 불러오기
            getFriends: async () => {
                set({ isLoading: true, error: null });
                
                try {
                    const response = await fetchApi<Friend[]>(`/users`, { method: 'GET' }, false, false);
                    set({ friends: response });
                    return response;
                } catch {
                    set({ error: '친구 정보를 불러오는데 실패했습니다.' });
                    return [];
                } finally {
                    set({ isLoading: false });
                }
            },

            //setFriends = 친구 목록 덮어쓰기
            setFriends: (friends) => set({ friends }), // ✅ 요거!
            
            //updateFriendOnlineStatus = 친구 접속상태 업데이트
            updateFriendOnlineStatus: async (userId, isOnline) => {
                set({ isLoading: true, error: null });
                
                try {
                    await fetchApi<Friend>(`/users/${userId}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            isOnline: isOnline, // ✅ data 없이 바로
                        }),
                    }, false, false);
                } catch {
                    set({ error: '친구 정보를 불러오는데 실패했습니다.' });
                } finally {
                    set({ isLoading: false });
                }
            },

            //reset = 스토어 초기화
            reset: () => {
                set({
                    isLoading: false,
                    error: null,
                    friends: [],
                    onlineUserIds: [],
                });
                useFriendStore.persist.clearStorage();
            },
        }),
        {
            name: 'friend-storage',
        }
    )
);