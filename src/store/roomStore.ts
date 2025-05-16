import { create } from "zustand";
import { persist } from 'zustand/middleware';
import { StrapiResponse, Room, PostChatRoom, Message, MessageResponse, SendMessageResponse, Sender, UpdateRoomResponse } from "@/types/type";
import { fetchApi } from '@/lib/fetchApi';
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

interface RoomStore {
  isLoading: boolean;
  error: string | null;
  rooms: Room[];

  createRoom: (friendId: number) => Promise<Room | null>;
  reset: () => void;
}

export const useRoomStore = create<RoomStore>()(
    persist(
        (set, get) => ({
            isLoading: false,
            error: null,
            rooms: [],

            // createRoom = 채팅방 생성
            createRoom: async (friendId): Promise<Room | null> => {

                const { user } = useAuthStore.getState();
                const userId = user?.id;
                //user가 없으면 로그인 후 이용해주세요.
                if (!userId) {
                    toast.error("로그인 후 이용해주세요.");
                    return null;
                }


                const { rooms } = get();

                //최대 채팅방 개수 제한
                if (rooms.length >= 100) {
                    toast.error("최대 채팅방 개수를 초과했습니다.");
                    return null;
                }

                //자기 자신과 채팅을 할 수 없음
                if(userId === friendId) {
                    toast.error("자기 자신과 채팅을 할 수 없습니다.");
                    return null
                }

                //existingRoom = 방이 이미 존재하는지 확인
                const existingRoom = rooms.find((room) => {
                    const participantIds = room.attributes.users_permissions_users.data.map((u: { id: number }) => u.id);
                    return participantIds.includes(userId) && participantIds.includes(friendId) && participantIds.length > 1;
                });
                
                if (existingRoom) {
                    toast.error("이미 채팅방이 존재합니다.");
                    return null
                }

                const lastMessageTime = new Date().toISOString();
                const data = {
                    lastMessage: "첫 메시지가 없습니다.",
                    lastMessageTime: lastMessageTime,
                    unreadCount: 0,
                    users_permissions_users: [userId, friendId],
                }

                try {
                    const response = await fetchApi<PostChatRoom<Room>>(`/chat-rooms?populate=users_permissions_users`, { 
                        method: 'POST',
                        body: JSON.stringify({data}), 
                    }, true);
                    
                    const newRoom = response.data
                    
                    set((state) => ({
                        rooms: [...state.rooms, newRoom], // ✅ 기존 배열에 새 방 추가
                    }))
                    
                    console.log("newRoom", newRoom);
                    return newRoom
                } catch {
                    set({ error: '채팅방 생성에 실패했습니다.' });
                    return null
                }
            },



            reset: () => {
                set({
                    isLoading: false,
                    error: null,
                    rooms: [],
                });
                useRoomStore.persist.clearStorage();
            },

        }),
        {
            name: "room-store",
            partialize: () => ({// 이걸 비워두면 persist 사용했어도 로컬스토리지에 저장되지 않음
                // 👉 꼭 필요한 최소한만 저장
                // chatRooms: state.chatRooms.map((room) => ({
                //   id: room.id,
                //   name: room.name,
                // })),
            }),
        }
    )
);
