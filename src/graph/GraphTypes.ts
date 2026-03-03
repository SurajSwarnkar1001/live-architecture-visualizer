export type NodeType =
    | 'route' | 'controller' | 'service'
    | 'model' | 'middleware' | 'utility' | 'unknown';

export interface GraphNode {
    id: string;           // absolute file path
    label: string;        // filename without extension
    type: NodeType;
    filePath: string;
    lineCount: number;
    isUnused: boolean;
    isCircular: boolean;
    complexityScore: number;
    exports: string[];    // exported function/class names
}

export interface GraphEdge {
    id: string;
    source: string;       // node id
    target: string;       // node id
    type: 'import' | 'route-handler' | 'service-call' | 'model-usage';
    importName?: string;  // what was imported
}

export interface DependencyGraph {
    nodes: GraphNode[];
    edges: GraphEdge[];
    metadata: {
        scannedAt: number;
        totalFiles: number;
        circularCount: number;
        unusedCount: number;
        overallComplexity: number;
    };
}
