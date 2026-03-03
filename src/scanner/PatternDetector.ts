import { NodeType } from '../graph/GraphTypes';

export interface FileTraits {
    hasExpressRouter?: boolean;
    hasMongooseModel?: boolean;
}

export function detectNodeType(filePath: string, traits?: FileTraits): NodeType {
    const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();

    // 1. Detect by traits (AST heuristics)
    if (traits?.hasExpressRouter) {
        return 'route';
    }
    if (traits?.hasMongooseModel) {
        return 'model';
    }

    // 2. Detect by path patterns
    if (normalizedPath.includes('/routes/') || normalizedPath.includes('.route.')) {
        return 'route';
    }
    if (normalizedPath.includes('/controllers/') || normalizedPath.includes('.controller.')) {
        return 'controller';
    }
    if (normalizedPath.includes('/services/') || normalizedPath.includes('.service.')) {
        return 'service';
    }
    if (normalizedPath.includes('/models/') || normalizedPath.includes('.model.')) {
        return 'model';
    }
    if (normalizedPath.includes('/middlewares/') || normalizedPath.includes('/middleware/') || normalizedPath.includes('.middleware.')) {
        return 'middleware';
    }
    if (normalizedPath.includes('/utils/') || normalizedPath.includes('/helpers/')) {
        return 'utility';
    }

    return 'unknown';
}
