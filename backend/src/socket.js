import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import pool from './config/database.js';

let io = null;

export function initSocketServer(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'] : '*',
            methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
            credentials: true
        },
        pingTimeout: 30000,
        pingInterval: 25000
    });

    // Socket Authentication Middleware
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token 
                || socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '')
                || socket.handshake.query?.token;

            if (!token) {
                console.warn('⚠️ Socket auth failed: No token provided in handshake');
                return next(new Error('Authentication token required'));
            }

            const secret = process.env.JWT_SECRET || 'campuna_fullstack_2026';
            const decoded = jwt.verify(token, secret);
            socket.user = decoded;
            next();
        } catch (err) {
            console.error('❌ Socket auth failed:', err.message);
            next(new Error('Invalid socket credentials'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user?.id;
        if (!userId) return;

        // Join personal user notification room
        socket.join(`user:${userId}`);
        if (socket.user.role === 'ADMIN') {
            socket.join('admin:notifications');
        }

        console.log(`🔌 Realtime Socket connected: User ${userId} (Socket: ${socket.id})`);

        // Join a conversation room
        socket.on('join_conversation', async ({ conversationId }) => {
            if (!conversationId) return;

            try {
                socket.join(`conversation:${conversationId}`);
                socket.emit('joined_conversation', { conversationId });
                console.log(`💬 User ${userId} joined room conversation:${conversationId}`);
            } catch (err) {
                console.error('Error joining conversation room:', err.message);
            }
        });

        // Leave a conversation room
        socket.on('leave_conversation', ({ conversationId }) => {
            if (!conversationId) return;
            socket.leave(`conversation:${conversationId}`);
        });

        // User is typing indicator
        socket.on('typing_start', ({ conversationId }) => {
            if (!conversationId) return;
            socket.to(`conversation:${conversationId}`).emit('user_typing', {
                conversationId,
                userId,
                userName: socket.user?.name || 'Benutzer'
            });
        });

        // User stopped typing
        socket.on('typing_stop', ({ conversationId }) => {
            if (!conversationId) return;
            socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
                conversationId,
                userId
            });
        });

        // Messages marked as read in realtime
        socket.on('mark_read', async ({ conversationId }) => {
            if (!conversationId) return;
            try {
                await pool.query(
                    `UPDATE messages 
                     SET is_read = true 
                     WHERE conversation_id = $1 AND sender_id <> $2 AND is_read = false`,
                    [conversationId, userId]
                );

                // Notify other party in this conversation that messages were read
                socket.to(`conversation:${conversationId}`).emit('messages_read', {
                    conversationId,
                    readBy: userId,
                    readAt: new Date().toISOString()
                });
            } catch (err) {
                console.error('Error in socket mark_read:', err.message);
            }
        });

        socket.on('disconnect', () => {
            // Cleanup automatic on socket.io
        });
    });

    return io;
}

export function getIO() {
    return io;
}

/**
 * Broadcast new message to conversation room and notify recipient user room
 */
export function emitNewMessage({ conversationId, message, recipientId, buyerId, sellerId }) {
    if (!io) return;

    // 1. Emit to active conversation room (anyone currently viewing this chat)
    io.to(`conversation:${conversationId}`).emit('new_message', {
        conversationId,
        message
    });

    // 2. Emit to recipient's personal room for badge & sidebar update
    if (recipientId) {
        io.to(`user:${recipientId}`).emit('message_received', {
            conversationId,
            message
        });
    }

    // 3. Emit to all admins
    io.to('admin:notifications').emit('admin_new_message', {
        conversationId,
        message,
        buyerId,
        sellerId
    });
}

/**
 * Broadcast new broadcast announcement to all connected clients
 */
export function emitNewBroadcast(broadcast) {
    if (!io) return;
    io.emit('new_broadcast', { broadcast });
}

/**
 * Broadcast updated broadcast announcement
 */
export function emitUpdateBroadcast(broadcast) {
    if (!io) return;
    io.emit('update_broadcast', { broadcast });
}

/**
 * Broadcast deleted broadcast announcement
 */
export function emitDeleteBroadcast(broadcastId) {
    if (!io) return;
    io.emit('delete_broadcast', { broadcastId });
}

/**
 * Broadcast new user feedback to admin notifications room
 */
export function emitNewFeedback(feedback) {
    if (!io) return;
    io.to('admin:notifications').emit('admin_new_feedback', { feedback });
}

/**
 * Broadcast feedback reply to recipient user or admin
 */
export function emitFeedbackReply({ feedbackId, reply, recipientUserId, senderRole }) {
    if (!io) return;

    if (senderRole === 'ADMIN' && recipientUserId) {
        // Notify the specific user
        io.to(`user:${recipientUserId}`).emit('user_feedback_reply', { feedbackId, reply });
    } else if (senderRole === 'USER') {
        // Notify all admins
        io.to('admin:notifications').emit('admin_feedback_reply', { feedbackId, reply });
    }
}

