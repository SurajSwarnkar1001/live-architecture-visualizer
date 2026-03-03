import * as vscode from 'vscode';
import * as fs from 'fs';
import { DependencyGraph } from '../graph/GraphTypes';
import { logger } from '../utils/logger';

export async function explainNode(nodeId: string, graph: DependencyGraph): Promise<string> {
    try {
        const node = graph.nodes.find(n => n.id === nodeId);
        if (!node) return "Node not found.";

        const incomingEdges = graph.edges.filter(e => e.target === nodeId).map(e => graph.nodes.find(n => n.id === e.source)?.label || e.source);
        const outgoingEdges = graph.edges.filter(e => e.source === nodeId).map(e => graph.nodes.find(n => n.id === e.target)?.label || e.target);

        // Read first 100 lines
        const content = fs.readFileSync(node.filePath, 'utf8').split('\n').slice(0, 100).join('\n');

        const prompt = `You are a code architect. Analyze this ${node.type} file named ${node.label}.
It imports from: ${outgoingEdges.join(', ') || 'None'}.
It is imported by: ${incomingEdges.join(', ') || 'None'}.
File content (first 100 lines):
${content}

Explain in 3-4 sentences: what this module does, its role in the architecture, and any potential issues (high coupling, god class, etc.).`;

        logger.info(`Requesting AI explanation for ${node.label}`);

        // Use VS Code Language Model API
        const [model] = await vscode.lm.selectChatModels({ vendor: 'copilot', family: 'gpt-4o' });

        if (!model) {
            return "Copilot GPT-4o model not found. Ensure GitHub Copilot Chat is installed and active.";
        }

        const response = await model.sendRequest([vscode.LanguageModelChatMessage.User(prompt)], {}, new vscode.CancellationTokenSource().token);

        let explanation = '';
        for await (const chunk of response.text) {
            explanation += chunk;
        }

        return explanation;
    } catch (err: any) {
        logger.error(`Failed to explain node ${nodeId}`, err);
        return `Failed to generate explanation. ${err.message}`;
    }
}
