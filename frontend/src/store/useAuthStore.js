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
            login: (userData, accessToken, refreshToken) => {
                set({ isLoggedIn: true, user: userData, accessToken, refreshToken });
                // Automatically sync offline favorites with the user's account in PostgreSQL
                try {
                    import('./useFavoritesStore').then(mod => {
                        mod.useFavoritesStore.getState().syncWithServer();
                    });
                } catch (e) {
                    console.error('Favorites sync on login error:', e);
                }
            },

            /** Called on logout */
            logout: () => {
                set({ isLoggedIn: false, user: null, accessToken: null, refreshToken: null });
                try {
                    import('./useFavoritesStore').then(mod => {
                        mod.useFavoritesStore.getState().clearFavorites();
                    });
                } catch (e) {}
            },
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
