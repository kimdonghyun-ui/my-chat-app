import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
	console.log("✅ 쿠키 설정 요청 받음");

	// ✅ 클라이언트에서 전송한 데이터 가져오기 (쿠키 이름, 액션, 토큰)
	const { name, value, action } = await req.json();
	console.log(name, value, action);

	if (!name) {
		return NextResponse.json(
			{ message: "쿠키 이름이 필요합니다." },
			{ status: 400 },
		);
	}

	const cookieStore = await cookies();

	if (action === "set" && value) {
		// ✅ 쿠키 저장
		cookieStore.set(name, value, {
			httpOnly: true,
			secure: false,
			path: "/",
			sameSite: "lax",
			maxAge: 60 * 60 * 24, // 1일 유지
		});

		console.log(`✅ 쿠키 (${name}) 저장 완료!`);
		return NextResponse.json({ message: `쿠키 (${name}) 저장 완료!` });
	} else if (action === "delete") {
		// ✅ 쿠키 삭제
		cookieStore.delete(name);

		console.log(`✅ 쿠키 (${name}) 삭제 완료!`);
		return NextResponse.json({ message: `쿠키 (${name}) 삭제 완료!` });
	}

	return NextResponse.json({ message: "잘못된 요청" }, { status: 400 });
}


// ### 위의 내장 API(HttpOnly 쿠키 제어) ###
// ✅ 2. Next.js API 호출하여 쿠키 저장 (쿠키 이름을 동적으로 전달)
// const resCookie = await fetch("/api/set-cookie", {
//   method: "POST",
//   credentials: "include",
//   headers: { "Content-Type": "application/json" },
//   body: JSON.stringify({
//       name: "accessToken", // ✅ 원하는 쿠키 이름 설정
//       value:jwt,
//       action: "set",
//   }),
// });