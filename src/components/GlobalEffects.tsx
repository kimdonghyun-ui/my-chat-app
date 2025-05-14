// 예시: 클라이언트 전용 로직 처리
'use client'

import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useFriendStore } from '@/store/friendStore';
// import { useChatStore } from '@/store/chatStore';
import socket from '@/lib/socket';
import { waitForSocketConnection } from '@/lib/socketUtils';

export default function ClientHandler() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode); // 다크모드 상태 불러오기
  const { user, accessToken } = useAuthStore();
  const { friends, setFriends, PutFriendisOnlineUpdate } = useFriendStore();


  // ### isDarkMode 상태 변경시 다크모드 설정 (isDarkMode = true,false) ###
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  // ### isDarkMode ###



  // ### 소켓 = 나의 유저 값중에서 isOnline 값을 업데이트 하고 간소화하여 소켓에 데이터 보내기 ###
  useEffect(() => {
    if (!user) return; // ✅ user가 없으면 멈춤

    const runSocket = async () => {

      if (!socket.connected) { // ✅ 소켓이 연결되어있지 않으면 연결
        socket.connect(); // ✅ 소켓 연결
        await waitForSocketConnection(); // ✅ 소켓 연결이 시간이 걸리므로 기다리는 기능인 함수(용도가 기다려주는거임)
        console.log("✅ 소켓 연결됨:", socket.id);
      }
      //##### 이 아래부터는 소켓 연결이 완료되었음 ######

      await PutFriendisOnlineUpdate(user.id, true); // ✅ 침구 목록 중 접속한사람의 isOnline 값 true로 업데이트

      const updatedFriends = await useFriendStore.getState().getFriends();// ✅ 친구 목록 불러오기(위에서 업데이트된 친구목록)
      const simplifiedUsers = updatedFriends.map((friend) => ({ // id, isOnline 값만 보내기(프로필이미지가 base64코드라서 너무길어서 소켓이 받지못하기에 이렇게 간략화 해서 보냄)
        id: friend.id,
        isOnline: friend.isOnline,
      }));
      socket.emit("updated-friends", simplifiedUsers); // 소켓에 데이터 보내기
    };

    runSocket();

    // ✅ 언마운트 처리
    return () => {
      (async () => {
        console.log("🛑 언마운트 - 접속 해제",user);
        await PutFriendisOnlineUpdate(user.id, false); // ✅ 침구 목록 중 접속해제한사람의 isOnline 값 false로  업데이트

        const updatedFriends = await useFriendStore.getState().getFriends();// ✅ 친구 목록 불러오기(위에서 업데이트된 친구목록)
        const simplifiedUsers = updatedFriends.map((friend) => ({ // id, isOnline 값만 보내기(프로필이미지가 base64코드라서 너무길어서 소켓이 받지못하기에 이렇게 간략화 해서 보냄)
          id: friend.id,
          isOnline: friend.isOnline,
        }));
        socket.emit("updated-friends", simplifiedUsers); // 소켓에 데이터 보내기

        socket.disconnect(); // ✅ 소켓 연결 해제
      })();
    };
  }, [user, PutFriendisOnlineUpdate]);
  // ### 소켓 = 나의 유저 값중에서 isOnline 값을 업데이트 하고 간소화하여 소켓에 데이터 보내기 ###

  // ### 소켓 = 위의 코드에서 소켓서버가 받은걸 토스해서 다시 돌려주는거 받는부분 ###
  useEffect(() => {
    const handleUpdatedFriends = (simplifiedUsers: { id: number; isOnline: boolean }[]) => {
      console.log("📡 서버데이터와 토탈 친구데이터:", simplifiedUsers, friends);

      // 위의 코드에서 간소화한걸 다시 원래대로 돌려주는 코드
      const updatedFriends = friends.map((friend) => {
        const found = simplifiedUsers.find((u) => u.id === friend.id);
        if (found) {
          return { ...friend, isOnline: found.isOnline };
        }
        return friend;
      })
      setFriends(updatedFriends) // 스토어 데이터 업데이트 setFriends
    };
    

    socket.on("updated-friends", handleUpdatedFriends); // 소켓에서 되돌려주는거 받는부분

    return () => {
      socket.off("updated-friends", handleUpdatedFriends); // 언마운트시에 위의 소켓 에서 받는 코드 종료
    };
  }, [friends, setFriends]);
  // ### 소켓 = 위의 코드에서 소켓서버가 받은걸 토스해서 다시 돌려주는거 받는부분 ###






  return null;
}
