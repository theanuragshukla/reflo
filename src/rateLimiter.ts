import type { ExpressHandler, LimiterConfig } from "./types";
import { redis } from "./redisClient";
import { identifierStrategies } from "./strategies/identifier";
import { backoffStrategies } from "./strategies/backoff";
import { delay } from "./utils";

export function rateLimiter(config: LimiterConfig): ExpressHandler {
  const {
    timeWindowSeconds,
    requestCount,
    exceptions = [],
    allowlist = [],
    blocklist = [],
    getIdentifier = identifierStrategies.byIP(),
    backoffStrategy = backoffStrategies.exponential(200),
  } = config;

  return async (req, res, next) => {
    const userKey = getIdentifier(req);
    if (blocklist.includes(userKey)) return res.status(403).send("Forbidden");
    if (allowlist.includes(userKey)) return next();

    const rule = exceptions.find((ex) => ex.route === req.path);
    const capacity = rule?.count ?? requestCount;
    const refillRate = capacity / (timeWindowSeconds * 1000);

    try {
      const [allowed, tokensLeft, overuse] = (await (redis as any).tokenBucket(
        `lim:${userKey}:${req.path}`,
        capacity,
        refillRate,
        Date.now(),
      )) as [0 | 1, number, number];

      res.setHeader("X-RateLimit-Limit", capacity.toString());
      res.setHeader("X-RateLimit-Remaining", Math.floor(tokensLeft).toString());

      if (allowed) return next();

      const wait = backoffStrategy(overuse);
      await delay(wait);
      return res.status(429).send(`Too Many Requests — delayed ${wait}ms`);
    } catch (err) {
      console.error("Reflo error:", err);
      return res.status(503).send("Rate limit service unavailable");
    }
  };
}

