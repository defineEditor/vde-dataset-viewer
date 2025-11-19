import React from 'react';
import { DefineXmlContent } from 'interfaces/defineXml';
import type { Define21, ArmDefine20, ArmDefine21 } from 'parse-define-xml';

/**
 * Helper functions to safely access Define-XML content
 * regardless of version (2.0 or 2.1) or ARM status
 */

export const getOdm = (content: DefineXmlContent) => {
    return content.content.odm;
};

export const getStudy = (content: DefineXmlContent) => {
    const odm = getOdm(content);
    return odm.study;
};

export const getMetaDataVersion = (content: DefineXmlContent) => {
    const study = getStudy(content);
    return study.metaDataVersion;
};

export const getGlobalVariables = (content: DefineXmlContent) => {
    const study = getStudy(content);
    return study.globalVariables;
};

export const getItemGroupDefs = (content: DefineXmlContent) => {
    const metaDataVersion = getMetaDataVersion(content);
    const defs = metaDataVersion.itemGroupDefs || {};
    const order = metaDataVersion.itemGroupDefsOrder || [];
    return order.map((oid) => defs[oid]);
};

export const getItemDefs = (content: DefineXmlContent) => {
    const metaDataVersion = getMetaDataVersion(content);
    const defs = metaDataVersion.itemDefs || {};
    const order = metaDataVersion.itemDefsOrder || [];
    return order.map((oid) => defs[oid]);
};

export const getCodeLists = (content: DefineXmlContent) => {
    const metaDataVersion = getMetaDataVersion(content);
    const lists = metaDataVersion.codeLists || {};
    const order = metaDataVersion.codeListsOrder || [];
    return order.map((oid) => lists[oid]);
};

export const getMethodDefs = (content: DefineXmlContent) => {
    const metaDataVersion = getMetaDataVersion(content);
    const defs = metaDataVersion.methodDefs || {};
    const order = metaDataVersion.methodDefsOrder || [];
    return order.map((oid) => defs[oid]);
};

export const getCommentDefs = (content: DefineXmlContent) => {
    const metaDataVersion = getMetaDataVersion(content);
    const defs = metaDataVersion.commentDefs || {};
    const order = metaDataVersion.commentDefsOrder || [];
    return order.map((oid) => defs[oid]);
};

export const getWhereClauseDefs = (content: DefineXmlContent) => {
    const metaDataVersion = getMetaDataVersion(content);
    const defs = metaDataVersion.whereClauseDefs || {};
    const order = metaDataVersion.whereClauseDefsOrder || [];
    return order.map((oid) => defs[oid]);
};

export const getValueListDefs = (content: DefineXmlContent) => {
    const metaDataVersion = getMetaDataVersion(content);
    const defs = metaDataVersion.valueListDefs || {};
    const order = metaDataVersion.valueListDefsOrder || [];
    return order.map((oid) => defs[oid]);
};

export const getStandards = (content: DefineXmlContent) => {
    const metaDataVersion = getMetaDataVersion(content);
    if (content.defineVersion === '2.1') {
        const mdv = metaDataVersion as
            | Define21.MetaDataVersion
            | ArmDefine21.MetaDataVersion;
        const standards = mdv.standards || {};
        const order = mdv.standardsOrder || [];
        return order.map((oid) => standards[oid]);
    }
    return [];
};

export const getLeafs = (content: DefineXmlContent) => {
    const metaDataVersion = getMetaDataVersion(content);
    const leafs = metaDataVersion.leafs || {};
    const order = metaDataVersion.leafsOrder || [];
    return order.map((id) => leafs[id]);
};

// ARM-specific helpers
export const getAnalysisResultDisplays = (
    content: DefineXmlContent,
): ArmDefine21.ResultDisplay[] => {
    if (!content.arm) return [];
    const metaDataVersion = getMetaDataVersion(content);
    if (content.defineVersion === '2.0') {
        const mdv = metaDataVersion as ArmDefine20.MetaDataVersion;
        const displays = mdv.analysisResultDisplays?.resultDisplays || {};
        const order = mdv.analysisResultDisplays?.resultDisplayOrder || [];
        return order.map((oid) => displays[oid]);
    }
    const mdv = metaDataVersion as ArmDefine21.MetaDataVersion;
    const displays = mdv.analysisResultDisplays?.resultDisplays || {};
    const order = mdv.analysisResultDisplays?.resultDisplayOrder || [];
    return order.map((oid) => displays[oid]);
};

/**
 * Get translated text, preferring English
 */
export const getTranslatedText = (
    texts: { xml_lang?: string; value: string }[] | undefined,
    lang = 'en',
): string => {
    if (!texts || texts.length === 0) return '';
    const preferred = texts.find((t) => t.xml_lang === lang);
    return preferred?.value || texts[0]?.value || '';
};

/**
 * Get text content from an element
 */
export const getTextContent = (
    element: { $t?: string } | string | undefined,
): string => {
    if (!element) return '';
    if (typeof element === 'string') return element;
    return element.$t || '';
};

/**
 * Display Standard reference (Define-XML v2.1)
 * Returns formatted standard reference like "[SDTMIG 3.2]"
 */
export const displayStandard = (
    standardOid: string | undefined,
    standards: Array<{
        oid: string;
        name?: string;
        publishingSet?: string;
        version?: string;
    }>,
): React.ReactNode => {
    if (!standardOid) return null;

    const standard = standards.find((s) => s.oid === standardOid);
    if (!standard) return null;

    const parts = [
        standard.name,
        standard.publishingSet,
        standard.version,
    ].filter(Boolean);

    if (parts.length === 0) return null;

    return React.createElement(
        'span',
        { className: 'standard-refeference' },
        `[${parts.join(' ')}]`,
    );
};

/**
 * Display Non Standard indicator (Define-XML v2.1)
 * Returns "[Non Standard]" if item is marked as non-standard
 */
export const displayNonStandard = (
    isNonStandard: boolean | undefined,
): React.ReactNode => {
    const isNonStandardValue = isNonStandard === true;

    if (!isNonStandardValue) return null;

    return React.createElement(
        'span',
        { className: 'standard-refeference' },
        '[Non Standard]',
    );
};

/**
 * Display No Data indicator (Define-XML v2.1)
 * Returns "[No Data]" if dataset has no data
 */
export const displayNoData = (
    hasNoData: boolean | undefined,
): React.ReactNode => {
    const hasNoDataValue = hasNoData === true;

    if (!hasNoDataValue) return null;

    return React.createElement('span', { className: 'nodata' }, '[No Data]');
};
