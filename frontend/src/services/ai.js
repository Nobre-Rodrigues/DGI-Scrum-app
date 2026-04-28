import { api } from './api';

export const aiService = {
  async respond(payload) {
    const response = await api.post('/ai/respond', payload);
    return response.data;
  },
};
