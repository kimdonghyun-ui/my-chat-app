'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { handleFileUpload } from "@/utils/fileUpload";
import ProfileImage from "@/components/ProfileImage";
import { Pencil, Save, X } from 'lucide-react';

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
    setEditedUser({
      username: user?.username || '',
      email: user?.email || '',
      password: '',
      profileImage: user?.profileImage || ''
    });
  }, [isEditing, user]);

  return (
    <div className="w-full h-full bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-start gap-6">
        {/* 프로필 이미지 */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500">
            {editedUser.profileImage ? (
              <ProfileImage
                svgString={editedUser.profileImage || ""}
                alt={editedUser.username}
                size={96}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-3xl text-gray-400">👤</span>
              </div>
            )}
          </div>
          {isEditing && (
            <label
              htmlFor="profileImage"
              className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 rounded-full p-1 shadow cursor-pointer"
            >
              <Pencil className="w-4 h-4 text-gray-600 dark:text-gray-300" />
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

        {/* 정보 + 수정 */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold dark:text-white">프로필</h2>
              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                    title="저장"
                  >
                    <Save size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="p-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded"
                    title="취소"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
                >
                  <Pencil size={16} className="inline mr-1" />
                  수정
                </button>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-500 dark:text-gray-300">사용자명</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedUser.username}
                  onChange={(e) => setEditedUser(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full mt-1 p-2 rounded border dark:bg-gray-700 dark:text-white"
                  required
                />
              ) : (
                <p className="mt-1 text-lg dark:text-white">{user?.username}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-500 dark:text-gray-300">이메일</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editedUser.email}
                  onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full mt-1 p-2 rounded border dark:bg-gray-700 dark:text-white"
                  required
                />
              ) : (
                <p className="mt-1 text-lg dark:text-white">{user?.email}</p>
              )}
            </div>

            {isEditing && (
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-300">새 비밀번호</label>
                <input
                  type="password"
                  value={editedUser.password}
                  onChange={(e) => setEditedUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="변경하려면 입력하세요"
                  className="w-full mt-1 p-2 rounded border dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            )}

            {error && (
              <div className="text-red-500 text-sm mt-2 bg-red-100 p-2 rounded">
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
