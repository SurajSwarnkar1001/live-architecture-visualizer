import * as path from 'path';

export function normalizePath(p: string): string {
    return p.replace(/\\/g, '/');
}

export function getLabel(p: string): string {
    const ext = path.extname(p);
    return path.basename(p, ext);
}

export function isLocalImport(importPath: string): boolean {
    return importPath.startsWith('.') || importPath.startsWith('/');
}
