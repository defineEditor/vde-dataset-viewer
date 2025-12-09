import { IpcMainInvokeEvent } from 'electron';
import { DefineFileInfo, DefineXmlContent } from 'interfaces/common';
import parseDefineXml from 'parse-define-xml';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import readline from 'readline';
import openFile from 'main/openFile';

const getHash = (str: string): string => {
    const timestamp = Date.now();
    const hash = crypto
        .createHash('md5')
        .update(`${str}${timestamp}`)
        .digest('hex');
    return hash;
};

class DefineXmlManager {
    private openedXmlFiles: { [fileId: string]: DefineFileInfo } = {};

    constructor() {
        this.openedXmlFiles = {};
    }

    /**
     * Generates a unique file ID for the given file path
     */
    private getFileId = (pathToFile: string): string => {
        // Check if the file is already opened
        const foundFileIds = Object.keys(this.openedXmlFiles).filter(
            (fileId) => {
                return this.openedXmlFiles[fileId].fullPath === pathToFile;
            },
        );

        if (foundFileIds.length > 0) {
            return foundFileIds[0];
        }

        // Create a new ID
        const allIds = Object.keys(this.openedXmlFiles);
        let hash: string;
        do {
            const filename = path.parse(pathToFile).name;
            hash = `${filename}_${getHash(path.normalize(pathToFile))}`;
        } while (allIds.includes(hash));
        return hash;
    };

    /**
     * Reads ODM element attributes from the Define-XML file to determine version and ARM presence
     * without doing a full parse of the entire XML document
     */
    private readOdmAttributes = async (
        filePath: string,
    ): Promise<{
        defineVersion: '2.0' | '2.1';
        arm: boolean;
    }> => {
        const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        let odmTag = '';
        let insideOdmTag = false;

        try {
            for await (const line of rl) {
                // Look for the opening <ODM tag
                if (!insideOdmTag && /^\s*<odm(\s+|$)/i.test(line)) {
                    insideOdmTag = true;
                    odmTag += line;
                } else if (insideOdmTag) {
                    odmTag += line;
                }

                // Check if we've found the complete opening tag (ends with >)
                if (insideOdmTag && odmTag.includes('>')) {
                    // Extract just the opening tag, not any content after it
                    const tagEndIndex = odmTag.indexOf('>');
                    odmTag = odmTag.substring(0, tagEndIndex + 1);
                    break;
                }
            }

            rl.close();
            fileStream.close();

            if (!odmTag) {
                throw new Error(
                    'Invalid Define-XML file: ODM element not found',
                );
            }

            // Extract xmlns:def attribute to determine version
            let defineVersion: '2.0' | '2.1' = '2.0';
            const defNamespaceMatch = odmTag.match(/xmlns:def="([^"]+)"/);
            if (defNamespaceMatch) {
                const defNamespace = defNamespaceMatch[1];
                if (defNamespace === 'http://www.cdisc.org/ns/def/v2.1') {
                    defineVersion = '2.1';
                } else if (
                    defNamespace === 'http://www.cdisc.org/ns/def/v2.0'
                ) {
                    defineVersion = '2.0';
                }
            }

            // Check for ARM (Analysis Results Metadata) namespace
            let arm: boolean = false;
            const armNamespaceMatch = odmTag.match(/xmlns:arm="([^"]+)"/);
            if (armNamespaceMatch) {
                arm = true;
            }

            return {
                defineVersion,
                arm,
            };
        } catch (error) {
            rl.close();
            fileStream.close();
            throw error;
        }
    };

    /**
     * Opens a Define-XML file and returns metadata information
     * Does NOT parse the full XML content, only reads ODM attributes
     */
    public openDefineXml = async (
        _event: IpcMainInvokeEvent,
        filePath?: string,
    ): Promise<DefineFileInfo | null> => {
        // If the file is not specified, allow user to select via dialog
        let definePath: string = filePath || '';
        if (!filePath) {
            const newPath = await openFile(undefined, [
                {
                    name: 'Define-XML',
                    extensions: ['xml'],
                },
            ]);
            if (!newPath) {
                // Open cancelled
                return null;
            }
            definePath = newPath.path;
        }
        // Check if file exists
        if (!fs.existsSync(definePath)) {
            throw new Error(`File not found: ${definePath}`);
        }

        // Get file stats
        const stats = await fsPromises.stat(definePath);
        const parsedPath = path.parse(definePath);

        // Read ODM attributes to get version and ARM status
        const { defineVersion, arm } = await this.readOdmAttributes(definePath);

        // Generate file ID
        const fileId = this.getFileId(definePath);

        // Return metadata only
        const fileInfo: DefineFileInfo = {
            fileId,
            fullPath: definePath,
            folder: parsedPath.dir,
            filename: parsedPath.base,
            format: 'xml',
            size: stats.size,
            lastModified: stats.mtime.getTime(),
            defineVersion,
            arm,
        };

        // Store file path for later retrieval
        this.openedXmlFiles[fileId] = fileInfo;

        return fileInfo;
    };

    /**
     * Returns the complete XML file content as a string
     * for the renderer process to parse on-demand
     */
    public getDefineXmlContent = async (
        _event: IpcMainInvokeEvent,
        fileId: string,
    ): Promise<DefineXmlContent> => {
        const fileInfo = this.openedXmlFiles[fileId];
        if (!fileInfo) {
            throw new Error(`Define file not found for ID: ${fileId}`);
        }

        const xmlContent = await fsPromises.readFile(fileInfo.fullPath, 'utf8');

        // Parse XML content
        const parsedXml = await parseDefineXml(
            xmlContent,
            fileInfo.defineVersion,
            fileInfo.arm,
        );
        return {
            defineVersion: fileInfo.defineVersion,
            arm: fileInfo.arm,
            type: 'xml',
            content: parsedXml,
        };
    };

    /**
     * Closes a Define-XML file and cleans up resources
     */
    public closeDefineXml = async (
        _event: IpcMainInvokeEvent,
        fileId: string,
    ): Promise<boolean> => {
        if (this.openedXmlFiles[fileId]) {
            delete this.openedXmlFiles[fileId];
            return true;
        }
        return false;
    };
}

export default DefineXmlManager;
