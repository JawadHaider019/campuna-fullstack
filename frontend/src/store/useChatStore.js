import { create } from 'zustand';
import { getUnreadMessagesCount, getConversations } from '@/api/conversations';

export const useChatStore = create((set, get) => ({
    unreadCount: 0,
    conversations: [],
    isLoadingConversations: false,

    fetchUnreadCount: async () => {
        try {
            const res = await getUnreadMessagesCount();
            const unread = res.unread_count ?? res.data?.unread_count;
            if (res.success && typeof unread === 'number') {
                set({ unreadCount: unread });
            }
        } catch {
            // Silently fail if not logged in or network error
        }
    },

    setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),

    decrementUnreadCount: (amount = 1) => {
        set((state) => ({
            unreadCount: Math.max(0, state.unreadCount - amount)
        }));
    },

    fetchConversations: async () => {
        set({ isLoadingConversations: true });
        try {
            const res = await getConversations();
            const list = res.conversations || res.data?.conversations;
            if (res.success && Array.isArray(list)) {
                set({
                    conversations: list,
                    unreadCount: list.reduce((acc, c) => acc + (c.unread_count || 0), 0)
                });
                return list;
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
        } finally {
            set({ isLoadingConversations: false });
        }
        return [];
    }
}));
