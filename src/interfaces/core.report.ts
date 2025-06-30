/**
 * TypeScript interfaces for CDISC Rules Engine JSON Validation Report (Parsed Results)
 * Generated from Python implementation in cdisc_rules_engine/services/reporting/json_report.py
 */

/**
 * Conformance details containing metadata about the validation run
 */
export interface ConformanceDetails {
    CORE_Engine_Version: string;
    Report_Generation: string; // ISO datetime string
    Total_Runtime: string; // e.g., "1.26 seconds"
    Standard: string; // e.g., "SDTMIG"
    Version: string; // e.g., "V3.2"
    Substandard: string | null;
    CT_Version: string; // e.g., "sdtmct-2020-12-18"
    Define_XML_Version: string; // e.g., "2.1.0"
    UNII_Version: string | null;
    'Med-RT_Version': string | null;
    Meddra_Version: string | null;
    WHODRUG_Version: string | null;
    LOINC_Version: string | null;
    SNOMED_Version: string | null;
}

/**
 * Dataset details containing metadata about each validated dataset
 */
export interface DatasetDetail {
    filename: string; // e.g., "lb.xpt"
    label: string; // e.g., "Laboratory Test Results"
    path: string; // Full file path
    modification_date: string; // ISO datetime string
    size_kb: number; // File size in kilobytes
    length: number; // Number of records in the dataset
}

/**
 * Issue summary item showing aggregated validation issues per rule per dataset
 */
export interface IssueSummaryItem {
    dataset: string; // Dataset filename
    core_id: string; // Rule identifier, e.g., "CORE-000289"
    message: string; // Rule violation message
    issues: number; // Number of issues found for this rule in this dataset
}

/**
 * Detailed issue item showing specific validation errors
 */
export interface IssueDetailItem {
    core_id: string; // Rule identifier, e.g., "CORE-000289"
    message: string; // Rule violation message
    executability: string; // e.g., "fully executable"
    dataset: string; // Dataset filename
    USUBJID: string; // Subject identifier (can be empty string)
    row: number | string; // Row number where the issue occurred (can be empty string)
    SEQ: number | string; // Sequence number (can be empty string)
    variables: string[]; // Variables involved in the rule violation
    values: string[]; // Values of the variables involved (processed as strings)
}

/**
 * Rules report item showing the execution status of each rule
 */
export interface RulesReportItem {
    core_id: string; // Rule identifier, e.g., "CORE-000001"
    version: string; // Rule version, typically "1"
    cdisc_rule_id: string; // CDISC rule references, e.g., "CG0176, TIG0405"
    fda_rule_id: string; // FDA rule references (can be empty string)
    message: string; // Rule description/message
    status: string; // Execution status: "SUCCESS" or "SKIPPED"
}

/**
 * Dictionary versions used in the validation
 */
export interface DictionaryVersions {
    UNII?: string;
    MEDRT?: string;
    MEDDRA?: string;
    WHODRUG?: string;
    LOINC?: string;
    SNOMED?: string;
}

/**
 * Export parameters for generating the parsed report
 */
export interface ParsedReportExportParams {
    define_version: string;
    cdiscCt: string[];
    standard: string;
    version: string;
    dictionary_versions?: DictionaryVersions;
    raw_report?: false; // Always false or undefined for parsed reports
    substandard?: string;
}

/**
 * Top-level validation report structure for parsed results
 */
export interface ParsedValidationReport {
    Conformance_Details: ConformanceDetails;
    Dataset_Details: DatasetDetail[];
    Issue_Summary: IssueSummaryItem[];
    Issue_Details: IssueDetailItem[];
    Rules_Report: RulesReportItem[];
}
