import api from './api';

const resource = (path) => ({
  list: (params) => api.get(path, { params }).then((r) => r.data),
  create: (payload) => api.post(path, payload).then((r) => r.data),
  update: (id, payload) => api.put(`${path}/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`${path}/${id}`).then((r) => r.data),
});

export const announcementsApi = resource('/cms/announcements');
export const activitiesApi = resource('/cms/activities');
export const facilitiesApi = resource('/cms/facilities');
export const contactsApi = resource('/cms/contacts');
export const mutationsApi = resource('/cms/official-mutations');
export const cashApi = {
  ...resource('/cms/cash'),
  summary: (bulan) => api.get('/cms/cash/summary', { params: { bulan } }).then((r) => r.data.data),
  categories: () => api.get('/cms/cash/categories').then((r) => r.data.data),
};
export const officialsApi = {
  ...resource('/cms/officials'),
  overview: () => api.get('/cms/officials/overview').then((r) => r.data.data),
  replace: (id, payload) => api.post(`/cms/officials/${id}/replace`, payload).then((r) => r.data),
};

export const settingsApi = {
  get: (key) => api.get(`/cms/settings/${key}`).then((r) => r.data.data),
  save: (key, payload) => api.put(`/cms/settings/${key}`, payload).then((r) => r.data),
  getHome: () => settingsApi.get('home'),
  saveHome: (payload) => settingsApi.save('home', payload),
};

/** Unggah gambar / PDF, mengembalikan URL publiknya. */
export function uploadFile(file) {
  const form = new FormData();
  form.append('file', file);
  return api.post('/cms/uploads', form).then((r) => r.data.url);
}
