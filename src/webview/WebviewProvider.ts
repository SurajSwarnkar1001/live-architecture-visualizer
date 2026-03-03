import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ExtensionToWebviewMessage, WebviewToExtensionMessage } from './MessageBridge';
import { logger } from '../utils/logger';

export class WebviewProvider {
    public static currentPanel: WebviewProvider | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    public onMessageReceived: vscode.EventEmitter<WebviewToExtensionMessage> = new vscode.EventEmitter();

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message: WebviewToExtensionMessage) => {
                this.onMessageReceived.fire(message);
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (WebviewProvider.currentPanel) {
            WebviewProvider.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'liveArchitectureVisualizer',
            'Architecture Visualizer',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist'), vscode.Uri.joinPath(extensionUri, 'src')]
            }
        );

        WebviewProvider.currentPanel = new WebviewProvider(panel, extensionUri);
        logger.info('Webview Panel created.');
    }

    public sendMessage(message: ExtensionToWebviewMessage) {
        this._panel.webview.postMessage(message);
    }

    private _update() {
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'html', 'index.html');
        let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');

        // Resolve paths safely for extension context
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'visualizer.bundle.js'));
        const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'html', 'styles.css'));

        // Inject them into HTML
        htmlContent = htmlContent.replace('<script src="visualizer.js"></script>', `<script src="${scriptUri}"></script>`);
        htmlContent = htmlContent.replace('<link rel="stylesheet" href="styles.css">', `<link rel="stylesheet" href="${cssUri}">`);

        return htmlContent;
    }

    public dispose() {
        WebviewProvider.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
        logger.info('Webview Panel disposed.');
    }
}
