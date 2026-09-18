import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getFavorites, addFavorite, removeFavorite, syncFavorites } from '@/api/favorites';
import { useAuthStore } from './useAuthStore';
import { toast } from 'react-hot-toast';

export const useFavoritesStore = create(
    persist(
        (set, get) => ({
            favoriteIds: [],
            favoriteListings: [],
            loading: false,

            /**
             * Check if a listing is currently favorited.
             * Returns false for logged-out users.
             */
            isFavorite: (id) => {
                if (!id) return false;
                const isLoggedIn = useAuthStore.getState().isLoggedIn;
                if (!isLoggedIn) return false;
                const strId = String(id);
                return get().favoriteIds.some(favId => String(favId) === strId);
            },

            /**
             * Toggle favorite status of a listing.
             * Disallowed for logged-out users.
             */
            toggleFavorite: async (listingOrId) => {
                if (!listingOrId) return;

                const isLoggedIn = useAuthStore.getState().isLoggedIn;
                if (!isLoggedIn) {
                    toast.error('Bitte melde dich an, um Inserate zu speichern.', {
                        id: 'fav-login-required',
                        duration: 3500,
                        icon: '🔒'
                    });
                    return;
                }

                const item = typeof listingOrId === 'object' ? listingOrId : { id: listingOrId };
                const id = String(item.id);
                const isFav = get().isFavorite(id);

                if (isFav) {
                    // Remove from favorites
                    set(state => ({
                        favoriteIds: state.favoriteIds.filter(favId => String(favId) !== id),
                        favoriteListings: state.favoriteListings.filter(l => String(l.id) !== id)
                    }));
                    toast.success('Inserat aus Merkzettel entfernt', {
                        id: `fav-${id}`,
                        duration: 2500
                    });

                    try {
                        await removeFavorite(id);
                    } catch (err) {
                        console.error('Failed to sync remove favorite to server:', err);
                    }
                } else {
                    // Add to favorites
                    set(state => ({
                        favoriteIds: [...state.favoriteIds.filter(favId => String(favId) !== id), id],
                        favoriteListings: item.title
                            ? [...state.favoriteListings.filter(l => String(l.id) !== id), item]
                            : state.favoriteListings
                    }));
                    toast.success('Auf Merkzettel gespeichert', {
                        id: `fav-${id}`,
                        duration: 2500
                    });

                    try {
                        await addFavorite(id);
                    } catch (err) {
                        console.error('Failed to sync add favorite to server:', err);
                    }
                }
            },

            /**
             * Fetch fresh favorites from database when user is authenticated
             */
            fetchFavorites: async () => {
                const isLoggedIn = useAuthStore.getState().isLoggedIn;
                if (!isLoggedIn) {
                    set({ favoriteIds: [], favoriteListings: [], loading: false });
                    return;
                }

                set({ loading: true });
                try {
                    const res = await getFavorites();
                    if (res.success) {
                        set({
                            favoriteIds: res.data.favoriteIds || [],
                            favoriteListings: res.data.listings || [],
                            loading: false
                        });
                    } else {
                        set({ loading: false });
                    }
                } catch (err) {
                    console.error('Failed to load favorites from server:', err);
                    set({ loading: false });
                }
            },

            /**
             * Synchronize favorites with server upon login
             */
            syncWithServer: async () => {
                const isLoggedIn = useAuthStore.getState().isLoggedIn;
                if (!isLoggedIn) return;
                get().fetchFavorites();
            },

            /**
             * Explicitly remove an item
             */
            removeFavoriteItem: async (id) => {
                if (!id) return;
                const isLoggedIn = useAuthStore.getState().isLoggedIn;
                if (!isLoggedIn) return;

                const strId = String(id);
                set(state => ({
                    favoriteIds: state.favoriteIds.filter(favId => String(favId) !== strId),
                    favoriteListings: state.favoriteListings.filter(l => String(l.id) !== strId)
                }));
                toast.success('Inserat aus Merkzettel entfernt', {
                    id: `fav-remove-${strId}`
                });

                try {
                    await removeFavorite(strId);
                } catch (err) {
                    console.error('Failed to remove favorite from server:', err);
                }
            },

            /**
             * Clear local favorites (on explicit clear or logout)
             */
            clearFavorites: () => set({ favoriteIds: [], favoriteListings: [] })
        }),
        {
            name: 'campuna-favorites',
            partialize: (state) => ({
                favoriteIds: state.favoriteIds,
                favoriteListings: state.favoriteListings
            })
        }
    )
);

export default useFavoritesStore;
