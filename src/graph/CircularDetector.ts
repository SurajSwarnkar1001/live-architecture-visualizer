import { DependencyGraph } from './GraphTypes';

/**
 * Detects circular dependencies using Depth First Search.
 * @returns A Set of node IDs that belong to a cycle.
 */
export function detectCircularDependencies(graph: DependencyGraph): Set<string> {
    const circularNodes = new Set<string>();
    const adjacencyList = new Map<string, string[]>();

    for (const node of graph.nodes) {
        adjacencyList.set(node.id, []);
    }

    for (const edge of graph.edges) {
        if (adjacencyList.has(edge.source)) {
            adjacencyList.get(edge.source)!.push(edge.target);
        }
    }

    const visited = new Set<string>();
    const recStack = new Set<string>();

    function dfs(nodeId: string, path: string[]) {
        visited.add(nodeId);
        recStack.add(nodeId);
        path.push(nodeId);

        const neighbors = adjacencyList.get(nodeId) || [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                dfs(neighbor, path);
            } else if (recStack.has(neighbor)) {
                // Back edge detected: cycle found
                const cycleStartIndex = path.indexOf(neighbor);
                for (let i = cycleStartIndex; i < path.length; i++) {
                    circularNodes.add(path[i]);
                }
            }
        }

        recStack.delete(nodeId);
        path.pop();
    }

    for (const node of graph.nodes) {
        if (!visited.has(node.id)) {
            dfs(node.id, []);
        }
    }

    return circularNodes;
}
