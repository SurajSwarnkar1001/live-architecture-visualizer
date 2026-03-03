import * as fs from 'fs';
import * as path from 'path';
import { DependencyGraph, GraphNode, GraphEdge } from './GraphTypes';
import { parseFile, ParsedFileResult } from '../scanner/ASTParser';
import { detectNodeType } from '../scanner/PatternDetector';
import { resolveImportPath } from '../scanner/ImportResolver';
import { calculateComplexity } from './ComplexityScorer';
import { detectCircularDependencies } from './CircularDetector';
import { getLabel, normalizePath } from '../utils/pathUtils';
import { scanWorkspace } from '../scanner/FileScanner';
import { logger } from '../utils/logger';

export class GraphBuilder {
    private cache = new Map<string, { mtime: number, result: ParsedFileResult }>();

    /**
     * Builds or rebuilds the entire visual architecture graph.
     */
    public async buildGraph(workspaceRoot: string): Promise<DependencyGraph> {
        logger.info(`Starting graph build for ${workspaceRoot}`);
        const files = await scanWorkspace(workspaceRoot);

        const nodes: GraphNode[] = [];
        const edges: GraphEdge[] = [];
        const fileSet = new Set(files);

        // 1. AST Parsing & Node Creation
        for (const file of files) {
            try {
                const stat = fs.statSync(file);
                let parseResult: ParsedFileResult;

                // Use Cache if unmodified
                const cached = this.cache.get(file);
                if (cached && cached.mtime === stat.mtimeMs) {
                    parseResult = cached.result;
                } else {
                    parseResult = parseFile(file);
                    this.cache.set(file, { mtime: stat.mtimeMs, result: parseResult });
                }

                const nodeType = detectNodeType(file, {
                    hasExpressRouter: parseResult.hasExpressRouter,
                    hasMongooseModel: parseResult.hasMongooseModel
                });

                nodes.push({
                    id: file,
                    label: getLabel(file),
                    type: nodeType,
                    filePath: file,
                    lineCount: parseResult.lineCount,
                    isUnused: false,     // Calculated later
                    isCircular: false,   // Calculated later
                    complexityScore: 0,  // Calculated later
                    exports: parseResult.exports
                });
            } catch (err) {
                logger.error(`Error processing file node ${file}`, err);
            }
        }

        // 2. Edge mapping & Dependency Resolution
        let edgeIdCounter = 1;
        for (const file of files) {
            const cached = this.cache.get(file);
            if (!cached) continue;

            const dir = path.dirname(file);
            for (const imp of cached.result.imports) {
                const resolvedPath = resolveImportPath(dir, imp.source);
                if (resolvedPath && fileSet.has(resolvedPath)) {
                    // Create an Edge
                    edges.push({
                        id: `e${edgeIdCounter++}`,
                        source: file,
                        target: resolvedPath,
                        type: 'import', // Future enhancement: detect specific interaction type
                        importName: imp.name
                    });
                }
            }
        }

        const graph: DependencyGraph = {
            nodes,
            edges,
            metadata: {
                scannedAt: Date.now(),
                totalFiles: nodes.length,
                circularCount: 0,
                unusedCount: 0,
                overallComplexity: 0
            }
        };

        // 3. Post-processing: Compute degrees, complexity, and unused marks
        this.postProcessGraph(graph);

        logger.info(`Completed graph build: ${nodes.length} nodes, ${edges.length} edges.`);
        return graph;
    }

    private postProcessGraph(graph: DependencyGraph) {
        const incomingEdgesMap = new Map<string, number>();
        const outgoingEdgesMap = new Map<string, number>();

        for (const node of graph.nodes) {
            incomingEdgesMap.set(node.id, 0);
            outgoingEdgesMap.set(node.id, 0);
        }

        for (const edge of graph.edges) {
            outgoingEdgesMap.set(edge.source, (outgoingEdgesMap.get(edge.source) || 0) + 1);
            incomingEdgesMap.set(edge.target, (incomingEdgesMap.get(edge.target) || 0) + 1);
        }

        let totalComplexity = 0;

        for (const node of graph.nodes) {
            const incoming = incomingEdgesMap.get(node.id) || 0;
            const outgoing = outgoingEdgesMap.get(node.id) || 0;

            node.complexityScore = calculateComplexity(node.lineCount, incoming, outgoing);
            totalComplexity += node.complexityScore;

            // Simple unused detection: not imported by anything, and not a likely entry point
            if (incoming === 0 && !node.label.match(/^(index|main|server|app)$/i)) {
                node.isUnused = true;
                graph.metadata.unusedCount++;
            }
        }

        // Detect Circular Dependencies
        const circularNodes = detectCircularDependencies(graph);
        for (const node of graph.nodes) {
            if (circularNodes.has(node.id)) {
                node.isCircular = true;
            }
        }

        graph.metadata.circularCount = circularNodes.size;

        if (graph.nodes.length > 0) {
            graph.metadata.overallComplexity = Math.round(totalComplexity / graph.nodes.length);
        }
    }
}
