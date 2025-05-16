import { create } from "zustand";
import { persist } from 'zustand/middleware';
import { StrapiResponse, Message, MessageResponse, SendMessageResponse, Sender } from "@/types/type";
import { fetchApi } from '@/lib/fetchApi';

interface ChatStore {
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  setHasMore: (hasMore: boolean) => void;
  activeTab: "friends" | "chats";
  setActiveTab: (tab: "friends" | "chats") => void;


  messages: MessageResponse<Message<Sender>>[];
  addMessage: (message: MessageResponse<Message<Sender>>) => void;
  setMessages: (messages: MessageResponse<Message<Sender>>[]) => void;


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
      messages: [],
      setHasMore: (hasMore: boolean) => set({ hasMore }),

      setActiveTab: (tab) => set({ activeTab: tab }),
      addMessage: (message: MessageResponse<Message<Sender>>) => {
        set((state) => ({ messages: [...state.messages, message] }));
      },
      setMessages: (messages: MessageResponse<Message<Sender>>[]) => set({ messages }),



    sendMessage: async (message: Message<number>): Promise<MessageResponse<Message<Sender>> | null> => {
      set({ isLoading: true, error: null });


      try {
        const response = await fetchApi<SendMessageResponse>(`/chat-messages?populate=sender`, {
          method: 'POST',
          body: JSON.stringify({data: message}),
        }, true);
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
      }, true);
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
