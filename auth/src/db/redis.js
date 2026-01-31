const { Redis } = require('ioredis');

if (process.env.NODE_ENV === 'test') {
    const store = new Map();
    const timers = new Map();

    const mock = {
        set(key, value, ...args) {
            if (timers.has(key)) {
                clearTimeout(timers.get(key));
                timers.delete(key);
            }
            store.set(key, String(value));

            // support: set(key, value, 'Ex', seconds)
            const exIndex = args.findIndex(a => String(a).toLowerCase() === 'ex');
            if (exIndex !== -1 && args[exIndex + 1]) {
                const ttlMs = Number(args[exIndex + 1]) * 1000;
                const t = setTimeout(() => {
                    store.delete(key);
                    timers.delete(key);
                }, ttlMs);
                timers.set(key, t);
            }

            return Promise.resolve('OK');
        },
        get(key) {
            return Promise.resolve(store.has(key) ? store.get(key) : null);
        },
        del(key) {
            const existed = store.delete(key) ? 1 : 0;
            if (timers.has(key)) {
                clearTimeout(timers.get(key));
                timers.delete(key);
            }
            return Promise.resolve(existed);
        },
        on() {},
        quit() { return Promise.resolve(); }
    };

    module.exports = mock;
} else {
    const redis = new Redis({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
    });

    redis.on('connect', () => {
        console.log('Connected to Redis');
    });

    module.exports = redis;
}