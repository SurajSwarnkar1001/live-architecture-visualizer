export function debounce<T extends (...args: any[]) => void>(func: T, waitFor: number): T {
    let timeout: NodeJS.Timeout | null = null;
    return ((...args: Parameters<T>) => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => func(...args), waitFor);
    }) as T;
}
