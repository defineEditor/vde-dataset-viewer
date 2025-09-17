/**
 * TypeScript interfaces for CDISC Rules Engine JSON Validation Report (Raw Results)
 * Generated from Python implementation in cdisc_rules_engine/services/reporting/json_report.py
 */

import {
    ConformanceDetails,
    DatasetDetail,
    DictionaryVersions,
} from 'interfaces/core.report';

/**
 * Individual error within a rule result
 */
export interface RuleError {
    dataset?: string; // Dataset where the error occurred
    USUBJID?: string; // Subject identifier
    row?: number; // Row number
    SEQ?: number; // Sequence number
    value?: Record<string, string | number>; // Variable values as key-value pairs
}

/**
 * Export parameters for generating the raw report
 */
export interface RawReportExportParams {
    define_version: string;
    cdiscCt: string[];
    standard: string;
    version: string;
    dictionary_versions?: DictionaryVersions;
    raw_report: true; // Always true for raw reports
    substandard?: string;
}

/**
 * Individual rule result within raw result data
 */
export interface RuleResult {
    dataset?: string; // Dataset name
    message?: string; // Result message
    executionStatus?: string; // Execution status for this specific result
    errors?: RuleError[]; // Array of errors found
    variables?: string[]; // Variables involved in the rule
}

/**
 * Raw result data (used when raw_report=True)
 * This is the unprocessed validation result data
 */
export interface RawResultData {
    id: string; // Rule identifier
    executability: string; // Rule executability level
    execution_status: string; // Execution status
    message: string | null; // Rule message
    results: RuleResult[] | string; // Raw results data or error string
}

/**
 * Top-level validation report structure for raw results
 */
export interface RawValidationReport {
    Conformance_Details: ConformanceDetails;
    Dataset_Details: DatasetDetail[];
    results_data: RawResultData[];
}
