import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error handling and session expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && error.response.data?.isExpired) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login?expired=true';
    }
    return Promise.reject(error);
  }
);

// 1. Auth Service
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  updatePassword: (data) => api.put('/auth/update-password', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
};

// 2. User Service
export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (formData) =>
    api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getPeers: (params) => api.get('/users/peers', { params }),
  getFaculties: (params) => api.get('/users/faculty', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
};

// 3. Lab Service
export const labService = {
  getLabs: (params) => api.get('/labs', { params }),
  getLabById: (id) => api.get(`/labs/${id}`),
  getLabAvailability: (id, params) => api.get(`/labs/${id}/availability`, { params }),
};

// 4. Booking Service
export const bookingService = {
  createBooking: (data) => api.post('/bookings', data),
  getMyBookings: (params) => api.get('/bookings/my', { params }),
  getCalendarBookings: (params) => api.get('/bookings/calendar', { params }),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  cancelBooking: (id) => api.delete(`/bookings/${id}`),
  checkIn: (id) => api.put(`/bookings/${id}/checkin`),
  checkOut: (id) => api.put(`/bookings/${id}/checkout`),
};

// 5. Project Service
export const projectService = {
  getProjects: (params) => api.get('/projects', { params }),
  getProjectById: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  uploadAttachment: (id, formData) =>
    api.post(`/projects/${id}/attachment`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  addCollaborator: (id, data) => api.post(`/projects/${id}/collaborators`, data),
  removeCollaborator: (id, userId) => api.delete(`/projects/${id}/collaborators/${userId}`),
};

// 6. Collaboration Service
export const collaborationService = {
  requestCollaboration: (data) => api.post('/collaborations/request', data),
  getIncomingRequests: () => api.get('/collaborations/incoming'),
  getOutgoingRequests: () => api.get('/collaborations/outgoing'),
  acceptRequest: (id) => api.put(`/collaborations/${id}/accept`),
  rejectRequest: (id) => api.put(`/collaborations/${id}/reject`),
  withdrawRequest: (id) => api.put(`/collaborations/${id}/withdraw`),
  addMessage: (id, data) => api.post(`/collaborations/${id}/message`, data),
};

// 7. Notification Service
export const notificationService = {
  getMyNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

// 8. Faculty Service
export const facultyService = {
  getDashboard: () => api.get('/faculty/dashboard'),
  getSchedules: (params) => api.get('/faculty/schedules', { params }),
  getStudents: (params) => api.get('/faculty/students', { params }),
  getRequests: () => api.get('/faculty/requests'),
  approveRequest: (id) => api.put(`/faculty/requests/${id}/approve`),
  rejectRequest: (id, data) => api.put(`/faculty/requests/${id}/reject`, data),
  getPendingStudents: () => api.get('/faculty/pending-students'),
  approveStudent: (id) => api.put(`/faculty/students/${id}/approve`),
  rejectStudent: (id, data) => api.put(`/faculty/students/${id}/reject`, data),
  getReports: () => api.get('/faculty/reports'),
};

// 9. Admin Service
export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  createLab: (data) => api.post('/admin/labs', data),
  updateLab: (id, data) => api.put(`/admin/labs/${id}`, data),
  updateLabSeats: (id, data) => api.put(`/admin/labs/${id}/seats`, data),
  deleteLab: (id) => api.delete(`/admin/labs/${id}`),
  getAllBookings: (params) => api.get('/admin/bookings', { params }),
  getConflicts: () => api.get('/admin/bookings/conflicts'),
  broadcastNotification: (data) => api.post('/admin/notifications/broadcast', data),
};

// 10. Department Service
export const departmentService = {
  getDepartments: (params) => api.get('/departments', { params }),
  getDepartmentById: (id) => api.get(`/departments/${id}`),
  createDepartment: (data) => api.post('/departments', data),
  updateDepartment: (id, data) => api.put(`/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/departments/${id}`),
};

export default api;
