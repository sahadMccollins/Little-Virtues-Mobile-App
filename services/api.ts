import axios from 'axios';

// IMPORTANT: For physical device, replace 127.0.0.1 with your computer's local IP!
const api = axios.create({
  baseURL: 'http://127.0.0.1:3001/api'
});

export const getUser = () => api.get('/user').then(res => res.data);
export const getChild = (id: string) => api.get(`/child/${id}`).then(res => res.data);
export const addActivity = (childId: string, activity: any) => 
  api.post(`/child/${childId}/activity`, activity).then(res => res.data);

export default api;
