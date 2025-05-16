"use client";

import ProfileImage from "@/components/ProfileImage";
import { UserCircle } from "lucide-react";
import { useFriendStore } from "@/store/friendStore";
import { useRoomStore } from "@/store/roomStore";
import socket from "@/lib/socket";
import { getTitleFromPath } from "@/utils/utils";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

export default function FriendsList() {
  const { friends } = useFriendStore();
  const { createRoom } = useRoomStore();
  const path = usePathname();
  const title = getTitleFromPath(path);
  const router = useRouter();

  const handleCreateRoom = async (friendId: number) => {
    const newRoom = await createRoom(friendId)
    if (newRoom) {
      socket.emit("new-room", newRoom); // ✅ 여기 추가
      router.push(`/rooms`);
    } else {
      console.error("채팅방 생성 실패");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-medium mb-4">{title}</h2>
      <div className="space-y-2">
        {friends.map((user) => (
          <div
            key={user.id}
            className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
            onClick={() => handleCreateRoom(user.id)}
          >
            <div className="relative">
              {user.profileImage ? (
                <ProfileImage
                  svgString={user.profileImage || ""}
                  alt={user.username}
                  size={40}
                  className="object-cover"
                />
              ) : (
                <UserCircle className="w-10 h-10 text-gray-400" />
              )}
              {user.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{user.username}</p>
              <p className="text-xs text-gray-500">
                {user.isOnline ? "온라인" : "오프라인"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}