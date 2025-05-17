"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { MessageSquare, X } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import ChatRoomPopup from "@/components/ChatRoomPopup";
import { getRoomTitle, getRoomTitleUserLength } from "@/utils/utils";
import { Room } from "@/types/type";
import { User } from "@/types/auth";
import socket from "@/lib/socket";
import { getTitleFromPath } from "@/utils/utils";
import { usePathname } from "next/navigation";
import { useRoomStore } from "@/store/roomStore";


export default function ChatRoomsList() {
  const [isOpen, setIsOpen] = useState(false); // ✅ 팝업 열기
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null); // ✅ 방 선택
  const [userData, setUserData] = useState<User | null>(null); // ✅ 유저 선택

  const [unreadCount, setUnreadCount] = useState(0);
  const path = usePathname(); // ✅ 경로 가져오기
  const title = getTitleFromPath(path); // ✅ 타이틀 가져오기
  const { user } = useAuthStore(); // ✅ 유저 가져오기

  const rooms = useRoomStore((state) => state.rooms); // ✅ 방 목록 가져오기
  const setHasMore = useChatStore((state) => state.setHasMore); // ✅ 더보기 설정
  const setMessages = useChatStore((state) => state.setMessages); // ✅ 메시지 설정
  const removeFriendFromRoom = useRoomStore((state) => state.removeFriendToRoom); // ✅ 친구 제거

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId),
    [rooms, activeRoomId]
  );

  const handleClose = useCallback(() => setIsOpen(false), []);

  const roomTitle = useMemo(() => selectedRoom ? getRoomTitle(selectedRoom) : "", [selectedRoom]);
  const participantsCount = useMemo(() => selectedRoom ? getRoomTitleUserLength(selectedRoom) : 0, [selectedRoom]);
  

  // ✅ 팝업 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setActiveRoomId(null);
      setUserData(null);
      setHasMore(true);
      setMessages([]);
    }
  }, [isOpen, setHasMore, setMessages]);



// console.log("rooms", rooms);



  // ✅ 방 클릭 시 실행
  const handleRoomClick = useCallback((room: Room) => {
    if (!room || !user) return;

    setActiveRoomId(room.id); // ✅ 방 선택
    setUserData(user); // ✅ 유저 선택
    setIsOpen(true); // ✅ 팝업 열기
    setUnreadCount(room.attributes.unreadCount);
    console.log("unreadCount", unreadCount);
  }, [user]);

  const handleLeaveRoom = useCallback(async (roomId: number) => {
    // useChatStore.getState().leaveRoom(roomId);
    const userId = user?.id;
    if (!userId) return;
    console.log("방 나가기", roomId);
    const updatedRoom = await removeFriendFromRoom(roomId, userId);
    console.log("updatedRoom", updatedRoom);

    // 소켓으로 다른 유저에게 초대 알림 보내기
    socket.emit("room-invite", 'remove', roomId, updatedRoom );
  }, [user, removeFriendFromRoom]);

  return (
    <div className="p-4">
      <h2 className="text-lg font-medium mb-4">{title}</h2>

      <div className="space-y-2">
        {rooms.map((room) => (
          <div 
            key={room.id} 
            className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            <div
              className="flex items-center flex-1 space-x-3 w-full"
              onClick={() => handleRoomClick(room)}
            >
              <MessageSquare className="w-10 h-10 text-gray-400" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="font-medium truncate">{getRoomTitle(room)}</p>
                  {room.attributes.lastMessageTime && (
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {format(room.attributes.lastMessageTime, "a h:mm", { locale: ko })}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center relative">
                  <p className="text-sm text-gray-500 truncate">
                    {room.attributes.lastMessage}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLeaveRoom(room.id)
                    }}
                  >
                    <X />
                  </button>
                  {room.attributes.unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center absolute -left-[26px] -top-[27px]">
                      {room.attributes.unreadCount}
                    </span>
                  )}
                </div>

                {/* ✅ 나가기 버튼 아래에 배치 */}
                {/* <div className="flex justify-end mt-1">

                </div> */}

              </div>
            </div>
          </div>
        ))}
        {rooms.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            채팅방이 없습니다.
          </div>
        )}
      </div>

      {selectedRoom && (
        <ChatRoomPopup
          isOpen={isOpen}
          onClose={handleClose}
          title={roomTitle}
          room={selectedRoom}
          participantsCount={participantsCount}
          activeRoomId={activeRoomId}
          userData={userData}
          unreadCount={unreadCount}
        />
      )}
    </div>
  );
}
