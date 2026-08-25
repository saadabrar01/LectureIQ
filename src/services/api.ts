import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getDevHost(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') return ip;
  }
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

// EXPO_PUBLIC_API_URL can override the default (e.g. http://192.168.x.x:8001
// when testing on a physical phone on the same Wi-Fi as the backend).
const DEV_HOST = getDevHost();
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
  username?: string | null;
  bio?: string | null;
  avatar: string;
  avatar_url?: string | null;
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

export function getAvatarUrl(avatarUrl?: string | null): string | undefined {
  if (!avatarUrl) return undefined;
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('data:')) {
    return avatarUrl;
  }
  return `${API_BASE_URL}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
}

export const authApi = {
  getMe: () => request<AuthUser>('/api/auth/me'),
  updateProfile: (data: {
    name?: string;
    username?: string;
    email?: string;
    bio?: string;
    avatar_url?: string;
  }) =>
    request<AuthUser>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  uploadAvatar: async (asset: { uri: string; name?: string; mimeType?: string; file?: File }) => {
    const form = new FormData();
    const fileName = asset.name || 'avatar.jpg';
    const mimeType = asset.mimeType || 'image/jpeg';

    if (Platform.OS === 'web') {
      let blob: Blob | File;
      if (asset.file) {
        blob = asset.file;
      } else {
        const fetched = await fetch(asset.uri);
        blob = await fetched.blob();
      }
      form.append('file', blob, fileName);
    } else {
      form.append('file', {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
      } as unknown as Blob);
    }

    const res = await fetch(`${API_BASE_URL}/api/auth/upload-avatar`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      throw { status: res.status, message: 'Avatar upload failed' } as ApiError;
    }
    return (await res.json()) as { avatar_url: string };
  },
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
  let fileName = asset.name || 'document.pdf';
  const parts = fileName.split('.');
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : '';
  if (!ext || !['pdf', 'docx', 'doc'].includes(ext)) {
    if (asset.mimeType?.includes('word') || asset.mimeType?.includes('officedocument')) {
      fileName = `${fileName}.docx`;
    } else {
      fileName = `${fileName}.pdf`;
    }
  }

  const mimeType =
    asset.mimeType ||
    (fileName.endsWith('.docx') || fileName.endsWith('.doc')
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/pdf');

  const form = new FormData();

  if (Platform.OS === 'web') {
    let blob: Blob | File;
    if (asset.file) {
      blob = asset.file;
    } else if (asset.uri) {
      const fetched = await fetch(asset.uri);
      blob = await fetched.blob();
    } else {
      throw { status: 400, message: 'No file selected or invalid file URI' } as ApiError;
    }
    form.append('file', blob, fileName);
  } else {
    form.append('file', {
      uri: asset.uri,
      name: fileName,
      type: mimeType,
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
  askDocument: (documentId: number, question: string) =>
    request<AskRagResult>(`/api/documents/${documentId}/ask`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
};

// --- Lectures / Library -----------------------------------------------------

export interface LectureItem {
  id: string;
  title: string;
  channel: string;
  url: string;
  duration: number;
  added_at: string;
  status: string;
  thumbnail: string;
  duration_sec: number | null;
}

export interface LectureAskResult {
  answer: string;
  citations: { snippet: string; timestamp_sec: number | null; similarity: number | null }[];
}

export const lecturesApi = {
  list: () => request<LectureItem[]>('/api/lectures'),
  remove: (id: string) => request<void>(`/api/lectures/${id}`, { method: 'DELETE' }),
  askLecture: (lectureId: string, question: string) =>
    request<LectureAskResult>(`/api/lectures/${lectureId}/ask`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
};

// --- Stats ------------------------------------------------------------------

export interface StatsResult {
  videos_processed: number;
  questions_asked: number;
  streak: number;
  minutes_watched: number;
}

export const statsApi = {
  get: () => request<StatsResult>('/api/stats'),
};

