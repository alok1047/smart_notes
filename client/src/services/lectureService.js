import api from './api';

export const getLectures = async (subjectId) => {
  const res = await api.get(`/lectures/${subjectId}`);
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

export const processNotes = async (lectureId, aiProvider, apiKey) => {
  const res = await api.post(`/lectures/${lectureId}/process`, {
    aiProvider,
    apiKey
  });
  return res.data;
};

export const searchAll = async (query) => {
  const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
  return res.data;
};

