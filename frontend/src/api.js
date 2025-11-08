import axios from 'axios';

const apiClient = axios.create({
  // 使用相对路径，这样在生产环境中请求会自然地发往同一个源
  baseURL: '/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;