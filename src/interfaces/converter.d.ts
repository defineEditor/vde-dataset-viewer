import { OutputFormat } from 'interfaces/main';
import { DatasetMetadata } from 'interfaces/datasetJson';

export interface ConversionOptions {
    prettyPrint: boolean;
    inEncoding:
        | 'default'
        | 'utf8'
        | 'utf16le'
        | 'base64'
        | 'ucs2'
        | 'latin1'
        | 'ascii';
    outEncoding:
        | 'default'
        | 'utf8'
        | 'utf16le'
        | 'base64'
        | 'ucs2'
        | 'latin1'
        | 'ascii';
    renameFiles: boolean;
    renamePattern: string;
    renameReplacement: string;
}

export interface ConversionConfig {
    options: ConversionOptions;
    metadata: Partial<DatasetMetadata>;
    outputFormat: OutputFormat;
    updateMetadata: boolean;
}
