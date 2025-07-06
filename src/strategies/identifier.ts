import type { Request } from "express";

export const identifierStrategies = {
	byIP: () => (req: Request) => `ip:${req.ip}`,
	byHeader: (name: string) => (req: Request) =>
		`hdr:${name}:${req.header(name) || "none"}`,
};
