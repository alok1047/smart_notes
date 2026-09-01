import api from './api';

export const getTryStatus = async (anonymousId) => {
  const res = await api.post('/try/status', { anonymousId });
  return res.data;
};

export const processTry = async (anonymousId, source, url, text) => {
  const res = await api.post('/try/process', { anonymousId, source, url, text });
  return res.data;
};