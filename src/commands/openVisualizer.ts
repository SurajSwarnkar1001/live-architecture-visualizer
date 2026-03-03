import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { WebviewProvider } from '../webview/WebviewProvider';
import { GraphBuilder } from '../graph/GraphBuilder';
import { FileWatcher } from '../watcher/FileWatcher';
import { explainNode } from '../ai/NodeExplainer';

let fileWatcher: FileWatcher | undefined;
let graphBuilder: GraphBuilder | undefined;
let currentGraph: any;

export async function openVisualizerCmd(context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('Live Architecture Visualizer requires an open workspace.');
        return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;

    WebviewProvider.createOrShow(context.extensionUri);
    const panel = WebviewProvider.currentPanel;

    if (!panel) return;

    if (!graphBuilder) {
        graphBuilder = new GraphBuilder();
    }

    if (!fileWatcher) {
        fileWatcher = new FileWatcher(graphBuilder, workspaceRoot);
        fileWatcher.startWatching();
    }

    vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Scanning Architecture...' }, async () => {
        currentGraph = await graphBuilder!.buildGraph(workspaceRoot);
        panel.sendMessage({ type: 'GRAPH_UPDATE', payload: currentGraph });
    });

    panel.onMessageReceived.event(async message => {
        switch (message.type) {
            case 'READY':
                if (currentGraph) {
                    panel.sendMessage({ type: 'GRAPH_UPDATE', payload: currentGraph });
                }
                break;
            case 'OPEN_FILE':
                const doc = await vscode.workspace.openTextDocument(message.payload.filePath);
                await vscode.window.showTextDocument(doc);
                break;
            case 'EXPLAIN_NODE':
                vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Generating AI Explanation...' }, async () => {
                    const explanation = await explainNode(message.payload.nodeId, currentGraph);
                    panel.sendMessage({ type: 'SHOW_EXPLANATION', payload: { nodeId: message.payload.nodeId, explanation } });
                });
                break;
            case 'EXPORT_REQUEST':
                if (message.payload.data) {
                    const defaultUri = vscode.Uri.file(path.join(workspaceRoot, `architecture-export.${message.payload.format}`));
                    const uri = await vscode.window.showSaveDialog({ defaultUri, filters: { 'Export': [message.payload.format] } });
                    if (uri) {
                        try {
                            const buffer = message.payload.format === 'png'
                                ? Buffer.from(message.payload.data.split(',')[1] || message.payload.data, 'base64')
                                : Buffer.from(message.payload.data, 'utf8');
                            fs.writeFileSync(uri.fsPath, buffer);
                            vscode.window.showInformationMessage(`Exported ${message.payload.format.toUpperCase()} successfully!`);
                        } catch (err) {
                            vscode.window.showErrorMessage(`Failed to export file: ${err}`);
                        }
                    }
                }
                break;
        }
    });
}
