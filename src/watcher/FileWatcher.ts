import * as vscode from 'vscode';
import { debounce } from '../utils/debounce';
import { GraphBuilder } from '../graph/GraphBuilder';
import { WebviewProvider } from '../webview/WebviewProvider';
import { logger } from '../utils/logger';

export class FileWatcher {
    private graphBuilder: GraphBuilder;
    private workspaceRoot: string;
    private watcherDisposables: vscode.Disposable[] = [];

    constructor(graphBuilder: GraphBuilder, workspaceRoot: string) {
        this.graphBuilder = graphBuilder;
        this.workspaceRoot = workspaceRoot;
    }

    public startWatching() {
        const debouncedUpdate = debounce(async () => {
            if (WebviewProvider.currentPanel) {
                logger.info('File changes detected, rebuilding graph...');
                const graph = await this.graphBuilder.buildGraph(this.workspaceRoot);
                WebviewProvider.currentPanel.sendMessage({ type: 'GRAPH_UPDATE', payload: graph });
            }
        }, 500);

        const onFileChange = (uri: vscode.Uri) => {
            if (uri.fsPath.match(/\.(ts|js|tsx|jsx|mjs|cjs)$/)) {
                debouncedUpdate();
            }
        };

        const watcher = vscode.workspace.createFileSystemWatcher('**/*.{ts,js,tsx,jsx,mjs,cjs}');

        this.watcherDisposables.push(
            watcher.onDidChange(onFileChange),
            watcher.onDidCreate(onFileChange),
            watcher.onDidDelete(onFileChange),
            vscode.workspace.onDidSaveTextDocument(doc => {
                if (doc.uri.fsPath.match(/\.(ts|js|tsx|jsx|mjs|cjs)$/)) {
                    debouncedUpdate();
                }
            }),
            watcher
        );
    }

    public dispose() {
        this.watcherDisposables.forEach(d => d.dispose());
    }
}
