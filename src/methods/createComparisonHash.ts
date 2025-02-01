import { createHash } from "crypto";

export default function createComparisonHash(content: string): string {
    return createHash("sha1").update(content, "utf8").digest("hex").substring(0, 16);
}