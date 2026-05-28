import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred';
      const enhancedError = new Error(message) as Error & {
        status?: number;
        data?: unknown;
      };
      enhancedError.status = error.response?.status;
      enhancedError.data = error.response?.data;
      return Promise.reject(enhancedError);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
