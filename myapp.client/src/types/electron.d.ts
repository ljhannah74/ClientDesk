export {};

declare global {
    interface Window {
        electronAPI?: {
            getApiUrl: () =>
                Promise<string | null>;
        };
    }
}