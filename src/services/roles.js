import api from './api';

export const rolesApi = {
  list: () => api.get('/roles').then((r) => r.data.data),
  permissions: () => api.get('/roles/permissions').then((r) => r.data.data),
  create: (payload) => api.post('/roles', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/roles/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/roles/${id}`).then((r) => r.data),
};

// Warna badge role: bawaan sistem punya warna tetap, role kustom abu-abu.
export const roleBadgeClass = (slug) =>
  ({ admin: 'badge--blue', pengurus: 'badge--amber', warga: 'badge--green' })[slug] || 'badge--gray';
