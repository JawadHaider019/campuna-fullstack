import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  isLoggedIn: true,
  user: null,
  login: (userData = null) => set({ isLoggedIn: true, user: userData }),
  logout: () => set({ isLoggedIn: false, user: null }),
  setIsLoggedIn: (status) => set({ isLoggedIn: status }),
  toggleLogin: () => set((state) => ({ isLoggedIn: !state.isLoggedIn })),
}));

export default useAuthStore;
