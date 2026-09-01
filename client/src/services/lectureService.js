import api from './api';
import { getIdToken } from './googleAuth';

export const getLectures = async (subjectId) => {
  const res = await api.get(`/lectures/${subjectId}`);
  return res.data;
};

export const getSingleLecture = async (lectureId) => {
  const res = await api.get(`/lectures/single/${lectureId}`);
  return res.data;
};

export const saveRawNotes = async (lectureId, rawNotes) => {
  const res = await api.put(`/lectures/${lectureId}`, { rawNotes });
  return res.data;
};

export const saveProcessedNotes = async (lectureId, processedNotes) => {
  const res = await api.put(`/lectures/${lectureId}`, { processedNotes });
  return res.data;
};

export const updateLectureTitle = async (lectureId, title) => {
  const res = await api.put(`/lectures/${lectureId}`, { title });
  return res.data;
};

export const addLecture = async (subjectId) => {
  const res = await api.post(`/lectures/${subjectId}`);
  return res.data;
};

export const deleteLecture = async (lectureId) => {
  const res = await api.delete(`/lectures/single/${lectureId}`);
  return res.data;
};

export const processNotes = async (lectureId, aiProvider, apiKey, options = {}) => {
  const res = await api.post(`/lectures/${lectureId}/process`, {
    aiProvider,
    apiKey,
    options
  });
  return res.data;
};

export const streamProcessNotes = async (lectureId, aiProvider, apiKey, options, onChunk, onComplete, onError, onStage) => {
  try {
    const token = await getIdToken();
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const response = await fetch(`${baseUrl}/lectures/${lectureId}/process-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ aiProvider, apiKey, options }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to stream response');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const data = JSON.parse(jsonStr);
            if (data.chunk) {
              accumulatedText += data.chunk;
              if (onChunk) onChunk(data.chunk, accumulatedText);
            }
            if (data.stage) {
              if (onStage) onStage(data.stage);
            }
            if (data.done) {
              if (onComplete) onComplete(data.fullText || accumulatedText);
            }
            if (data.error) {
              if (onError) onError(new Error(data.error));
            }
          } catch (e) {
            console.error('SSE parse error:', e);
          }
        }
      }
    }
  } catch (error) {
    if (onError) onError(error);
  }
};

export const uploadLectureFile = async (lectureId, file, apiKey = '', forceOcr = false) => {
  const formData = new FormData();
  formData.append('file', file);
  if (apiKey) formData.append('apiKey', apiKey);
  if (forceOcr) formData.append('forceOcr', 'true');

  const res = await api.post(`/lectures/${lectureId}/import-file`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const searchAll = async (query) => {
  const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
  return res.data;
};

export const getRecentLectures = async () => {
  const res = await api.get('/lectures/recent/all');
  return res.data;
};

export const getLectureVersions = async (lectureId) => {
  const res = await api.get(`/lectures/${lectureId}/versions`);
  return res.data;
};

export const deleteLectureVersion = async (versionId) => {
  const res = await api.delete(`/lectures/versions/${versionId}`);
  return res.data;
};

export const chatWithNotes = async (subjectId, query, aiProvider, apiKey = '', model = '') => {
  const res = await api.post('/ai/chat', { subjectId, query, aiProvider, apiKey, model: model || undefined });
  return res.data;
};
