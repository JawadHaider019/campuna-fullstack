import { io } from 'socket.io-client';

let socket = null;
let currentToken = null;

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL 
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') 
    : 'http://localhost:5000';

export function getSocket(token) {
    let activeToken = token;
    
    if (!activeToken && typeof window !== 'undefined') {
        try {
            const rawAuth = localStorage.getItem('campuna-auth');
            if (rawAuth) {
                const parsed = JSON.parse(rawAuth);
                activeToken = parsed?.state?.accessToken;
            }
        } catch {}
        if (!activeToken) {
            activeToken = localStorage.getItem('campuna_auth_token') || localStorage.getItem('token') || localStorage.getItem('accessToken');
        }
    }

    if (!activeToken) {
        if (socket) {
            socket.disconnect();
            socket = null;
            currentToken = null;
        }
        return null;
    }

    if (socket && socket.connected && currentToken === activeToken) {
        return socket;
    }

    if (socket) {
        socket.disconnect();
    }

    currentToken = activeToken;

    socket = io(SOCKET_URL, {
        auth: { token: activeToken },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
    });

    socket.on('connect', () => {
        console.log('⚡ Connected to Campuna Realtime Messenger');
    });

    socket.on('connect_error', (err) => {
        console.warn('Realtime Socket connection warning:', err.message);
    });

    socket.on('disconnect', (reason) => {
        console.log('Realtime Socket disconnected:', reason);
    });

    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
        currentToken = null;
    }
}
