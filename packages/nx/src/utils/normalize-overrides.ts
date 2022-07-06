export function normalizeOverrides(extraFlags: Record<string, any>, prefix?) {
    let additionalFlags = []
    for (const flag of Object.keys(extraFlags)) {
        switch (typeof extraFlags[flag]) {
            case "boolean":
            case "number":
            case "string":
                additionalFlags.push(`--${prefix ? prefix + '.' : ''}${flag}=${extraFlags[flag]}`)
                break;
            case "object":
                additionalFlags.push(...normalizeOverrides(extraFlags[flag], flag))
                break;
            default:
                break
        }
    }
    return additionalFlags;
}