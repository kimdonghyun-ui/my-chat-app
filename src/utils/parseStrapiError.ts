// utils/parseStrapiError.ts

export interface StrapiError {
    error: {
      status: number;
      name: string;
      message: string;
      details: Record<string, unknown>;
    };
  }
  
  export function parseStrapiError(err: unknown, fallback = "요청 실패!") {
    let errorMessage = fallback;
  
    if (err instanceof Error && err.message) {
      try {
        const parsed: StrapiError = JSON.parse(err.message);
        if (parsed?.error?.message) {
          errorMessage = parsed.error.message;
        }
      } catch {
        // JSON 파싱 실패 시 그냥 fallback 사용
      }
    }
  
    return errorMessage;
  }
  