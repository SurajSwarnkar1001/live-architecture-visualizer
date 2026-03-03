import { glob } from 'glob';
import * as vscode from 'vscode';

export async function scanWorkspace(workspaceRoot: string): Promise<string[]> {
    const config = vscode.workspace.getConfiguration('liveArchViz');
    const excludes: string[] = config.get('exclude') || [
        '**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/coverage/**'
    ];

    const files = await glob('**/*.{ts,js,tsx,jsx,mjs,cjs}', {
        cwd: workspaceRoot,
        ignore: excludes,
        absolute: true,
        nodir: true
    });

    return files.map(f => f.replace(/\\/g, '/'));
}
