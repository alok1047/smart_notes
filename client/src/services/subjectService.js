import api from './api';

export const getSubjects = async () => {
  const res = await api.get('/subjects');
  return res.data;
};

export const createSubject = async (name, lectureCount) => {
  const res = await api.post('/subjects', { name, lectureCount });
  return res.data;
};

export const deleteSubject = async (id) => {
  const res = await api.delete(`/subjects/${id}`);
  return res.data;
};
