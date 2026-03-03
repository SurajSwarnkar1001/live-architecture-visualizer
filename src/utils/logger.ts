import * as vscode from 'vscode';

const outputChannel = vscode.window.createOutputChannel('Live Architecture Visualizer');

export const logger = {
    info: (message: string) => outputChannel.appendLine(`[INFO] ${new Date().toISOString()} - ${message}`),
    warn: (message: string) => outputChannel.appendLine(`[WARN] ${new Date().toISOString()} - ${message}`),
    error: (message: string, error?: any) => {
        outputChannel.appendLine(`[ERROR] ${new Date().toISOString()} - ${message}`);
        if (error) {
            outputChannel.appendLine(error instanceof Error ? error.stack || error.message : String(error));
        }
    },
    show: () => outputChannel.show()
};
