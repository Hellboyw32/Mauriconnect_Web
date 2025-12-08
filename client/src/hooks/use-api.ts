import { api } from 'src/services/api.service';

export const useApi = (endpoint: string, method: 'GET' | 'POST') => {
  let response = null;
  switch (method) {
    case 'GET':
      response = api.get(endpoint);
  }

  return response;
};
