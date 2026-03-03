import * as path from 'path';
import * as fs from 'fs';

/**
 * Resolves an import path to an absolute file path.
 * Checks for common extensions and index files if the path is a directory.
 */
export function resolveImportPath(baseDir: string, importPath: string): string | null {
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
        return null; // Not a local import (e.g., node_modules or standard library)
    }

    const absolutePath = path.resolve(baseDir, importPath);

    // Try exact match and common extensions
    const extensions = ['.ts', '.js', '.mjs', '.cjs', ''];
    for (const ext of extensions) {
        const testPath = absolutePath + ext;
        if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
            return testPath.replace(/\\/g, '/');
        }
    }

    // Try as directory with index file
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
        for (const ext of extensions) {
            if (ext) { // skip empty string for index
                const indexPath = path.join(absolutePath, `index${ext}`);
                if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
                    return indexPath.replace(/\\/g, '/');
                }
            }
        }
    }

    return null;
}
