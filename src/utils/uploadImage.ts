import { fetchApi } from "@/lib/fetchApi";

// utils/uploadImage.ts
export async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append("files", file); // files는 Strapi의 필수 필드명
    
    const result = await fetchApi<{ url: string }[]>('/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
    }, true);

    return result[0].url; // ✅ Cloudinary 이미지 URL만 반환
  }
  