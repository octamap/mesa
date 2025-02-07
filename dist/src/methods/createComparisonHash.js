import murmurhash from "murmurhash";
export default function createComparisonHash(content) {
    return murmurhash.v3(content).toString(36).slice(0, 4);
}
