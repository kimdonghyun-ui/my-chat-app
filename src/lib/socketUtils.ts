// lib/socketUtils.ts
import socket from "./socket";

// ### 소켓 연결 대기해주는 함수 ###
export const waitForSocketConnection = (): Promise<void> => {
  return new Promise((resolve) => {
    if (socket.connected) return resolve();
    socket.on("connect", () => resolve());
  });
};
