export function normalizeIP(ip: string): string {
  return ip.replace("::ffff:", "").replace("::1", "127.0.0.1");
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

