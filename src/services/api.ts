import { Platform } from 'react-native';

// EXPO_PUBLIC_API_URL can override the default (e.g. http://192.168.x.x:8001
// when testing on a physical phone on the same Wi-Fi as the backend).
const DEV_HOST =
  Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? `http://${DEV_HOST}:8001`;

export interface ApiError {
  status: number;
  message: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  avatar: string;
  join_date: string;
  videos_processed: number;
  questions_asked: number;
  streak: number;
  minutes_watched: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
  } catch {
    throw {
      status: 0,
      message: 'Cannot reach the server. Make sure the FastAPI backend is running.',
    } as ApiError;
  }
  const body = (await res.json().catch(() => null)) as { detail?: string } | null;
  if (!res.ok) {
    const detail = body?.detail;
    throw {
      status: res.status,
      message:
        typeof detail === 'string' ? detail : 'Something went wrong. Please try again.',
    } as ApiError;
  }
  return body as T;
}

export const authApi = {
  signUp: (name: string, email: string, password: string) =>
    request<AuthUser>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  signIn: (email: string, password: string) =>
    request<AuthUser>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

// --- Documents / RAG -------------------------------------------------------

export interface IndexedDocument {
  id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  num_pages: number;
  num_chunks: number;
  created_at: string;
}

export interface RagSource {
  document_id: number;
  file_name: string;
  page_numbers: number[];
  best_similarity: number;
  avg_similarity: number;
  chunk_count: number;
}

export interface AskRagResult {
  question: string;
  answer: string;
  answer_source: string;
  sources: RagSource[];
}

async function uploadDocument(asset: {
  uri?: string;
  name?: string;
  mimeType?: string | null;
  file?: File;
}): Promise<{ document_id: number; chunks_stored: number; pages: number }> {
  const form = new FormData();
  if (Platform.OS === 'web' && asset.file) {
    form.append('file', asset.file);
  } else {
    form.append('file', {
      uri: asset.uri,
      name: asset.name ?? 'document.pdf',
      type: asset.mimeType ?? 'application/pdf',
    } as unknown as Blob);
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/upload-doc`, {
      method: 'POST',
      body: form,
    });
  } catch {
    throw {
      status: 0,
      message: 'Cannot reach the server. Make sure the FastAPI backend is running.',
    } as ApiError;
  }
  const body = (await res.json().catch(() => null)) as { detail?: string } | null;
  if (!res.ok) {
    throw {
      status: res.status,
      message:
        typeof body?.detail === 'string'
          ? detailToMessage(body.detail)
          : 'Upload failed. Please try again.',
    } as ApiError;
  }
  return body as { document_id: number; chunks_stored: number; pages: number };
}

function detailToMessage(detail: string): string {
  // Surface the most useful part of backend error strings (e.g. OpenAI quota).
  const parsed = (() => {
    try {
      return JSON.parse(detail);
    } catch {
      return null;
    }
  })();
  return (
    (parsed as { error?: { message?: string } })?.error?.message ??
    (detail.length > 220 ? `${detail.slice(0, 220)}…` : detail)
  );
}

export const documentsApi = {
  list: () => request<IndexedDocument[]>('/api/documents'),
  upload: uploadDocument,
  remove: (id: number) => request<void>(`/api/documents/${id}`, { method: 'DELETE' }),
  ask: (question: string, documentId?: number) =>
    request<AskRagResult>('/api/ask-rag', {
      method: 'POST',
      body: JSON.stringify({
        question,
        ...(documentId != null ? { document_id: documentId } : {}),
      }),
    }),
};
