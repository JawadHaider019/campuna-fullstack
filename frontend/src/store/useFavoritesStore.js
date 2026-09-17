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
             * Check if a listing is currently favorited
             */
            isFavorite: (id) => {
                if (!id) return false;
                const strId = String(id);
                return get().favoriteIds.some(favId => String(favId) === strId);
            },

            /**
             * Toggle favorite status of a listing (optimistic + persistent + server sync)
             */
            toggleFavorite: async (listingOrId) => {
                if (!listingOrId) return;

                const item = typeof listingOrId === 'object' ? listingOrId : { id: listingOrId };
                const id = String(item.id);
                const isFav = get().isFavorite(id);
                const isLoggedIn = useAuthStore.getState().isLoggedIn;

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

                    if (isLoggedIn) {
                        try {
                            await removeFavorite(id);
                        } catch (err) {
                            console.error('Failed to sync remove favorite to server:', err);
                        }
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

                    if (isLoggedIn) {
                        try {
                            await addFavorite(id);
                        } catch (err) {
                            console.error('Failed to sync add favorite to server:', err);
                        }
                    }
                }
            },

            /**
             * Fetch fresh favorites from database when user is authenticated
             */
            fetchFavorites: async () => {
                const isLoggedIn = useAuthStore.getState().isLoggedIn;
                if (!isLoggedIn) return;

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
             * Synchronize local favorites with server upon login
             */
            syncWithServer: async () => {
                const isLoggedIn = useAuthStore.getState().isLoggedIn;
                const localIds = get().favoriteIds;
                if (!isLoggedIn) return;

                if (localIds.length > 0) {
                    try {
                        const res = await syncFavorites(localIds);
                        if (res.success) {
                            set({
                                favoriteIds: res.data.favoriteIds || [],
                                favoriteListings: res.data.listings || []
                            });
                        }
                    } catch (err) {
                        console.error('Failed to sync favorites with server:', err);
                    }
                } else {
                    get().fetchFavorites();
                }
            },

            /**
             * Explicitly remove an item
             */
            removeFavoriteItem: async (id) => {
                if (!id) return;
                const strId = String(id);
                set(state => ({
                    favoriteIds: state.favoriteIds.filter(favId => String(favId) !== strId),
                    favoriteListings: state.favoriteListings.filter(l => String(l.id) !== strId)
                }));
                toast.success('Inserat aus Merkzettel entfernt', {
                    id: `fav-remove-${strId}`
                });

                const isLoggedIn = useAuthStore.getState().isLoggedIn;
                if (isLoggedIn) {
                    try {
                        await removeFavorite(strId);
                    } catch (err) {
                        console.error('Failed to remove favorite from server:', err);
                    }
                }
            },

            /**
             * Clear local favorites (on explicit clear or switch)
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
