import { create } from 'zustand';
import { getUnreadMessagesCount, getConversations } from '@/api/conversations';
import { getSocket, disconnectSocket as socketUtilsDisconnect } from '@/utils/socket';
import useAuthStore from './useAuthStore';

export const useChatStore = create((set, get) => ({
    unreadCount: 0,
    conversations: [],
    isLoadingConversations: false,
    socketInitialized: false,

    fetchUnreadCount: async () => {
        const { isLoggedIn, accessToken } = useAuthStore.getState();
        if (!isLoggedIn || !accessToken) return;
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

    incrementUnreadCount: (amount = 1) => {
        set((state) => ({
            unreadCount: state.unreadCount + amount
        }));
    },

    fetchConversations: async () => {
        const { isLoggedIn, accessToken } = useAuthStore.getState();
        if (!isLoggedIn || !accessToken) {
            set({ conversations: [], unreadCount: 0, isLoadingConversations: false });
            return [];
        }

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
    },

    // Initialize global real-time listeners
    initGlobalSocket: (token) => {
        const socket = getSocket(token);
        if (!socket) return null;

        // Clean any existing message_received listeners before binding to avoid duplicates
        socket.off('message_received');
        socket.on('message_received', ({ conversationId, message }) => {
            get().fetchUnreadCount();
            get().fetchConversations();
        });

        socket.off('admin_new_message');
        socket.on('admin_new_message', () => {
            get().fetchUnreadCount();
        });

        set({ socketInitialized: true });
        return socket;
    },

    disconnectSocket: () => {
        try {
            socketUtilsDisconnect();
        } catch {}
        set({ socketInitialized: false });
    }
}));
