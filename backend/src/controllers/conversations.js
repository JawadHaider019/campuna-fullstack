import pool from '../config/database.js';
import crypto from 'crypto';

/**
 * Helper to safely extract image list
 */
function parseImages(raw) {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw);
        } catch {
            return [raw];
        }
    }
    return [];
}

const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());

/**
 * POST /api/conversations
 * Creates or fetches an existing conversation for a listing between the logged-in buyer and seller.
 * Optionally sends an initial message.
 */
export const createOrGetConversation = async (req, res) => {
    try {
        let buyerId = req.user.id;
        let { listing_id, seller_id, initial_message } = req.body;

        if (!listing_id && !seller_id) {
            return res.status(400).json({ success: false, error: 'Listing-ID oder Verkäufer-ID ist erforderlich.' });
        }

        // Verify buyer exists in users table (prevents FK violations if user was created in mock session)
        let buyerCheck = null;
        if (isUUID(buyerId)) {
            const bRes = await pool.query(`SELECT id FROM users WHERE id = $1`, [buyerId]);
            if (bRes.rowCount > 0) buyerCheck = bRes.rows[0];
        }
        if (!buyerCheck && req.user?.email) {
            const bRes = await pool.query(`SELECT id FROM users WHERE email = $1`, [req.user.email]);
            if (bRes.rowCount > 0) {
                buyerCheck = bRes.rows[0];
                buyerId = buyerCheck.id;
            }
        }
        if (!buyerCheck) {
            const newBuyerId = isUUID(buyerId) ? buyerId : crypto.randomUUID();
            const email = req.user?.email || `user_${Date.now()}@campuna.de`;
            await pool.query(`
                INSERT INTO users (id, email, password_hash, role, user_type, email_verified, is_suspended, created_at, updated_at)
                VALUES ($1, $2, 'auth_hash', $3, $4, true, false, NOW(), NOW())
                ON CONFLICT (email) DO NOTHING
            `, [newBuyerId, email, req.user?.role || 'USER', req.user?.account_type || req.user?.user_type || 'PRIVATE']);
            
            const freshBuyer = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
            if (freshBuyer.rowCount > 0) {
                buyerId = freshBuyer.rows[0].id;
            } else {
                buyerId = newBuyerId;
            }
        }

        let listing = null;
        let validListingId = null;
        let targetSellerId = seller_id;
        let resolvedSellerId = null;
        let targetSellerUser = null;

        // 1. If listing_id provided, fetch listing safely
        if (listing_id) {
            let listingRes;
            if (isUUID(listing_id)) {
                listingRes = await pool.query(
                    `SELECT id, user_id, title, slug, price, images, location, category, status 
                     FROM listings 
                     WHERE id = $1`,
                    [listing_id]
                );
            } else {
                listingRes = await pool.query(
                    `SELECT id, user_id, title, slug, price, images, location, category, status 
                     FROM listings 
                     WHERE slug = $1`,
                    [String(listing_id).trim()]
                );
            }

            if (listingRes && listingRes.rowCount > 0) {
                listing = listingRes.rows[0];
                validListingId = listing.id;
                targetSellerId = listing.user_id;

                if (listing.status !== 'APPROVED') {
                    return res.status(400).json({
                        success: false,
                        error: 'Dieses Inserat ist derzeit nicht freigegeben oder wurde gesperrt.'
                    });
                }
            }
        }

        // 2. Resolve Seller in Users Table
        if (targetSellerId) {
            if (isUUID(targetSellerId)) {
                const uRes = await pool.query(`SELECT id, is_suspended, user_type FROM users WHERE id = $1`, [targetSellerId]);
                if (uRes.rowCount > 0) {
                    targetSellerUser = uRes.rows[0];
                    resolvedSellerId = targetSellerUser.id;
                }
            } else {
                // Try looking up seller by company name or email
                const uLookup = await pool.query(`
                    SELECT u.id, u.is_suspended, u.user_type 
                    FROM users u
                    LEFT JOIN company_profiles cp ON u.id = cp.user_id
                    LEFT JOIN private_profiles pp ON u.id = pp.user_id
                    WHERE cp.company_name ILIKE $1 
                       OR u.email ILIKE $1
                       OR (pp.first_name || ' ' || pp.last_name) ILIKE $1
                    LIMIT 1
                `, [`%${targetSellerId}%`]);
                if (uLookup.rowCount > 0) {
                    targetSellerUser = uLookup.rows[0];
                    resolvedSellerId = targetSellerUser.id;
                }
            }
        }

        // 3. If seller still not found in DB (e.g. pure static mock seller), fallback to a valid database demo seller
        if (!resolvedSellerId) {
            const fallbackSellerRes = await pool.query(`
                SELECT u.id, u.is_suspended, u.user_type 
                FROM users u 
                WHERE u.id <> $1 AND u.is_suspended = false AND u.user_type = 'COMMERCIAL'
                LIMIT 1
            `, [buyerId]);

            if (fallbackSellerRes.rowCount > 0) {
                targetSellerUser = fallbackSellerRes.rows[0];
                resolvedSellerId = targetSellerUser.id;
            } else {
                const anySellerRes = await pool.query(`
                    SELECT u.id, u.is_suspended, u.user_type 
                    FROM users u 
                    WHERE u.id <> $1 AND u.is_suspended = false
                    LIMIT 1
                `, [buyerId]);

                if (anySellerRes.rowCount > 0) {
                    targetSellerUser = anySellerRes.rows[0];
                    resolvedSellerId = targetSellerUser.id;
                } else {
                    // Create default demo partner seller in database if users table is sparse
                    const demoId = crypto.randomUUID();
                    await pool.query(`
                        INSERT INTO users (id, email, password_hash, role, user_type, email_verified, is_suspended, created_at, updated_at)
                        VALUES ($1, 'partner@campuna-demo.de', 'demo_hash', 'USER', 'COMMERCIAL', true, false, NOW(), NOW())
                        ON CONFLICT (email) DO NOTHING
                    `, [demoId]);

                    const freshSeller = await pool.query(`SELECT id, is_suspended, user_type FROM users WHERE email = 'partner@campuna-demo.de'`);
                    if (freshSeller.rowCount > 0) {
                        targetSellerUser = freshSeller.rows[0];
                        resolvedSellerId = targetSellerUser.id;

                        await pool.query(`
                            INSERT INTO company_profiles (user_id, company_name, location, tier, created_at, updated_at)
                            VALUES ($1, 'Campuna Partner', 'Deutschland', 'BUSINESS', NOW(), NOW())
                            ON CONFLICT (user_id) DO NOTHING
                        `, [resolvedSellerId]);
                    }
                }
            }
        }

        if (!resolvedSellerId) {
            return res.status(404).json({ success: false, error: 'Verkäufer oder Inserat nicht gefunden.' });
        }

        // 4. Prevent messaging yourself
        if (String(buyerId).toLowerCase() === String(resolvedSellerId).toLowerCase()) {
            return res.status(400).json({
                success: false,
                error: 'Du kannst keine Unterhaltung mit deinem eigenen Konto starten.'
            });
        }

        // 6. Check if seller is suspended
        if (targetSellerUser && targetSellerUser.is_suspended) {
            return res.status(400).json({
                success: false,
                error: 'Dieser Verkäufer ist derzeit gesperrt. Kontaktaufnahme ist nicht möglich.'
            });
        }

        // 7. Find existing conversation
        let existingConv;
        if (validListingId) {
            existingConv = await pool.query(
                `SELECT * FROM conversations WHERE listing_id = $1 AND buyer_id = $2`,
                [validListingId, buyerId]
            );
        } else {
            existingConv = await pool.query(
                `SELECT * FROM conversations WHERE seller_id = $1 AND buyer_id = $2 AND listing_id IS NULL`,
                [resolvedSellerId, buyerId]
            );
        }

        let conversationId;
        let isNew = false;

        if (existingConv && existingConv.rowCount > 0) {
            conversationId = existingConv.rows[0].id;
        } else {
            // 8. Create new conversation
            conversationId = crypto.randomUUID();
            await pool.query(
                `INSERT INTO conversations (id, listing_id, buyer_id, seller_id, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, NOW(), NOW())`,
                [conversationId, validListingId || null, buyerId, resolvedSellerId]
            );
            isNew = true;
        }

        // 9. Send initial message if provided
        let createdMessage = null;
        if (initial_message && typeof initial_message === 'string' && initial_message.trim().length > 0) {
            const messageId = crypto.randomUUID();
            const msgRes = await pool.query(
                `INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at)
                 VALUES ($1, $2, $3, $4, false, NOW())
                 RETURNING *`,
                [messageId, conversationId, buyerId, initial_message.trim()]
            );
            createdMessage = msgRes.rows[0];

            await pool.query(
                `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
                [conversationId]
            );
        }

        return res.status(isNew ? 201 : 200).json({
            success: true,
            is_new: isNew,
            conversation_id: conversationId,
            message: createdMessage,
            listing: listing ? {
                id: listing.id,
                title: listing.title,
                slug: listing.slug,
                price: parseFloat(listing.price) || 0,
                location: listing.location || 'Deutschland',
                images: parseImages(listing.images)
            } : null
        });

    } catch (error) {
        console.error('❌ createOrGetConversation error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Erstellen der Unterhaltung.' });
    }
};

/**
 * GET /api/conversations
 * Retrieves all conversations for the authenticated user (as buyer or seller).
 * Includes listing summary, other party's details, last message, and unread counts.
 */
export const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        const query = `
            SELECT 
                c.id,
                c.listing_id,
                c.buyer_id,
                c.seller_id,
                c.created_at,
                c.updated_at,
                -- Listing details
                l.title as listing_title,
                l.slug as listing_slug,
                l.price as listing_price,
                l.images as listing_images,
                l.location as listing_location,
                l.status as listing_status,
                -- Buyer details
                u_b.user_type as buyer_type,
                pp_b.first_name as buyer_first_name,
                pp_b.last_name as buyer_last_name,
                pp_b.profile_image_url as buyer_avatar,
                cp_b.company_name as buyer_company_name,
                cp_b.logo_url as buyer_logo,
                -- Seller details
                u_s.user_type as seller_type,
                pp_s.first_name as seller_first_name,
                pp_s.last_name as seller_last_name,
                pp_s.profile_image_url as seller_avatar,
                cp_s.company_name as seller_company_name,
                cp_s.logo_url as seller_logo,
                -- Last message
                lm.id as last_message_id,
                lm.content as last_message_content,
                lm.sender_id as last_message_sender_id,
                lm.created_at as last_message_created_at,
                -- Unread count for current user
                COALESCE(unread.count, 0)::int as unread_count
            FROM conversations c
            LEFT JOIN listings l ON c.listing_id = l.id
            JOIN users u_b ON c.buyer_id = u_b.id
            LEFT JOIN private_profiles pp_b ON u_b.id = pp_b.user_id
            LEFT JOIN company_profiles cp_b ON u_b.id = cp_b.user_id
            JOIN users u_s ON c.seller_id = u_s.id
            LEFT JOIN private_profiles pp_s ON u_s.id = pp_s.user_id
            LEFT JOIN company_profiles cp_s ON u_s.id = cp_s.user_id
            LEFT JOIN LATERAL (
                SELECT id, content, sender_id, created_at
                FROM messages
                WHERE conversation_id = c.id
                ORDER BY created_at DESC
                LIMIT 1
            ) lm ON true
            LEFT JOIN LATERAL (
                SELECT COUNT(*) as count
                FROM messages
                WHERE conversation_id = c.id 
                  AND sender_id <> $1 
                  AND is_read = false
            ) unread ON true
            WHERE c.buyer_id = $1 OR c.seller_id = $1 OR (u_s.role = 'ADMIN') OR (l.user_id = $1)
            ORDER BY c.updated_at DESC
        `;

        const result = await pool.query(query, [userId]);

        const conversations = result.rows.map(row => {
            const isBuyer = String(row.buyer_id).toLowerCase() === String(userId).toLowerCase();
            
            // Determine other party info
            const otherUser = isBuyer
                ? {
                    id: row.seller_id,
                    role_in_chat: 'SELLER',
                    name: row.seller_type === 'COMMERCIAL'
                        ? (row.seller_company_name || 'Campuna Club')
                        : (`${row.seller_first_name || ''} ${row.seller_last_name || ''}`.trim() || 'Privatverkäufer'),
                    type: row.seller_type === 'COMMERCIAL' ? 'Gewerblich' : 'Privat',
                    avatar: row.seller_type === 'COMMERCIAL' ? (row.seller_logo || row.seller_avatar) : row.seller_avatar
                }
                : {
                    id: row.buyer_id,
                    role_in_chat: 'BUYER',
                    name: row.buyer_type === 'COMMERCIAL'
                        ? (row.buyer_company_name || 'Gewerblicher Interessent')
                        : (`${row.buyer_first_name || ''} ${row.buyer_last_name || ''}`.trim() || 'Interessent'),
                    type: row.buyer_type === 'COMMERCIAL' ? 'Gewerblich' : 'Privat',
                    avatar: row.buyer_type === 'COMMERCIAL' ? (row.buyer_logo || row.buyer_avatar) : row.buyer_avatar
                };

            const images = parseImages(row.listing_images);

            return {
                id: row.id,
                listing_id: row.listing_id,
                buyer_id: row.buyer_id,
                seller_id: row.seller_id,
                is_buyer: isBuyer,
                created_at: row.created_at,
                updated_at: row.updated_at,
                unread_count: row.unread_count || 0,
                listing: row.listing_id ? {
                    id: row.listing_id,
                    title: row.listing_title,
                    slug: row.listing_slug,
                    price: parseFloat(row.listing_price) || 0,
                    location: row.listing_location || 'Deutschland',
                    main_image: images[0] || null,
                    images,
                    status: row.listing_status
                } : null,
                other_user: otherUser,
                last_message: row.last_message_id ? {
                    id: row.last_message_id,
                    content: row.last_message_content,
                    sender_id: row.last_message_sender_id,
                    is_mine: String(row.last_message_sender_id).toLowerCase() === String(userId).toLowerCase(),
                    created_at: row.last_message_created_at
                } : null
            };
        });

        return res.status(200).json({
            success: true,
            conversations
        });

    } catch (error) {
        console.error('❌ getConversations error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden der Unterhaltungen.' });
    }
};

/**
 * GET /api/conversations/unread-count
 * Returns total unread messages count across all conversations for current user.
 */
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const isAdmin = req.user.role === 'ADMIN';

        const result = await pool.query(
            `SELECT COUNT(*)::int as count 
             FROM messages m 
             JOIN conversations c ON m.conversation_id = c.id 
             JOIN users u_s ON c.seller_id = u_s.id
             LEFT JOIN listings l ON c.listing_id = l.id
             WHERE (c.buyer_id = $1 OR c.seller_id = $1 ${isAdmin ? "OR u_s.role = 'ADMIN' OR l.user_id = $1" : ''}) 
               AND m.sender_id <> $1 
               AND m.is_read = false`,
            [userId]
        );

        const unreadCount = result.rows[0]?.count || 0;

        return res.status(200).json({
            success: true,
            unread_count: unreadCount
        });

    } catch (error) {
        console.error('❌ getUnreadCount error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden der Benachrichtigungen.' });
    }
};

/**
 * GET /api/conversations/:id
 * Retrieves full conversation details, participant details, and message thread.
 * Auto-marks messages as read.
 */
export const getConversationDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        if (!isUUID(id)) {
            return res.status(404).json({ success: false, error: 'Unterhaltung nicht gefunden.' });
        }

        // 1. Fetch conversation and metadata
        const convRes = await pool.query(
            `SELECT 
                c.id,
                c.listing_id,
                c.buyer_id,
                c.seller_id,
                c.created_at,
                c.updated_at,
                -- Listing
                l.title as listing_title,
                l.slug as listing_slug,
                l.price as listing_price,
                l.images as listing_images,
                l.location as listing_location,
                l.category as listing_category,
                l.status as listing_status,
                -- Buyer
                u_b.user_type as buyer_type,
                pp_b.first_name as buyer_first_name,
                pp_b.last_name as buyer_last_name,
                pp_b.profile_image_url as buyer_avatar,
                cp_b.company_name as buyer_company_name,
                cp_b.logo_url as buyer_logo,
                -- Seller
                u_s.user_type as seller_type,
                pp_s.first_name as seller_first_name,
                pp_s.last_name as seller_last_name,
                pp_s.profile_image_url as seller_avatar,
                cp_s.company_name as seller_company_name,
                cp_s.logo_url as seller_logo
            FROM conversations c
            LEFT JOIN listings l ON c.listing_id = l.id
            JOIN users u_b ON c.buyer_id = u_b.id
            LEFT JOIN private_profiles pp_b ON u_b.id = pp_b.user_id
            LEFT JOIN company_profiles cp_b ON u_b.id = cp_b.user_id
            JOIN users u_s ON c.seller_id = u_s.id
            LEFT JOIN private_profiles pp_s ON u_s.id = pp_s.user_id
            LEFT JOIN company_profiles cp_s ON u_s.id = cp_s.user_id
            WHERE c.id = $1`,
            [id]
        );

        if (convRes.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Unterhaltung nicht gefunden.' });
        }

        const row = convRes.rows[0];

        // 2. Strict Access Control: User must be buyer or seller (or admin)
        const isBuyer = String(row.buyer_id).toLowerCase() === String(userId).toLowerCase();
        const isSeller = String(row.seller_id).toLowerCase() === String(userId).toLowerCase();
        const isAdmin = req.user.role === 'ADMIN';

        if (!isBuyer && !isSeller && !isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Zugriff verweigert. Du bist kein Teilnehmer dieser Unterhaltung.'
            });
        }

        // 3. Mark all incoming unread messages as read
        await pool.query(
            `UPDATE messages 
             SET is_read = true 
             WHERE conversation_id = $1 AND sender_id <> $2 AND is_read = false`,
            [id, userId]
        );

        // 4. Fetch all messages in chronological order
        const msgRes = await pool.query(
            `SELECT id, conversation_id, sender_id, content, is_read, created_at
             FROM messages
             WHERE conversation_id = $1
             ORDER BY created_at ASC`,
            [id]
        );

        const messages = msgRes.rows.map(m => ({
            id: m.id,
            conversation_id: m.conversation_id,
            sender_id: m.sender_id,
            content: m.content,
            is_read: m.is_read,
            is_mine: String(m.sender_id).toLowerCase() === String(userId).toLowerCase(),
            created_at: m.created_at
        }));

        const otherUser = isBuyer
            ? {
                id: row.seller_id,
                role_in_chat: 'SELLER',
                name: row.seller_type === 'COMMERCIAL'
                    ? (row.seller_company_name || 'Gewerblicher Anbieter')
                    : (`${row.seller_first_name || ''} ${row.seller_last_name || ''}`.trim() || 'Privatverkäufer'),
                type: row.seller_type === 'COMMERCIAL' ? 'Gewerblich' : 'Privat',
                avatar: row.seller_type === 'COMMERCIAL' ? (row.seller_logo || row.seller_avatar) : row.seller_avatar
            }
            : {
                id: row.buyer_id,
                role_in_chat: 'BUYER',
                name: row.buyer_type === 'COMMERCIAL'
                    ? (row.buyer_company_name || 'Gewerblicher Interessent')
                    : (`${row.buyer_first_name || ''} ${row.buyer_last_name || ''}`.trim() || 'Interessent'),
                type: row.buyer_type === 'COMMERCIAL' ? 'Gewerblich' : 'Privat',
                avatar: row.buyer_type === 'COMMERCIAL' ? (row.buyer_logo || row.buyer_avatar) : row.buyer_avatar
            };

        const images = parseImages(row.listing_images);

        return res.status(200).json({
            success: true,
            conversation: {
                id: row.id,
                listing_id: row.listing_id,
                buyer_id: row.buyer_id,
                seller_id: row.seller_id,
                is_buyer: isBuyer,
                created_at: row.created_at,
                updated_at: row.updated_at,
                listing: row.listing_id ? {
                    id: row.listing_id,
                    title: row.listing_title,
                    slug: row.listing_slug,
                    price: parseFloat(row.listing_price) || 0,
                    location: row.listing_location || 'Deutschland',
                    category: row.listing_category,
                    main_image: images[0] || null,
                    images,
                    status: row.listing_status
                } : null,
                other_user: otherUser,
                messages
            }
        });

    } catch (error) {
        console.error('❌ getConversationDetail error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden der Unterhaltung.' });
    }
};

/**
 * POST /api/conversations/:id/messages
 * Sends a message in a conversation.
 * Always sets sender_id = req.user.id (server-enforced).
 */
export const sendMessage = async (req, res) => {
    try {
        const { id: conversationId } = req.params;
        const userId = req.user.id;
        const { content } = req.body;

        if (!isUUID(conversationId)) {
            return res.status(404).json({ success: false, error: 'Unterhaltung nicht gefunden.' });
        }

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Die Nachricht darf nicht leer sein.' });
        }

        // 1. Verify user is participant in conversation
        const convRes = await pool.query(
            `SELECT id, buyer_id, seller_id FROM conversations WHERE id = $1`,
            [conversationId]
        );

        if (convRes.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Unterhaltung nicht gefunden.' });
        }

        const conv = convRes.rows[0];
        const isBuyer = String(conv.buyer_id).toLowerCase() === String(userId).toLowerCase();
        const isSeller = String(conv.seller_id).toLowerCase() === String(userId).toLowerCase();
        const isAdmin = req.user?.role === 'ADMIN';

        if (!isBuyer && !isSeller && !isAdmin) {
            return res.status(403).json({ success: false, error: 'Keine Berechtigung zum Senden in dieser Unterhaltung.' });
        }

        // Check if recipient is suspended
        const recipientId = isBuyer ? conv.seller_id : conv.buyer_id;
        const recipientCheck = await pool.query('SELECT is_suspended FROM users WHERE id = $1', [recipientId]);
        if (recipientCheck.rowCount > 0 && recipientCheck.rows[0].is_suspended) {
            return res.status(400).json({
                success: false,
                error: 'Der Empfänger ist derzeit gesperrt. Nachrichten können nicht gesendet werden.'
            });
        }

        // 2. Insert message with server-determined sender_id
        const messageId = crypto.randomUUID();
        const msgRes = await pool.query(
            `INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at)
             VALUES ($1, $2, $3, $4, false, NOW())
             RETURNING *`,
            [messageId, conversationId, userId, content.trim()]
        );

        const newMsg = msgRes.rows[0];

        // 3. Update conversation updated_at timestamp
        await pool.query(
            `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
            [conversationId]
        );

        return res.status(201).json({
            success: true,
            message: {
                id: newMsg.id,
                conversation_id: newMsg.conversation_id,
                sender_id: newMsg.sender_id,
                content: newMsg.content,
                is_read: newMsg.is_read,
                is_mine: true,
                created_at: newMsg.created_at
            }
        });

    } catch (error) {
        console.error('❌ sendMessage error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Senden der Nachricht.' });
    }
};

/**
 * PATCH /api/conversations/:id/read
 * Marks all incoming unread messages as read for a conversation.
 */
export const markConversationAsRead = async (req, res) => {
    try {
        const { id: conversationId } = req.params;
        const userId = req.user.id;

        if (!isUUID(conversationId)) {
            return res.status(404).json({ success: false, error: 'Unterhaltung nicht gefunden.' });
        }

        const result = await pool.query(
            `UPDATE messages 
             SET is_read = true 
             WHERE conversation_id = $1 AND sender_id <> $2 AND is_read = false
             RETURNING id`,
            [conversationId, userId]
        );

        return res.status(200).json({
            success: true,
            marked_count: result.rowCount
        });

    } catch (error) {
        console.error('❌ markConversationAsRead error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Aktualisieren des Lesestatus.' });
    }
};
