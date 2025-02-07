import murmurhash from "murmurhash";

export default function createComparisonHash(content: string): string {
    return murmurhash.v3(content).toString(36).slice(0, 4)
}