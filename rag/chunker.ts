import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { XMLParser } from 'fast-xml-parser';

export interface CodeChunk {
    file_path: string;
    start_line: number;
    end_line: number;
    content: string;
    context: string;
    node_type: string;
}

export class GosuChunker {
    private xmlParser: XMLParser;
    private grammarPath: string;

    constructor(grammarPath?: string) {
        this.grammarPath = grammarPath || path.resolve(__dirname, '..');
        this.xmlParser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "", // easier access
            isArray: (name, jpath, isLeafNode, isAttribute) => {
                // We want children to always be arrays so traversal is uniform
                // But fast-xml-parser is tricky with mixed content.
                // Let's rely on checking strict structure or just 'children' logic?
                // tree-sitter-cli xml output is flat tags. Nested tags are children.
                if (name === "source_file") return false;
                return false; // let's handle arrays manually or just let it be single object if one child
            }
        });
    }

    async parseFile(filePath: string): Promise<CodeChunk[]> {
        const xml = await this.runTreeSitterCLI(filePath);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const lines = fileContent.split(/\r?\n/);

        const jsonObj = this.xmlParser.parse(xml);
        const root = jsonObj.source_file;

        const chunks: CodeChunk[] = [];
        if (root) {
            this.traverseKeyedObject(root, filePath, [], chunks, lines);
        }

        return chunks;
    }

    private runTreeSitterCLI(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const child = spawn('tree-sitter', ['parse', '--xml', filePath], {
                cwd: this.grammarPath // Run from grammar root to find language config
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => stdout += data);
            child.stderr.on('data', (data) => stderr += data);

            child.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`tree-sitter exited with code ${code}: ${stderr}`));
                } else {
                    resolve(stdout);
                }
            });

            child.on('error', (err) => {
                reject(err);
            });
        });
    }

    // Custom traversal for Fast-XML-Parser output structure
    private traverseKeyedObject(obj: any, filePath: string, contextStack: string[], chunks: CodeChunk[], fileLines: string[]) {
        for (const key of Object.keys(obj)) {
            // Skip attributes
            if (['srow', 'scol', 'erow', 'ecol', '#text'].includes(key)) continue;

            const value = obj[key];
            if (Array.isArray(value)) {
                value.forEach(v => this.visitNode(key, v, filePath, contextStack, chunks, fileLines));
            } else {
                this.visitNode(key, value, filePath, contextStack, chunks, fileLines);
            }
        }
    }

    private visitNode(type: string, node: any, filePath: string, contextStack: string[], chunks: CodeChunk[], fileLines: string[]) {
        if (typeof node !== 'object') return; // text node

        // Check attributes
        const srow = parseInt(node.srow);
        const erow = parseInt(node.erow);

        if (isNaN(srow)) {
            // Maybe just text content or structure without range
            this.traverseKeyedObject(node, filePath, contextStack, chunks, fileLines);
            return;
        }

        let newContext = contextStack;
        let shouldDescend = true;

        if (type === 'package_declaration') {
            const txt = this.getLineRange(fileLines, srow, erow).trim();
            // clean up "package " prefix
            const pkgName = txt.replace(/^package\s+/, '').replace(/;$/, '');
            newContext = [...contextStack, pkgName.trim()];
            shouldDescend = false;
        } else if (['class_declaration', 'enhancement_declaration', 'interface_declaration', 'structure_declaration', 'enum_declaration'].includes(type)) {
            let name = 'Anonymous';
            if (node.identifier && node.identifier['#text']) name = node.identifier['#text'];
            else if (typeof node.identifier === 'string') name = node.identifier; // if simple content
            // fast-xml-parser usually puts text in #text if attributes exist.
            else if (node.name) name = node.name; // In older grammars sometimes

            newContext = [...contextStack, `${type} ${name}`];
        } else if (['function_declaration', 'property_get_declaration', 'property_set_declaration', 'constructor_declaration'].includes(type)) {
            // Create Chunk!
            const content = this.getLineRange(fileLines, srow, erow);

            chunks.push({
                file_path: filePath,
                start_line: srow + 1, // 1-based
                end_line: erow + 1,
                content: content,
                context: contextStack.join(' -> '),
                node_type: type
            });
            shouldDescend = false;
        }

        if (shouldDescend) {
            this.traverseKeyedObject(node, filePath, newContext, chunks, fileLines);
        }
    }

    private getLineRange(lines: string[], startRow: number, endRow: number): string {
        // startRow and endRow are 0-indexed from XML output
        if (startRow < 0 || startRow >= lines.length) return "";
        return lines.slice(startRow, endRow + 1).join('\n');
    }
}
