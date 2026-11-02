import api from './api';

const resource = (path) => ({
  list: (params) => api.get(path, { params }).then((r) => r.data),
  mine: (params) => api.get(`${path}/mine`, { params }).then((r) => r.data),
  create: (payload) => api.post(path, payload).then((r) => r.data),
  update: (id, payload) => api.put(`${path}/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`${path}/${id}`).then((r) => r.data),
});

export const projectsApi = resource('/services/projects');
export const paymentsApi = resource('/services/payments');
export const lettersApi = {
  ...resource('/services/letters'),
  acc: (id, tahap) => api.post(`/services/letters/${id}/acc`, { tahap }).then((r) => r.data),
  reject: (id, alasan) => api.post(`/services/letters/${id}/reject`, { alasan }).then((r) => r.data),
};
export const wargaOptions = (search) =>
  api.get('/services/warga-options', { params: { search } }).then((r) => r.data.data);
export const siteProfile = () => api.get('/public/home').then((r) => r.data.data.settings.site);

export const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
