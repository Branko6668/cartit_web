import axios from 'axios';

export function request(config) {
  const instance = axios.create({
    baseURL: 'http://127.0.0.1:8000',
    timeout: 5000,
  });

  instance.interceptors.request.use(
    (config) => {
      // Add any request interceptors here
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => {
      // Handle response data
      return response.data;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return instance(config);
}