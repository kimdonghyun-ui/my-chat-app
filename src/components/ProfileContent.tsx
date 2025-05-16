'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { handleFileUpload } from "@/utils/fileUpload";
import ProfileImage from "@/components/ProfileImage";


export default function ProfileContent() {
  const { user, handleProfileUpdate } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    profileImage: user?.profileImage || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      try {
        const svgString: string = await handleFileUpload(event);
        setEditedUser(prev => ({ ...prev, profileImage: svgString }));
      } catch (error) {
        console.error("파일 변환 중 오류 발생:", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      setIsEditing(false);
      await handleProfileUpdate(editedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로필 수정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    //수정모드 진입해서 값을 수정하고나서 저장 안누르고 취소한경우 초기화
    setEditedUser({
      username: user?.username || '',
      email: user?.email || '',
      password: '',
      profileImage: user?.profileImage || ''
    });
  }, [isEditing, user]);

  return (

    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <div className="flex flex-col items-center space-y-6">
            {/* 프로필 이미지 */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500">
                {editedUser.profileImage ? (
                  <ProfileImage
                    svgString={editedUser.profileImage || ""}
                    alt={editedUser.username}
                    size={128}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-4xl text-gray-400">👤</span>
                  </div>
                )}
              </div>
              {isEditing && (
                <label
                  htmlFor="profileImage"
                  className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="file"
                    id="profileImage"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>

            {/* 프로필 정보 */}
            <div className="w-full max-w-2xl">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      사용자명
                    </label>
                    <input
                      type="text"
                      value={editedUser.username}
                      onChange={(e) => setEditedUser(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      이메일
                    </label>
                    <input
                      type="email"
                      value={editedUser.email}
                      onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      새 비밀번호
                    </label>
                    <input
                      type="password"
                      value={editedUser.password}
                      onChange={(e) => setEditedUser(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="변경하려면 입력하세요"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  {error && (
                    <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2 px-4 bg-blue-600 text-white font-medium rounded-lg 
                               hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                               focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
                    >
                      {isLoading ? '저장 중...' : '저장'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 font-medium rounded-lg 
                               hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 
                               focus:ring-gray-500 transition-colors duration-200"
                    >
                      취소
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">사용자명</h3>
                    <p className="mt-1 text-lg text-gray-900 dark:text-white">{user?.username}</p>
                  </div>
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">이메일</h3>
                    <p className="mt-1 text-lg text-gray-900 dark:text-white">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg 
                             hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                             focus:ring-blue-500 transition-colors duration-200"
                  >
                    프로필 수정
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 