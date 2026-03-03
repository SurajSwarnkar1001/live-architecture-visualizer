export function calculateComplexity(lineCount: number, incomingEdges: number, outgoingEdges: number): number {
    // Basic heuristic: 1 point per 50 lines, +2 for each incoming edge (high coupling), +3 for each outgoing edge (many dependencies)
    let score = Math.floor(lineCount / 50) + (incomingEdges * 2) + (outgoingEdges * 3);
    return Math.min(score, 100); // cap at 100 for normalization
}
