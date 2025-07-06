import { Request, Response, NextFunction } from "express";

export interface ExceptionRule {
	route: string;
	count: number;
}

export interface LimiterConfig {
	timeWindowSeconds: number;
	requestCount: number;
	exceptions?: ExceptionRule[];
	allowlist?: string[];
	blocklist?: string[];
	getIdentifier?: (req: Request) => string;
	backoffStrategy?: (overuse: number) => number;
}

export type ExpressHandler = (
	req: Request,
	res: Response,
	next: NextFunction
) => void;
