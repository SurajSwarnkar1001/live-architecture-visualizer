import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import * as fs from 'fs';
import { logger } from '../utils/logger';

export interface ParsedFileResult {
    imports: { source: string; name?: string }[];
    exports: string[];
    lineCount: number;
    hasExpressRouter: boolean;
    hasMongooseModel: boolean;
}

export function parseFile(filePath: string): ParsedFileResult {
    const result: ParsedFileResult = {
        imports: [],
        exports: [],
        lineCount: 0,
        hasExpressRouter: false,
        hasMongooseModel: false
    };

    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        result.lineCount = content.split('\n').length;

        const ast = parser.parse(content, {
            sourceType: 'module',
            plugins: [
                'typescript',
                'jsx',
                'decorators-legacy',
                'importAssertions'
            ]
        });

        traverse(ast, {
            // Static Imports
            ImportDeclaration(path) {
                const source = path.node.source.value;
                const specifiers = path.node.specifiers;

                if (specifiers.length > 0) {
                    for (const specifier of specifiers) {
                        if (t.isImportSpecifier(specifier)) {
                            result.imports.push({ source, name: (specifier.imported as t.Identifier).name });
                        } else if (t.isImportDefaultSpecifier(specifier)) {
                            result.imports.push({ source, name: 'default' });
                        } else if (t.isImportNamespaceSpecifier(specifier)) {
                            result.imports.push({ source, name: '*' });
                        }
                    }
                } else {
                    result.imports.push({ source });
                }
            },

            // require(), router calls, mongoose models
            CallExpression(path) {
                const callee = path.node.callee;

                // require('...')
                if (t.isIdentifier(callee, { name: 'require' }) && path.node.arguments.length > 0) {
                    const arg = path.node.arguments[0];
                    if (t.isStringLiteral(arg)) {
                        result.imports.push({ source: arg.value });
                    }
                }

                // dynamic import('...')
                if (callee.type === 'Import' && path.node.arguments.length > 0) {
                    const arg = path.node.arguments[0];
                    if (t.isStringLiteral(arg)) {
                        result.imports.push({ source: arg.value });
                    }
                }

                // Detect mongoose.model('...', schema)
                if (t.isMemberExpression(callee) &&
                    t.isIdentifier(callee.object, { name: 'mongoose' }) &&
                    t.isIdentifier(callee.property, { name: 'model' })) {
                    result.hasMongooseModel = true;
                }

                // Detect router.get/post/put/delete
                if (t.isMemberExpression(callee) && t.isIdentifier(callee.object)) {
                    const objName = callee.object.name.toLowerCase();
                    const propName = t.isIdentifier(callee.property) ? callee.property.name : '';
                    if ((objName === 'router' || objName === 'app') &&
                        ['get', 'post', 'put', 'delete', 'patch', 'use'].includes(propName)) {
                        result.hasExpressRouter = true;
                    }
                }
            },

            // new Schema(...) (mongoose)
            NewExpression(path) {
                const callee = path.node.callee;
                if (t.isIdentifier(callee, { name: 'Schema' }) ||
                    (t.isMemberExpression(callee) && t.isIdentifier(callee.property, { name: 'Schema' }))) {
                    result.hasMongooseModel = true;
                }
            },

            // Named exports
            ExportNamedDeclaration(path) {
                if (path.node.declaration) {
                    if (t.isVariableDeclaration(path.node.declaration)) {
                        for (const decl of path.node.declaration.declarations) {
                            if (t.isIdentifier(decl.id)) {
                                result.exports.push(decl.id.name);
                            }
                        }
                    } else if (t.isFunctionDeclaration(path.node.declaration) || t.isClassDeclaration(path.node.declaration)) {
                        if (path.node.declaration.id) {
                            result.exports.push(path.node.declaration.id.name);
                        }
                    }
                }
            },

            // Default export
            ExportDefaultDeclaration(path) {
                result.exports.push('default');
            }
        });

    } catch (e) {
        logger.error(`Failed to parse file: ${filePath}`, e);
    }

    return result;
}
