import Redis from "ioredis";

const DEFAULT_REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
export const redis = new Redis(DEFAULT_REDIS_URL, {
	tls: process.env.REDIS_TLS === "true" ? {} : undefined,
	maxRetriesPerRequest: 0,
});

redis.on("error", (err) => console.error("Redis error:", err));

redis.defineCommand("tokenBucket", {
	numberOfKeys: 1,
	lua: `local key=KEYS[1]
  local capacity=tonumber(ARGV[1])
  local refill_rate=tonumber(ARGV[2])
  local now=tonumber(ARGV[3])
  local tokens=tonumber(redis.call("HGET",key,"tokens") or capacity)
  local last=tonumber(redis.call("HGET",key,"last") or now)
  local delta=now-last
  local filled=math.min(capacity, tokens + delta * refill_rate)
  local allowed = 0
  if filled >= 1 then allowed = 1; filled = filled - 1 end
  redis.call("HMSET", key, "tokens", filled, "last", now)
  redis.call("PEXPIRE", key, math.ceil(capacity/refill_rate))
  local overuse = allowed == 0 and math.ceil(1 - filled) or 0
  return {allowed, filled, overuse}`,
});
