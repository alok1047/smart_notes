import api from './api';

export const importNotionPage = async (token, url) => {
  const res = await api.post('/notion/import', { token, url });
  return res.data;
};
