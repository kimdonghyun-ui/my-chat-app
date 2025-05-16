import { User } from "./auth";



export interface TransactionPostAttributes {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  memo: string;
  date: string;
  users_permissions_user: string;
}


export interface StrapiResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}









//#####
export interface Friend {
  id: number;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
  profileImage: string;
  isOnline: boolean;
}
export interface GetFriendCheck {
  id: number;
  attributes: FriendCheck;
}
export interface FriendCheck {
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  // isOnline: boolean;
  lastOnlineAt: string;
  users_permissions_user: {
    data: {
      id: number;
    };
  };
}


export interface PostChatRoom<T> {
  data: T
}

export interface Room {
  id: number;
  attributes: {
    // name: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    users_permissions_users: {
      data: {
        id: number;
        attributes: User;
      }[]
    };
  },
}

export interface PostChatMessage {
  data: {
    text: string;
    sentAt: string;
    chat_room: number;
    sender: number;
  }
}


export type Sender = {
  data: {
    id: number;
    attributes: User;
  }
}

export type Message<T> = {
  text: string;
  sentAt: string;
  chat_room: number | null;
  sender: T; // ✅ 선택적 필드로 설정
};

export interface MessageResponse<T> {
  id: number;
  attributes: T;
}

export interface SendMessageResponse {
  data: MessageResponse<Message<Sender>>;
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface UpdateRoomResponse<T> {
  data: T;
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}