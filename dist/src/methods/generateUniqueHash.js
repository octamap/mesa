export default function generateUniqueHash(string2) {
    // Use a basic hashing algorithm (e.g., DJB2)
    let hash = 5381;
    for (let i = 0; i < string2.length; i++) {
        hash = (hash * 33) ^ string2.charCodeAt(i);
    }
    // Convert the hash to an unsigned integer and then to a hexadecimal string
    return (hash >>> 0).toString(16);
}
