import { create } from "zustand";
import { persist } from 'zustand/middleware';
import { StrapiResponse, Room, PostChatRoom, Message, MessageResponse, SendMessageResponse, Sender, UpdateRoomResponse } from "@/types/chat";
import { fetchApi } from '@/lib/fetchApi';
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
interface ChatStore {
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  setHasMore: (hasMore: boolean) => void;
  activeTab: "friends" | "chats";
  setActiveTab: (tab: "friends" | "chats") => void;
  rooms: Room[];
  updateRoom: (roomId: number | null, friendId: number) => Promise<Room | null>;
  removeFriendFromRoom: (roomId: number | null, friendId: number) => Promise<Room | null>;
  roomInvite: (type: 'add' | 'remove', roomId: number, updatedRoom: Room) => Promise<void>;
  messages: MessageResponse<Message<Sender>>[];
  addMessage: (message: MessageResponse<Message<Sender>>) => void;
  setMessages: (messages: MessageResponse<Message<Sender>>[]) => void;
  addRoom: (room: Room) => void;
  getRooms: () => Promise<void>;
  createRoom: (userId: number, friendId: number) => Promise<Room | null>;
  sendMessage: (message: Message<number>) => Promise<MessageResponse<Message<Sender>> | null>;
  getMessages: (roomId: number, page: number) => Promise<void>;
  reset: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      isLoading: false,
      error: null,
      hasMore: true,
      activeTab: "friends",
      rooms: [],
      messages: [],
      setHasMore: (hasMore: boolean) => set({ hasMore }),

      setActiveTab: (tab) => set({ activeTab: tab }),
      addMessage: (message: MessageResponse<Message<Sender>>) => {
        set((state) => ({ messages: [...state.messages, message] }));
      },
      setMessages: (messages: MessageResponse<Message<Sender>>[]) => set({ messages }),
      // setRooms: (rooms) => set({ rooms }), 
      addRoom: (room: Room) => set((state) => ({ rooms: [...state.rooms, room] })),
      getRooms: async () => {
        const { user } = useAuthStore.getState();
        try {
        set({ isLoading: true, error: null });
        const response = await fetchApi<StrapiResponse<Room>>(`/chat-rooms?filters[users_permissions_users][id][$eq]=${user?.id}&populate=users_permissions_users&pagination[pageSize]=100`, { method: 'GET' }, true, false);
        set({ rooms: response.data });
        } catch {
        set({ error: '채팅방 정보를 불러오는데 실패했습니다.' });
        } finally {
        set({ isLoading: false });
        }
    },

    createRoom: async (userId, friendId): Promise<Room | null> => {

      // const { user } = useAuthStore.getState();
      const { rooms } = useChatStore.getState();

      if (rooms.length >= 100) {
        toast.error("최대 채팅방 개수를 초과했습니다.");
        return null;
      }



      //existingRoom = 방이 이미 존재하는지 확인
      const existingRoom = rooms.find((room) => {
        const participantIds = room.attributes.users_permissions_users.data.map((u: { id: number }) => u.id);
        return participantIds.includes(userId) && participantIds.includes(friendId) && participantIds.length > 1;
      });
    

      if(userId === friendId) {
        toast.error("자기 자신과 채팅을 할 수 없습니다.");
        return null
      }


      if (existingRoom) {
        toast.error("이미 채팅방이 존재합니다.");
        return null
      }

      const lastMessageTime = new Date().toISOString();
      const data = {
        lastMessage: "첫 메시지가 없습니다.",
        lastMessageTime: lastMessageTime,
        unreadCount: 0,
        users_permissions_users: [userId, friendId], // ✅ data 없이 바로
      }
      try {
        const response = await fetchApi<PostChatRoom<Room>>(`/chat-rooms?populate=users_permissions_users`, { 
          method: 'POST',
          body: JSON.stringify({data}), 
        }, true, false);
        const newRoom = response.data
        set((state) => ({
          rooms: [...state.rooms, newRoom], // ✅ 기존 배열에 새 방 추가
        }))
        console.log("newRoom", newRoom);

//자꾸 채팅방 추가 하면 다른 유저 화면에도 보이는 문제 해결해야함
        return newRoom

        // const isMeInRoom = newRoom.attributes.users_permissions_users.data.some(
        //   (user) => user.id === userId
        // );
        // if (isMeInRoom) {
        //   return {newRoom,userId}
        // } else {
        //   return null
        // }
        // await useChatStore.getState().getRooms();
      } catch {
        set({ error: '채팅방 생성에 실패했습니다.' });
        return null
      }
    },

    updateRoom: async (roomId: number | null, friendId: number): Promise<Room | null> => {
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
        }, true, false);
        toast.success("초대 완료!");
        await useChatStore.getState().getRooms();
        return response.data;
      } catch {
        set({ error: '채팅방 업데이트에 실패했습니다.' });
        return null;
      }
    },


    removeFriendFromRoom: async (roomId: number | null, friendId: number): Promise<Room | null> => {
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
        }, true, false);
        toast.success("방 나가기 완료!");
        await useChatStore.getState().getRooms();
        const updatedRoom = response.data;
        const friendCount = updatedRoom.attributes.users_permissions_users.data.length;
        if(friendCount === 1) {
          //남은 인원이 1명이면 방삭제(서버에서 방 삭제)
          await fetchApi<UpdateRoomResponse<Room>>(`/chat-rooms/${roomId}`, {
            method: 'DELETE',
          }, true, false);
        }
        return updatedRoom;
      } catch {
        set({ error: '채팅방 삭제에 실패했습니다.' });
        return null;
      }
    },

    

    roomInvite: async (type: 'add' | 'remove', roomId: number, updatedRoom: Room) => {
      // console.log("roomInvite", roomId, updatedRoom);
      // console.log("rooms", useChatStore.getState().rooms);
      console.log("기존 room", useChatStore.getState().rooms.find(r => r.id === roomId));
      console.log("새로운 room", updatedRoom);
      console.log("같음?", useChatStore.getState().rooms.find(r => r.id === roomId) === updatedRoom);
      


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



    sendMessage: async (message: Message<number>): Promise<MessageResponse<Message<Sender>> | null> => {
      set({ isLoading: true, error: null });


      try {
        const response = await fetchApi<SendMessageResponse>(`/chat-messages?populate=sender`, {
          method: 'POST',
          body: JSON.stringify({data: message}),
        });
        const newMessage = response.data
        
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
        console.log('newMessage11', newMessage)
        return newMessage
      } catch {
        set({ error: '메시지 전송에 실패했습니다.' });
        return null
      } finally {
        set({ isLoading: false });
      }
  },

  getMessages: async (roomId, page) => {
    set({ isLoading: true, error: null });
    const pageSize = 20;

    try {

      const response = await fetchApi<StrapiResponse<MessageResponse<Message<Sender>>>>(`/chat-messages?filters[chat_room][id][$eq]=${roomId}&sort=sentAt:desc&pagination[page]=${page}&pagination[pageSize]=20&populate=sender`, { 
        method: 'GET',
      }, true, false);
      const data = response.data.reverse();

      
      if (data.length === pageSize){
        set({ hasMore: true });
      } else {
        set({ hasMore: false });
      }



      set((state) => ({
        // messages: response.data,
        messages: [...data, ...state.messages],
      }));
    } catch {
      set({ error: '메시지 불러오기에 실패했습니다.' });
    } finally {
      set({ isLoading: false });
    }
  },



    reset: () => {
      set({
          isLoading: false,
          error: null,
          hasMore: true,
          activeTab: "friends",
          rooms: [],
          messages: [],
        });
        useChatStore.persist.clearStorage();
      },


    }),
    {
      name: "chat-store",
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
