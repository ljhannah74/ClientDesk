let apiBaseUrl = "";

export async function initializeApi(): Promise<void> {
    if (!window.electronAPI) {
        return;
    }

    const url =
        await window.electronAPI.getApiUrl();

    if (!url) {
        throw new Error(
            "Electron did not provide an API URL."
        );
    }

    apiBaseUrl = url;
}

export function getApiBaseUrl(): string {
    return apiBaseUrl;
}