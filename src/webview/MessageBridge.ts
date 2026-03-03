import { DependencyGraph } from '../graph/GraphTypes';

export type ExtensionToWebviewMessage =
    | { type: 'GRAPH_UPDATE', payload: DependencyGraph }
    | { type: 'THEME_CHANGE', payload: { isDark: boolean } }
    | { type: 'HIGHLIGHT_NODE', payload: { nodeId: string } }
    | { type: 'SHOW_EXPLANATION', payload: { nodeId: string, explanation: string } };

export type WebviewToExtensionMessage =
    | { type: 'OPEN_FILE', payload: { filePath: string, line?: number } }
    | { type: 'EXPLAIN_NODE', payload: { nodeId: string } }
    | { type: 'EXPORT_REQUEST', payload: { format: 'png' | 'json', data?: string } }
    | { type: 'READY' };
