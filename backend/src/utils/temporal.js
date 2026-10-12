import 'temporal-polyfill/full/global';

/**
 * Converts any timestamp-like value (Temporal.Instant, JS Date, ISO string, epoch ms)
 * safely to a JavaScript Date object.
 * Fixes Bug A: `Cannot use valueOf` when wrapping Temporal.Instant in `new Date(...)`.
 * 
 * @param {any} val
 * @returns {Date|null}
 */
export const toJsDate = (val) => {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (val.epochMilliseconds !== undefined) {
        return new Date(Number(val.epochMilliseconds));
    }
    return new Date(val);
};

/**
 * Converts any timestamp-like value (JS Date, ISO string, epoch ms, Temporal.Instant)
 * safely to a Temporal.Instant object for Prisma 8 pg/timestamptz-temporal@1 codec.
 * Fixes Bug B: `RUNTIME.ENCODE_FAILED` when passing JS Date or string to Prisma 8.
 * 
 * @param {any} val
 * @returns {Temporal.Instant|null}
 */
export const toTemporalInstant = (val) => {
    if (!val) return null;
    if (typeof val === 'object' && val.epochMilliseconds !== undefined && typeof val.toString === 'function') {
        return val;
    }
    if (val instanceof Date) {
        return Temporal.Instant.fromEpochMilliseconds(val.getTime());
    }
    if (typeof val === 'number') {
        return Temporal.Instant.fromEpochMilliseconds(val);
    }
    if (typeof val === 'string') {
        // Temporal.Instant.from requires an ISO string with an offset (e.g. Z or +00:00)
        if (val.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(val)) {
            return Temporal.Instant.from(val);
        }
        return Temporal.Instant.from(new Date(val).toISOString());
    }
    return val;
};

/**
 * Returns current timestamp as a Temporal.Instant.
 * Equivalent to Temporal.Now.instant().
 * 
 * @returns {Temporal.Instant}
 */
export const nowInstant = () => Temporal.Now.instant();

/**
 * Converts any timestamp-like value safely to an ISO-8601 string.
 * 
 * @param {any} val
 * @returns {string|null}
 */
export const toIsoString = (val) => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (val.epochMilliseconds !== undefined && typeof val.toString === 'function') {
        return val.toString();
    }
    if (val instanceof Date) {
        return val.toISOString();
    }
    return new Date(val).toISOString();
};
