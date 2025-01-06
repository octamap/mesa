type ComponentSource = string | (() => Promise<string | {
    default: string;
}>) | {
    type: "absolute";
    path: string;
};
export default ComponentSource;
