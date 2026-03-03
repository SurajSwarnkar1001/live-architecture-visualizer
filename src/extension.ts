import * as vscode from 'vscode';
import { openVisualizerCmd } from './commands/openVisualizer';
import { logger } from './utils/logger';

export function activate(context: vscode.ExtensionContext) {
    logger.info('Live Architecture Visualizer Extension Activated');

    const openCmd = vscode.commands.registerCommand('liveArchViz.open', () => {
        openVisualizerCmd(context);
    });

    context.subscriptions.push(openCmd, { dispose: () => logger.show() });
}

export function deactivate() { }
