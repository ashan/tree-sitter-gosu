import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

interface ErrorDetail {
    type: string;
    position: string; // "[row:col]-[row:col]" (1-based)
    text: string;
}

interface FileErrors {
    file: string;
    errors: ErrorDetail[];
}

interface Summary {
    totalFiles: number;
    successfulFiles: number;
    failedFilesCount: number;
    totalErrors: number;
    errorsByType: Record<string, number>;
    filesWithErrors: string[];
    successRate: string;
    parseTimeSeconds: number;
    filesPerSecond: number;
}

interface Report {
    timestamp: string;
    targetDir: string;
    summary: Summary;
    filesWithErrors: FileErrors[];
}

function getAllFiles(dir: string, extensions: string[], fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            getAllFiles(filePath, extensions, fileList);
        } else {
            if (extensions.some(ext => filePath.endsWith(ext))) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

// Extract attributes from XML tag string
function parseAttributes(tag: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const regex = /(\w+)="([^"]*)"/g;
    let match;
    while ((match = regex.exec(tag)) !== null) {
        attrs[match[1]] = match[2];
    }
    return attrs;
}

function formatPosition(attrs: Record<string, string>): string {
    const srow = parseInt(attrs['srow'] || '0') + 1;
    const scol = parseInt(attrs['scol'] || '0') + 1;
    const erow = parseInt(attrs['erow'] || '0') + 1;
    const ecol = parseInt(attrs['ecol'] || '0') + 1;
    return `[${srow}:${scol}]-[${erow}:${ecol}]`;
}

function extractErrors(file: string, xml: string): ErrorDetail[] {
    const found: ErrorDetail[] = [];

    // Regex for ERROR and MISSING tags
    // Matches <ERROR ...>...</ERROR> or <ERROR .../> or <MISSING .../>
    // We do manual scanning to handle nested tags if any (though ERROR usually wraps content)

    let pos = 0;
    while (pos < xml.length) {
        const startError = xml.indexOf('<ERROR', pos);
        const startMissing = xml.indexOf('<MISSING', pos);

        // Find the nearest tag
        let tagType = '';
        let startIdx = -1;

        if (startError !== -1 && (startMissing === -1 || startError < startMissing)) {
            tagType = 'ERROR';
            startIdx = startError;
        } else if (startMissing !== -1) {
            tagType = 'MISSING';
            startIdx = startMissing;
        } else {
            break;
        }

        const endOpenTag = xml.indexOf('>', startIdx);
        if (endOpenTag === -1) break;

        const openTagContent = xml.substring(startIdx, endOpenTag);
        const isSelfClosing = xml[endOpenTag - 1] === '/';
        const attrs = parseAttributes(openTagContent);
        const position = formatPosition(attrs);

        let text = '';
        let nextPos = endOpenTag + 1;

        if (tagType === 'ERROR') {
            if (isSelfClosing) {
                text = '(empty)';
            } else {
                const closeTagStr = '</ERROR>';
                const closeTag = xml.indexOf(closeTagStr, endOpenTag);
                if (closeTag !== -1) {
                    const content = xml.substring(endOpenTag + 1, closeTag);
                    // Simplify content: remove tags, normalize whitespace
                    text = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
                    nextPos = closeTag + closeTagStr.length;
                } else {
                    // Broken XML?
                    text = '(malformed)';
                }
            }
        } else { // MISSING
            // MISSING tags are usually leaf nodes but tree-sitter might wrap?
            // Usually <MISSING type="..."/>
            // But if not self closing?
            if (isSelfClosing) {
                text = attrs['type'] ? `MISSING ${attrs['type']}` : 'MISSING';
            } else {
                // assume it closes?
                const closeTagStr = '</MISSING>';
                const closeTag = xml.indexOf(closeTagStr, endOpenTag);
                if (closeTag !== -1) {
                    text = attrs['type'] ? `MISSING ${attrs['type']}` : 'MISSING';
                    nextPos = closeTag + closeTagStr.length;
                } else {
                    text = 'MISSING';
                }
            }
        }

        found.push({
            type: tagType,
            position: position,
            text: text
        });

        pos = nextPos;
    }

    return found;
}

function analyzeBatch(files: string[], baseDir: string): FileErrors[] {
    const results: FileErrors[] = [];
    if (files.length === 0) return results;

    const cmd = `tree-sitter parse --xml ${files.map(f => `"${f}"`).join(' ')}`;

    try {
        const output = child_process.execSync(cmd, {
            encoding: 'utf8',
            maxBuffer: 50 * 1024 * 1024,
            stdio: ['ignore', 'pipe', 'ignore']
        });

        const parts = output.split('<source_file');

        for (let i = 1; i < parts.length; i++) {
            const fileIndex = i - 1;
            if (fileIndex >= files.length) break;

            const file = files[fileIndex];
            const xmlContent = parts[i];
            const errors = extractErrors(file, xmlContent);

            if (errors.length > 0) {
                results.push({
                    file: path.relative(baseDir, file),
                    errors: errors
                });
            }
        }

    } catch (e: any) {
        // Fallback or recursive split for huge buffers
        if (e.message && e.message.includes('maxBuffer')) {
            const mid = Math.floor(files.length / 2);
            results.push(...analyzeBatch(files.slice(0, mid), baseDir));
            results.push(...analyzeBatch(files.slice(mid), baseDir));
        } else if (e.stdout) {
            // Try to recover partial output
            const output = e.stdout.toString();
            const parts = output.split('<source_file');
            for (let i = 1; i < parts.length; i++) {
                const fileIndex = i - 1;
                if (fileIndex >= files.length) break;
                const file = files[fileIndex];
                const xmlContent = parts[i];
                const errors = extractErrors(file, xmlContent);
                if (errors.length > 0) {
                    results.push({
                        file: path.relative(baseDir, file),
                        errors: errors
                    });
                }
            }
        }
    }
    return results;
}

function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Error: No target directory provided.');
        console.error('Usage: ts-node scripts/analyze_failures.ts <path-to-source-code>');
        console.error('Example: ts-node scripts/analyze_failures.ts ./gsrc');
        process.exit(1);
    }

    const targetDirArg = args[0];
    const GSRC_DIR = path.resolve(process.cwd(), targetDirArg);

    if (!fs.existsSync(GSRC_DIR) || !fs.statSync(GSRC_DIR).isDirectory()) {
        console.error(`Error: Directory not found or invalid: ${GSRC_DIR}`);
        process.exit(1);
    }

    const startTime = Date.now();
    try {
        console.error(`Scanning ${GSRC_DIR} for .gs and .gsx files...`);
        const files = getAllFiles(GSRC_DIR, ['.gs', '.gsx']);
        console.error(`Found ${files.length} files.`);

        const allFileErrors: FileErrors[] = [];
        const errorTypeCounts: Record<string, number> = {};

        const BATCH_SIZE = 50;

        for (let i = 0; i < files.length; i += BATCH_SIZE) {
            const batch = files.slice(i, i + BATCH_SIZE);
            if (i % 500 === 0) process.stderr.write(`Processed ${i}/${files.length}\r`);

            const batchResults = analyzeBatch(batch, GSRC_DIR);

            for (const res of batchResults) {
                // Log failing files (user visibility)
                console.log(`FAIL: ${res.file}`);
                allFileErrors.push(res);

                for (const err of res.errors) {
                    const key = err.type;
                    errorTypeCounts[key] = (errorTypeCounts[key] || 0) + 1;
                }
            }
        }

        const endTime = Date.now();
        const durationSeconds = (endTime - startTime) / 1000;

        const totalFiles = files.length;
        const failedFilesCount = allFileErrors.length;
        const successfulFiles = totalFiles - failedFilesCount;
        const totalErrors = allFileErrors.reduce((acc, f) => acc + f.errors.length, 0);

        const report: Report = {
            timestamp: new Date().toISOString(),
            targetDir: targetDirArg,
            summary: {
                totalFiles: totalFiles,
                successfulFiles: successfulFiles,
                failedFilesCount: failedFilesCount,
                totalErrors: totalErrors,
                errorsByType: errorTypeCounts,
                filesWithErrors: allFileErrors.map(f => f.file),
                successRate: totalFiles > 0 ? ((successfulFiles / totalFiles) * 100).toFixed(2) + '%' : '0.00%',
                parseTimeSeconds: durationSeconds,
                filesPerSecond: durationSeconds > 0 ? Math.round(totalFiles / durationSeconds) : 0
            },
            filesWithErrors: allFileErrors
        };

        fs.writeFileSync('analysis_report.json', JSON.stringify(report, null, 2));

        console.error('\nAnalysis Complete.');
        console.log(`Success: ${successfulFiles}`);
        console.log(`Failures: ${failedFilesCount}`);
        console.log(`Success Rate: ${report.summary.successRate}`);
        console.error(`Full report written to analysis_report.json`);

    } catch (e) {
        console.error('Fatal error in main:', e);
    }
}

main();
