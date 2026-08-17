// In production (Vercel/Netlify), VITE_API_URL points to the backend (e.g. https://your-api.onrender.com/api)
// In local development or unified deployment, it defaults to '/api'
const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

const getHeaders = () => {
  const token = localStorage.getItem('dueledger_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = (data && data.message) || response.statusText || 'An error occurred';
    if (response.status === 401) {
      localStorage.removeItem('dueledger_token');
      localStorage.removeItem('dueledger_user');
    }
    throw new Error(error);
  }
  return data;
};

export const api = {
  // Auth
  auth: {
    login: async (credentials) => {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      return handleResponse(res);
    },
    register: async (userData) => {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return handleResponse(res);
    },
    getMe: async () => {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    updateProfile: async (profileData) => {
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(profileData),
      });
      return handleResponse(res);
    },
  },

  // Clients
  clients: {
    getAll: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE_URL}/clients${query ? `?${query}` : ''}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    getById: async (id) => {
      const res = await fetch(`${API_BASE_URL}/clients/${id}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    create: async (clientData) => {
      const res = await fetch(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(clientData),
      });
      return handleResponse(res);
    },
    update: async (id, clientData) => {
      const res = await fetch(`${API_BASE_URL}/clients/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(clientData),
      });
      return handleResponse(res);
    },
    delete: async (id) => {
      const res = await fetch(`${API_BASE_URL}/clients/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    getWhatsAppReminder: async (id, templateType = 'standard') => {
      const res = await fetch(`${API_BASE_URL}/clients/${id}/whatsapp-reminder?templateType=${templateType}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  // Payments
  payments: {
    record: async (paymentData) => {
      const res = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(paymentData),
      });
      return handleResponse(res);
    },
    getAll: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE_URL}/payments${query ? `?${query}` : ''}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    update: async (id, paymentData) => {
      const res = await fetch(`${API_BASE_URL}/payments/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(paymentData),
      });
      return handleResponse(res);
    },
    delete: async (id) => {
      const res = await fetch(`${API_BASE_URL}/payments/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  // Dashboard & Summary
  dashboard: {
    getSummary: async () => {
      const res = await fetch(`${API_BASE_URL}/dashboard/summary`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  // Reports
  reports: {
    getReports: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE_URL}/reports${query ? `?${query}` : ''}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },
};
