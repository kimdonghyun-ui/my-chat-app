import { create } from "zustand";
import { persist } from 'zustand/middleware';
import { StrapiResponse, Room, PostChatRoom, UpdateRoomResponse } from "@/types/type";
import { fetchApi } from '@/lib/fetchApi';
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

interface RoomStore {
  isLoading: boolean;
  error: string | null;
  rooms: Room[];

  getRooms: () => Promise<void>;
  createRoom: (friendId: number) => Promise<Room | null>;
  addRoom: (room: Room) => void;
  addFriendToRoom: (roomId: number | null, friendId: number) => Promise<Room | null>;
  removeFriendToRoom: (roomId: number | null, friendId: number) => Promise<Room | null>;
  updateLastMessageToRoom: (roomId: number | null, message: string) => Promise<Room | null>;
  roomInvite: (type: 'add' | 'remove', roomId: number, updatedRoom: Room) => Promise<void>;
  reset: () => void;
}

export const useRoomStore = create<RoomStore>()(
    persist(
        (set, get) => ({
            isLoading: false,
            error: null,
            rooms: [],


            // getRooms = 채팅방 목록 불러오기
            getRooms: async () => {
                const { user } = useAuthStore.getState();
                try {
                set({ isLoading: true, error: null });
                const response = await fetchApi<StrapiResponse<Room>>(`/chat-rooms?filters[users_permissions_users][id][$eq]=${user?.id}&populate=users_permissions_users&pagination[pageSize]=100`, { method: 'GET' }, true);
                set({ rooms: response.data });
                } catch {
                set({ error: '채팅방 정보를 불러오는데 실패했습니다.' });
                } finally {
                set({ isLoading: false });
                }
            },


            // createRoom = 채팅방 생성(서버에 추가하는 함수)
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
                
                    get().addRoom(newRoom);
                    
                    console.log("newRoom", newRoom);
                    return newRoom
                } catch {
                    set({ error: '채팅방 생성에 실패했습니다.' });
                    return null
                } finally {
                    console.log("룸", get().rooms);
                }
            },

            // addRoom = 방 추가
            addRoom: (room: Room) => set((state) => ({ rooms: [...state.rooms, room] })),

            // addFriendToRoom = 방에 친구 추가(서버에 추가하는 함수)
            addFriendToRoom:async (roomId: number | null, friendId: number): Promise<Room | null> => {
                try {
                  const response = await fetchApi<UpdateRoomResponse<Room>>(`/chat-rooms/${roomId}?populate=users_permissions_users`, {
                    method: 'PUT',
                    body: JSON.stringify({
                      data: {
                        users_permissions_users: {
                          connect: [friendId]
                        }
                      }
                    }),
                  }, true);
                  toast.success("초대 완료!");
                  await get().getRooms(); // ✅ 채팅방 목록 불러오기
                  return response.data;
                } catch {
                  set({ error: '채팅방 업데이트에 실패했습니다.' });
                  return null;
                }
            },

            // removeFriendToRoom = 방 나가기  addFriendToRoom와는 반대인 셈
            removeFriendToRoom: async (roomId: number | null, friendId: number): Promise<Room | null> => {
                try {
                  const response = await fetchApi<UpdateRoomResponse<Room>>(`/chat-rooms/${roomId}?populate=users_permissions_users`, {
                    method: 'PUT',
                    body: JSON.stringify({
                      data: {
                        users_permissions_users: {
                          disconnect: [friendId],    // ⭐️ disconnect 사용
                        }
                      }
                    }),
                  }, true);
                  toast.success("방 나가기 완료!");
                  await get().getRooms();
                  const updatedRoom = response.data;
                  const friendCount = updatedRoom.attributes.users_permissions_users.data.length;
                  if(friendCount === 1) {
                    //남은 인원이 1명이면 방삭제(서버에서 방 삭제)
                    await fetchApi<UpdateRoomResponse<Room>>(`/chat-rooms/${roomId}`, {
                      method: 'DELETE',
                    }, true);
                  }
                  return updatedRoom;
                } catch {
                  set({ error: '채팅방 삭제에 실패했습니다.' });
                  return null;
                }
            },







            // updateLastMessageToRoom = 방에 마지막 메시지 저장하기
            updateLastMessageToRoom  :async (roomId: number | null, message: string): Promise<Room | null> => {
              try {
                const response = await fetchApi<UpdateRoomResponse<Room>>(`/chat-rooms/${roomId}?populate=users_permissions_users`, {
                  method: 'PUT',
                  body: JSON.stringify({
                    data: {
                      lastMessage: message,
                      lastMessageTime: new Date().toISOString(),
                    }
                  }),
                }, true);
                await get().getRooms(); // ✅ 채팅방 목록 불러오기
                return response.data;
              } catch {
                set({ error: '채팅방 업데이트에 실패했습니다.' });
                return null;
              }
          },








            // roomInvite = 방 초대 수신 처리
            roomInvite: async (type: 'add' | 'remove', roomId: number, updatedRoom: Room) => {
                if(type === 'add') {
                  set((state) => ({
                    rooms: state.rooms.map((room) => 
                      room.id === roomId ? updatedRoom : room
                    ),
                  }));
                }else{
                  console.log("remove", updatedRoom);
                  const friendCount = updatedRoom.attributes.users_permissions_users.data.length;
                  if(friendCount === 1) {
                    //남은 인원이 1명이면 방삭제(스테이트에서 방 삭제)
                    set((state) => ({
                      rooms: state.rooms.filter((room) => room.id !== roomId),
                    }));
                  }else{
                    set((state) => ({
                      rooms: state.rooms.map((room) => 
                        room.id === roomId ? updatedRoom : room
                      ),
                    }));
                  }
                  
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
