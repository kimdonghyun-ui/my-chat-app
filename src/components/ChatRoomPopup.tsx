"use client";

import { useState, useEffect, useRef, memo, useMemo } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft } from "lucide-react";
// import ProfileImage from "./ProfileImage";
import { useChatStore } from "@/store/chatStore";
import { User } from "@/types/auth";
import { Message, MessageResponse, Room, Sender } from "@/types/type";
import socket from "@/lib/socket";
import { useFriendStore } from "@/store/friendStore";
import { useRoomStore } from "@/store/roomStore";
import { UserRound } from 'lucide-react';

interface ChatRoomPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  participantsCount: number;
  activeRoomId: number | null;
  userData: User | null;
  room: Room | null;
}

const ChatRoomPopup = ({
  isOpen,
  onClose,
  title,
  participantsCount,
  activeRoomId,
  userData,
  room,
}: ChatRoomPopupProps) => {
  const [input, setInput] = useState("");
  const [page, setPage] = useState(1);
  const { messages, sendMessage, getMessages, hasMore } = useChatStore();
  const { addFriendToRoom } = useRoomStore();
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef<number>(0);
  const [inviteOpen, setInviteOpen] = useState(false);
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  // console.log("room", room)
  const { friends } = useFriendStore();

  // ✅ 최초 채팅방 열릴 때 메시지 1페이지 로드
  useEffect(() => {
    if (activeRoomId && isOpen) {
      setPage(1);
      getMessages(activeRoomId, 1);
    }
  }, [activeRoomId, isOpen, getMessages]);

  // ✅ 위로 스크롤 시 다음 페이지 불러오기 + 스크롤 위치 유지
  useEffect(() => {
    const handleScroll = () => {
      const chatBox = chatBoxRef.current;
      if (!chatBox || !activeRoomId || !hasMore) return;

      if (chatBox.scrollTop === 0) {
        const prevScrollHeight = chatBox.scrollHeight;
        const nextPage = page + 1;

        getMessages(activeRoomId, nextPage).then(() => {
          const newScrollHeight = chatBox.scrollHeight;
          chatBox.scrollTop = newScrollHeight - prevScrollHeight;
          setPage(nextPage);
        });
      }
    };

    const chatBox = chatBoxRef.current;
    chatBox?.addEventListener("scroll", handleScroll);
    return () => chatBox?.removeEventListener("scroll", handleScroll);
  }, [activeRoomId, page, hasMore, getMessages]);

  // ✅ 메시지가 새로 추가되었을 때 하단으로 스크롤
  useEffect(() => {
    if (!isOpen) return;
    const isNewMessageAdded = messages.length > prevMessageCountRef.current;

    if (
      isNewMessageAdded &&
      chatBoxRef.current &&
      chatBoxRef.current.scrollTop > 100
    ) {
      scrollToBottom();
    }

    prevMessageCountRef.current = messages.length;
  }, [messages, isOpen]);

  // ✅ 최초 메시지 로딩 후 자동 스크롤
  useEffect(() => {
    if (isOpen && page === 1 && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isOpen, page]);

  // ✅ 소켓 메시지 수신 처리
  useEffect(() => {
    const handleUpdatedMessages = (
      newMessage: MessageResponse<Message<Sender>>,
      roomId: number
    ) => {
      if (roomId === activeRoomId) {
        useChatStore.getState().addMessage(newMessage);
      }
    };

    socket.on("new-messages", handleUpdatedMessages);
    return () => {
      socket.off("new-messages", handleUpdatedMessages);
    };
  }, [activeRoomId]);

  // inviteCandidates = 초대 팝업에 뜨는 친구 목록인데 현재 룸에 참여된 친구는 제외 시켜는 함수
  const inviteCandidates = useMemo(() => {
    const roomUserIds = room?.attributes.users_permissions_users.data.map(user => user.id) ?? [];
  
    return friends.filter(friend => !roomUserIds.includes(friend.id));
  }, [friends, room]);



  if (!userData || !isOpen) return null;

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage = {
      text: input.trim(),
      sentAt: new Date().toISOString(),
      chat_room: activeRoomId,
      sender: userData.id,
    };

    setInput("");
    const newMessage2 = await sendMessage(newMessage);
    socket.emit("new-messages", newMessage2, activeRoomId);
  };

  const isMine = (sender: Sender) => {
    return sender?.data?.id === userData.id;
  };

  // handleAddFriendToRoom = 친구 추가
  const handleAddFriendToRoom = async (friendId: number) => {
    const updatedRoom = await addFriendToRoom(activeRoomId, friendId)
    console.log("addFriendToRoom", updatedRoom)
    // 소켓으로 다른 유저에게 초대 알림 보내기
    socket.emit("room-invite", 'add', activeRoomId, updatedRoom );
  };



  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-2 border-b">
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 flex items-center"
        >
          <ChevronLeft className="w-6 h-6" />
          <span className="ml-1">뒤로</span>
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-xs text-gray-500">{participantsCount}명 참여</p>
        </div>
        {/* 헤더 우측 */}
        <div className="w-10 flex justify-end items-center">
          <button onClick={() => setInviteOpen(true)} className="text-sm text-blue-500">초대</button>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2" ref={chatBoxRef}>
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 mt-10">아직 메시지가 없습니다</p>
        ) : (
          messages.map((msg, idx) => {
            const mine = isMine(msg.attributes.sender);
            const sender = msg.attributes.sender?.data.attributes;

            return (
              <div
                key={idx}
                className={`flex items-start gap-2 ${
                  mine ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* <ProfileImage
                  svgString={sender?.profileImage || ""}
                  alt={sender?.username}
                  size={40}
                  className="object-cover rounded-full overflow-hidden"
                /> */}
                <UserRound
                  size={40}
                  className="rounded-full bg-gray-300 text-white p-2"
                />
                <div
                  className={`flex flex-col max-w-[75%] ${
                    mine ? "items-end" : "items-start"
                  }`}
                >
                  <p className="text-sm text-gray-500">{sender?.username}</p>
                  <div
                    className={`flex items-end gap-1 ${
                      mine ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <p
                      className={`text-sm break-all rounded-lg px-3 py-2 ${
                        mine
                          ? "bg-blue-500 text-white self-end"
                          : "bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
                      }`}
                    >
                      {msg.attributes.text}
                    </p>
                    {msg.attributes.sentAt && (
                      <span className="text-xs text-gray-400 min-w-[60px]">
                        {format(new Date(msg.attributes.sentAt), "a h:mm", {
                          locale: ko,
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyUp={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="메시지를 입력하세요"
          className="flex-1 border rounded-lg p-2 text-sm dark:bg-gray-800 dark:text-white"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
        >
          전송
        </button>
      </div>



      {inviteOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white p-4 rounded-lg w-64">
            <h3 className="text-lg font-bold mb-2">친구 추가</h3>
            {inviteCandidates.map((friend) => (
              <div key={friend.id} className="flex justify-between items-center mb-2">
                <p>{friend.username}</p>
                <button
                  className="text-sm text-blue-500"
                  onClick={() => handleAddFriendToRoom(friend.id)}
                >
                  초대
                </button>
              </div>
            ))}
            <button onClick={() => setInviteOpen(false)} className="text-red-500 mt-2">닫기</button>
          </div>
        </div>
      )}



    </div>
  );
}
export default memo(ChatRoomPopup);