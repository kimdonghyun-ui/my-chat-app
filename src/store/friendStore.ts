import { fetchApi } from '@/lib/fetchApi';
import { Friend } from '@/types/chat';
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
  PutFriendisOnlineUpdate: (userId: number, isOnline: boolean) => Promise<void>;
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

            //getFriends = 친구 목록 불러오기
            getFriends: async () => {
                try {
                set({ isLoading: true, error: null });
                const response = await fetchApi<Friend[]>(`/users`, { method: 'GET' }, true, false);
                set({ friends: response });
                return response;
                } catch {
                set({ error: '친구 정보를 불러오는데 실패했습니다.' });
                return [];
                } finally {
                set({ isLoading: false });
                }
            },
            setFriends: (friends) => set({ friends }), // ✅ 요거!
            
            PutFriendisOnlineUpdate: async (userId, isOnline) => {
                try {
                    set({ isLoading: true, error: null });
                    await fetchApi<Friend>(`/users/${userId}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            isOnline: isOnline, // ✅ data 없이 바로
                          }),
                      }, true, false);
                } catch {
                    set({ error: '친구 정보를 불러오는데 실패했습니다.' });
                } finally {
                    set({ isLoading: false });
                }
            },


        reset: () => {
            set({
                isLoading: false,
                error: null,
                friends: [],
                onlineUserIds: [],
            });
            useFriendStore.persist.clearStorage();
          },

        // addFriend: (friend: Friend) => set((state) => ({ friends: [...state.friends, friend] })),
        // removeFriend: (friend: Friend) => set((state) => ({ friends: state.friends.filter((f) => f.id !== friend.id) })),
        }),
        {
        name: 'friend-storage',
        }
    )
); 