import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set) => ({
            isLoggedIn: false,
            user: null,
            accessToken: null,
            refreshToken: null,

            /** Called after successful login */
            login: (userData, accessToken, refreshToken) =>
                set({ isLoggedIn: true, user: userData, accessToken, refreshToken }),

            /** Called on logout */
            logout: () =>
                set({ isLoggedIn: false, user: null, accessToken: null, refreshToken: null }),
        }),
        {
            name: 'campuna-auth', // persisted in localStorage
            partialise: (state) => ({
                isLoggedIn: state.isLoggedIn,
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
            }),
        }
    )
);

export default useAuthStore;
