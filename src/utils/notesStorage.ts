import AsyncStorage from '@react-native-async-storage/async-storage';
import { notes as initialMockNotes, lectures as mockLectures, Note } from '../data/mock';
import { notesApi, NoteItem } from '../services/api';

const STORAGE_KEY = '@lectureiq_user_notes';

// In-memory cache
let inMemoryNotes: Note[] | null = null;

function mapApiToNote(item: NoteItem): Note {
  let lectureTitle = item.lecture_title;
  if (!lectureTitle && item.lecture_id) {
    const matchedLecture = mockLectures.find((l) => l.id === item.lecture_id);
    lectureTitle = matchedLecture?.title;
  }
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    lectureId: item.lecture_id || undefined,
    lectureTitle: lectureTitle || undefined,
    color: item.color || '#8EF0A3',
    updatedAt: new Date(item.updated_at || Date.now()),
  };
}

export async function fetchAllNotes(): Promise<Note[]> {
  // 1. Try to fetch from backend API
  try {
    const apiNotes = await notesApi.list();
    if (Array.isArray(apiNotes)) {
      if (apiNotes.length > 0) {
        const parsed = apiNotes.map(mapApiToNote);
        inMemoryNotes = parsed;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)).catch(() => {});
        return parsed;
      } else {
        // Backend returned empty list -> check if we have local notes to upload or show
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const withDates: Note[] = parsed.map((n: any) => ({
              ...n,
              updatedAt: new Date(n.updatedAt || Date.now()),
            }));
            inMemoryNotes = withDates;
            return withDates;
          }
        }
        inMemoryNotes = [];
        return [];
      }
    }
  } catch {
    // API not reachable, fallback to local storage
  }

  // 2. Try AsyncStorage
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const withDates: Note[] = parsed.map((n: any) => ({
          ...n,
          updatedAt: new Date(n.updatedAt || Date.now()),
        }));
        inMemoryNotes = withDates;
        return withDates;
      }
    }
  } catch {}

  // 3. Fallback to initial mock notes only on very first launch
  if (inMemoryNotes === null) {
    inMemoryNotes = [...initialMockNotes];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryNotes)).catch(() => {});
  }
  return inMemoryNotes ?? [];
}

export async function getNoteById(id: string): Promise<Note | undefined> {
  const all = await fetchAllNotes();
  return all.find((n) => n.id === id);
}

export async function persistNote(data: {
  id?: string;
  title: string;
  content: string;
  lectureId?: string;
  color: string;
}): Promise<Note> {
  const all = await fetchAllNotes();
  const cleanLectureId = data.lectureId && data.lectureId.trim() !== '' ? data.lectureId.trim() : undefined;
  const lecture = cleanLectureId
    ? mockLectures.find((l) => l.id === cleanLectureId)
    : undefined;
  const lectureTitle = lecture?.title;

  let savedNote: Note;

  if (data.id) {
    // UPDATE
    const existingIndex = all.findIndex((n) => n.id === data.id);
    savedNote = {
      id: data.id,
      title: data.title.trim(),
      content: data.content,
      lectureId: cleanLectureId,
      lectureTitle,
      color: data.color || '#34D399',
      updatedAt: new Date(),
    };

    if (existingIndex >= 0) {
      all[existingIndex] = savedNote;
    } else {
      all.unshift(savedNote);
    }

    // Try backend API update
    try {
      await notesApi.update(data.id, {
        title: data.title.trim(),
        content: data.content,
        lecture_id: cleanLectureId || null,
        color: data.color,
      });
    } catch {}
  } else {
    // CREATE
    const newId = 'n_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    savedNote = {
      id: newId,
      title: data.title.trim(),
      content: data.content,
      lectureId: cleanLectureId,
      lectureTitle,
      color: data.color || '#34D399',
      updatedAt: new Date(),
    };

    all.unshift(savedNote);

    // Try backend API create
    try {
      const created = await notesApi.create({
        id: newId,
        title: data.title.trim(),
        content: data.content,
        lecture_id: cleanLectureId || null,
        color: data.color,
      });
      if (created?.id) {
        savedNote.id = created.id;
      }
    } catch {}
  }

  inMemoryNotes = [...all];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryNotes)).catch(() => {});
  return savedNote;
}

export async function removeNote(id: string): Promise<void> {
  const all = await fetchAllNotes();
  const filtered = all.filter((n) => n.id !== id);
  inMemoryNotes = filtered;

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered)).catch(() => {});

  try {
    await notesApi.remove(id);
  } catch {}
}
