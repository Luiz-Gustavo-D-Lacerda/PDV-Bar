import { create } from 'zustand';

const useAuthStore = create((set) => ({
  token: localStorage.getItem('pdv_token') || null,
  user: JSON.parse(localStorage.getItem('pdv_user') || 'null'),
  login: (token, user) => {
    localStorage.setItem('pdv_token', token);
    localStorage.setItem('pdv_user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('pdv_token');
    localStorage.removeItem('pdv_user');
    set({ token: null, user: null });
  },
}));

export default useAuthStore;
