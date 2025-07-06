import express from "express";
import request from "supertest";
import { rateLimiter } from "../src/rateLimiter";
import { identifierStrategies, backoffStrategies } from "../src/strategies";
import { redis } from "../src/redisClient";
import { normalizeIP } from "../src/utils";

const createApp = (overrides = {}) => {
  const app = express();
  app.use(express.json());

  app.use(
    rateLimiter({
      timeWindowSeconds: 1,
      requestCount: 2,
      getIdentifier: identifierStrategies.byHeader("x-test-id"),
      backoffStrategy: backoffStrategies.none,
      ...overrides,
    })
  );

  app.get("/", (req, res) => res.send("ok"));
  return app;
};

beforeEach(async () => {
  await redis.flushall();
});

afterAll(async () => {
  await redis.quit();
});

describe("rateLimiter core behavior", () => {
  it("allows up to limit then 429", async () => {
    const app = createApp();

    const req = () => request(app).get("/").set("x-test-id", "core-1");

    await req().expect(200);
    await req().expect(200);
    await req().expect(429);
  });

  it("respects allowlist", async () => {
    const id = "allow-1";
    const app = createApp({
      allowlist: [`hdr:x-test-id:${id}`],
    });

    const req = () => request(app).get("/").set("x-test-id", id);
    await req().expect(200);
    await req().expect(200);
    await req().expect(200); // still allowed
  });

  it("respects blocklist", async () => {
    const id = "block-1";
    const app = createApp({
      blocklist: [`hdr:x-test-id:${id}`],
    });

    const req = () => request(app).get("/").set("x-test-id", id);
    await req().expect(403);
  });
});

describe("identifierStrategies", () => {
  it("identifies by header", async () => {
    const app = createApp();

    const req = () => request(app).get("/").set("x-test-id", "hdr-1");

    await req().expect(200);
    await req().expect(200);
    await req().expect(429);
  });
});

describe("backoffStrategies", () => {
  const measureDelay = async (reqFn: () => Promise<request.Response>): Promise<number> => {
    const start = Date.now();
    await reqFn();
    return Date.now() - start;
  };

  it("uses fixed backoff", async () => {
    const id = "fixed-1";
    const app = createApp({
      backoffStrategy: backoffStrategies.fixed(100),
    });

    const req = () => request(app).get("/").set("x-test-id", id);

    await req();
    await req();
    const elapsed = await measureDelay(req);
    expect(elapsed).toBeGreaterThanOrEqual(90);
  });

  it("uses linear backoff", async () => {
    const id = "linear-1";
    const app = createApp({
      backoffStrategy: backoffStrategies.linear(50),
    });

    const req = () => request(app).get("/").set("x-test-id", id);

    await req();
    await req();
    const elapsed = await measureDelay(req);
    expect(elapsed).toBeGreaterThanOrEqual(40);
  });

  it("uses exponential backoff", async () => {
    const id = "exp-1";
    const app = createApp({
      backoffStrategy: backoffStrategies.exponential(60),
    });

    const req = () => request(app).get("/").set("x-test-id", id);

    await req();
    await req();
    const elapsed = await measureDelay(req);
    expect(elapsed).toBeGreaterThanOrEqual(60);
  });
});

