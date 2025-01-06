type ComponentSource = string | (() => Promise<string | {
    default: string;
}>) | {
    type: "absolute";
    path: string;
} | {
    type: "raw";
    html: string;
};
export default ComponentSource;
