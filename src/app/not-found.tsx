// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 dark:from-gray-900 dark:to-gray-800 text-center px-4">
        <h1 className="text-6xl font-bold text-purple-600 dark:text-purple-400 mb-4">
          404
        </h1>
        <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
          페이지를 찾을 수 없습니다.
        </p>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          존재하지 않는 페이지거나, 주소가 잘못 입력되었습니다.
        </p>
        <Link
          href="/friends"
          className="inline-block bg-purple-600 text-white px-6 py-3 rounded-xl shadow hover:bg-purple-700 transition"
        >
          홈으로 돌아가기
        </Link>
      </div>
    );
}