// lib/socket.ts
import { io, Socket } from "socket.io-client";

const URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:8080";

// ✅ 전역에 socket이 이미 있으면 재사용 (개발 중 중복 방지)
interface CustomGlobal {
  _socket?: Socket;
}

const customGlobal = globalThis as unknown as CustomGlobal;

if (!customGlobal._socket) {
  customGlobal._socket = io(URL, {
    transports: ["websocket"],
    autoConnect: false,
    reconnection: true,
  });
}

const socket: Socket = customGlobal._socket;
socket.on("connect", () => {
  console.log("✅ [프론트] 소켓 연결됨", socket.id);
});

socket.on("disconnect", () => {
  console.log("❌ [프론트] 소켓 해제됨");
});

export default socket;
