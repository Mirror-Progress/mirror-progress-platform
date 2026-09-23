import { BlockList, isIP } from "node:net";

/** Only private ALB subnet ranges are accepted; security groups must also restrict ingress to the ALB. */
export function trustedAlbPeers(cidrs: readonly string[]): (address: string) => boolean {
  if (cidrs.length !== 2 || new Set(cidrs).size !== 2) throw new Error("two_alb_subnets_required");
  const list = new BlockList();
  for (const cidr of cidrs) {
    const parts = cidr.split("/");
    const [address = "", prefix = ""] = parts;
    if (parts.length !== 2 || isIP(address) !== 4 || !/^(1[6-9]|2[0-8])$/.test(prefix)) throw new Error("invalid_alb_subnet");
    const octets = address.split(".").map(Number);
    if (!(octets[0] === 10 || (octets[0] === 172 && octets[1]! >= 16 && octets[1]! <= 31) ||
        (octets[0] === 192 && octets[1] === 168))) throw new Error("private_alb_subnet_required");
    const bits = Number(prefix), number = octets.reduce((n, b) => (n * 256 + b) >>> 0, 0);
    const mask = (0xffffffff << (32 - bits)) >>> 0;
    if ((number & ~mask) !== 0) throw new Error("canonical_alb_subnet_required");
    list.addSubnet(address, bits, "ipv4");
  }
  return address => list.check(address.replace(/^::ffff:/, ""), "ipv4");
}

/** ALB append mode adds the actual connection address last, after any attacker-supplied prefix. */
export function albClientAddress(peer: string, headers: Record<string, string | string[] | undefined>, trusted: (ip: string) => boolean): string {
  if (!trusted(peer) || headers["x-forwarded-proto"] !== "https" || headers["x-forwarded-port"] !== "443") {
    throw new Error("trusted_https_proxy_required");
  }
  const forwarded = headers["x-forwarded-for"];
  if (typeof forwarded !== "string" || forwarded.length > 4096) throw new Error("proxy_address_required");
  const address = forwarded.split(",").at(-1)!.trim();
  const family = isIP(address);
  if (family === 4) return address;
  if (family === 6) return new URL(`http://[${address}]/`).hostname.slice(1, -1);
  throw new Error("invalid_proxy_address");
}
