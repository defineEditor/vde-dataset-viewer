/* eslint-disable react/no-array-index-key */
import React from 'react';
import type { Define20, Define21, ArmDefine21 } from 'parse-define-xml';
import { getTranslatedText } from './defineXmlHelpers';

type ItemDef = Define20.ItemDef | Define21.ItemDef;
type ItemRef = Define20.ItemRef | Define21.ItemRef;
type CodeList = Define20.CodeList | Define21.CodeList;
type CommentDef = Define20.CommentDef | Define21.CommentDef;
type MethodDef = Define20.MethodDef | Define21.MethodDef;
type Leaf = Define20.Leaf | Define21.Leaf;
type DocumentRef = Define20.DocumentRef | Define21.DocumentRef;

interface ItemAttributes {
    label: string;
    dataType: string;
    role: string;
    lengthDisplay: string;
    codeListContent: React.ReactNode;
}

/**
 * Check if the item should have ISO8601 format
 */
export function checkIsISO8601Format(dataType: string): boolean {
    const iso8601Types = [
        'date',
        'time',
        'datetime',
        'partialDate',
        'partialTime',
        'partialDatetime',
        'incompleteDatetime',
        'durationDatetime',
    ];

    return iso8601Types.includes(dataType);
}

/**
 * Get common item attributes for display in table rows
 */
export function getItemAttributes(
    itemDef: ItemDef,
    itemRef: ItemRef,
    codeLists: Record<string, CodeList>,
): ItemAttributes {
    const label = getTranslatedText(itemDef.description);
    const dataType = itemDef.dataType || '';
    const role = itemRef.role || '';
    const isISO8601Format = checkIsISO8601Format(dataType);

    // Get length or display format
    let lengthDisplay = '';
    if (itemDef.length) {
        lengthDisplay = String(itemDef.length);
    }
    const defDisplayFormat = itemDef.displayFormat;
    if (defDisplayFormat) {
        lengthDisplay = defDisplayFormat; // Display format takes precedence over length
    }

    // Get CodeList content
    let codeListContent: React.ReactNode = '';
    const { codeListRef } = itemDef;

    if (codeListRef) {
        const codeList = codeLists[codeListRef];
        if (codeList) {
            const codeListItems = codeList.codeListItems || [];
            const enumeratedItems = codeList.enumeratedItems || [];
            const { externalCodeList } = codeList;

            if (codeListItems.length > 5 || enumeratedItems.length > 5) {
                codeListContent = (
                    <>
                        <span className="linebreakcell">
                            <a href={`#${codeListRef}`}>{codeList.name}</a>
                        </span>
                        <>
                            <br />[
                            {codeListItems.length || enumeratedItems.length}{' '}
                            Terms]
                        </>
                    </>
                );
            } else {
                const displayItems = codeListItems.slice(0, 5);
                const enumItems = enumeratedItems.slice(0, 5);

                codeListContent = (
                    <>
                        <span className="linebreakcell">
                            <a href={`#${codeListRef}`}>{codeList.name}</a>
                        </span>
                        {displayItems.length > 0 && (
                            <ul className="codelist">
                                {displayItems.map((item) => {
                                    const decode = getTranslatedText(
                                        item.decode,
                                    );
                                    return (
                                        <li
                                            key={item.codedValue}
                                            className="codelist-item"
                                        >
                                            {codeList.dataType === 'text' ? (
                                                <>
                                                    •&nbsp;&quot;
                                                    {item.codedValue}&quot;
                                                </>
                                            ) : (
                                                <>•&nbsp;{item.codedValue}</>
                                            )}
                                            {decode && ` = "${decode}"`}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                        {enumItems.length > 0 && (
                            <ul className="codelist">
                                {enumItems.map((item) => (
                                    <li
                                        key={item.codedValue}
                                        className="codelist-item"
                                    >
                                        {codeList.dataType === 'text' ? (
                                            <>
                                                •&nbsp;&quot;
                                                {item.codedValue}&quot;
                                            </>
                                        ) : (
                                            <>•&nbsp;{item.codedValue}</>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {externalCodeList && (
                            <>
                                <br />
                                <span className="linebreakcell">
                                    {externalCodeList.dictionary}{' '}
                                    {externalCodeList.version}
                                </span>
                            </>
                        )}
                    </>
                );
            }
        }
    } else if (isISO8601Format) {
        codeListContent = <span className="linebreakcell">ISO 8601</span>;
    }

    return {
        label,
        dataType,
        role,
        lengthDisplay,
        codeListContent,
    };
}

/**
 * Render document references as links
 */
export function renderDocumentRefs(
    documentRefs: DocumentRef[] | undefined,
    leafs: Record<string, Leaf>,
): React.ReactNode {
    if (!documentRefs || documentRefs.length === 0) {
        return null;
    }

    return documentRefs.map((docRef) => {
        const { leafId } = docRef;
        const leaf = leafs[leafId];
        if (!leaf) return null;

        const href = leaf.xlink_href || '';
        const title = leaf.title || '';

        // Handle PDF page references
        if (docRef.pdfPageRefs) {
            return docRef.pdfPageRefs.map(
                (pageRef: Define20.PdfPageRef | Define21.PdfPageRef) => {
                    const pageRefs = pageRef.pageRefs || '';
                    if (pageRef.type === 'PhysicalRef') {
                        if (pageRefs) {
                            const pages = pageRefs.split(' ').filter(Boolean);
                            return (
                                <p
                                    key={`docref-${leafId}-${pageRefs}`}
                                    className="linebreakcell"
                                >
                                    {title} [
                                    {pages.map((page, pageIdx) => (
                                        <React.Fragment
                                            key={`page-${page}-${pageRefs}`}
                                        >
                                            {pageIdx > 0 && ', '}
                                            <a
                                                className="external"
                                                href={`${href}#page=${page}`}
                                            >
                                                {page}
                                            </a>
                                            <span className="external-link-gif" />
                                        </React.Fragment>
                                    ))}
                                    ]
                                </p>
                            );
                        }
                        if (pageRef.firstPage || pageRef.lastPage) {
                            const { firstPage, lastPage } = pageRef;
                            return (
                                <p
                                    key={`docref-${leafId}-${pageRefs}`}
                                    className="linebreakcell"
                                >
                                    {title}
                                    {' ['}
                                    <a
                                        className="external"
                                        href={`${href}#page=${firstPage}`}
                                    >
                                        {firstPage}
                                    </a>
                                    <span className="external-link-gif" />-{' '}
                                    <a
                                        className="external"
                                        href={`${href}#page=${lastPage}`}
                                    >
                                        {lastPage}
                                    </a>
                                    <span className="external-link-gif" />]
                                </p>
                            );
                        }
                    } else if (pageRef.type === 'NamedDestination') {
                        const destinations = pageRefs
                            .split(' ')
                            .filter(Boolean);
                        return (
                            <p
                                key={`docref-${leafId}-${pageRefs}`}
                                className="linebreakcell"
                            >
                                {title} [
                                {destinations.map((name, pageIdx) => (
                                    <React.Fragment
                                        key={`page-${name}-${pageRefs}`}
                                    >
                                        {pageIdx > 0 && ', '}
                                        <a
                                            className="external"
                                            href={`${href}#page=${name}`}
                                        >
                                            {name}
                                        </a>
                                        <span className="external-link-gif" />
                                    </React.Fragment>
                                ))}
                                ]
                            </p>
                        );
                    }
                    return null;
                },
            );
        }

        // Regular document link
        return (
            <p key={`docref-${leafId}`} className="linebreakcell">
                <a className="external" href={href}>
                    {title}
                </a>
                <span className="external-link-gif" />
            </p>
        );
    });
}

/**
 * Get origin content with document references
 */
export function getOriginContent(
    itemDef: ItemDef,
    leafs: Record<string, Leaf>,
): React.ReactNode {
    const origins = itemDef.origins || [];
    if (origins.length === 0) return '';

    return origins.map((o: Define20.Origin | Define21.Origin, originIdx) => {
        let originText = o.type;
        if ((o as Define21.Origin).source) {
            originText += ` (Source: ${(o as Define21.Origin).source})`;
        }

        const originDesc = o.description
            ? getTranslatedText(o.description)
            : '';

        const key = `origin-${o.type}-${originIdx}`;

        return (
            <React.Fragment key={key}>
                <div className="linebreakcell">
                    {originText}
                    {o.type === 'Predecessor' &&
                        originDesc &&
                        `: ${originDesc}`}
                </div>
                {o.type !== 'Predecessor' && originDesc && (
                    <p className="linebreakcell">{originDesc}</p>
                )}
                {renderDocumentRefs(o.documentRefs, leafs)}
            </React.Fragment>
        );
    });
}

/**
 * Get method content with document references
 */
export function getMethodContent(
    methodOid: string | undefined,
    methodDefs: Record<string, MethodDef>,
    leafs: Record<string, Leaf>,
): React.ReactNode {
    if (!methodOid) return '';

    const method = methodDefs[methodOid];
    if (!method) return '';

    const methodDesc = getTranslatedText(method.description);

    // Format expression
    const hasFormatExpression = method.formalExpressions;

    return (
        <>
            <div className="method-code">
                {methodDesc}

                {hasFormatExpression && (
                    /* Link to method in the Methods table */
                    <span className="formalexpression-reference">
                        <a href={`#MT.${methodOid}`}>Formal Expression</a>
                    </span>
                )}
            </div>
            {renderDocumentRefs(method.documentRefs || [], leafs)}
        </>
    );
}

/**
 * Get comment content with document references
 */
export function getCommentContent(
    commentOid: string | undefined,
    commentDefs: Record<string, CommentDef>,
    leafs: Record<string, Leaf>,
): React.ReactNode {
    if (!commentOid) return '';

    const comment = commentDefs[commentOid];
    if (!comment) return '';

    const commentText = getTranslatedText(comment.description);

    return (
        <>
            <p className="linebreakcell">{commentText}</p>
            {renderDocumentRefs(comment.documentRefs || [], leafs)}
        </>
    );
}

/**
 * Helper to display value with quotes and decode if applicable
 */
export function displayValue(
    value: string,
    dataType: string,
    codeList: CodeList | undefined,
    isArm: boolean = false,
): string {
    let display = '';
    if (dataType !== 'integer' && dataType !== 'float') {
        display = `"${value}"`;
    } else {
        display = value;
    }

    // In case of ARM, label is not shown
    if (isArm) {
        return display;
    }

    if (codeList && codeList.codeListItems) {
        const item = codeList.codeListItems.find((i) => i.codedValue === value);
        if (item && item.decode) {
            const decodeText = getTranslatedText(item.decode);
            if (decodeText) {
                display += ` (${decodeText})`;
            }
        }
    }
    return display;
}

/**
 * Convert where clause to display text
 * Based on XSLT displayWhereClause template
 */
export function getWhereClauseText(
    whereClauseRefs: string[],
    whereClauseDefs: Record<
        string,
        Define20.WhereClauseDef | Define21.WhereClauseDef
    >,
    itemDefs: Record<string, ItemDef>,
    codelists: Record<string, CodeList>,
    datasetOid: string,
    isArm: boolean = false,
): React.ReactNode {
    if (!whereClauseRefs || whereClauseRefs.length === 0) {
        return '';
    }

    return whereClauseRefs.map((whereOid, whereIndex) => {
        const whereDef = whereClauseDefs[whereOid];
        if (
            !whereDef ||
            !whereDef.rangeChecks ||
            whereDef.rangeChecks.length === 0
        ) {
            return null;
        }

        const { rangeChecks } = whereDef;
        const whereClauseDisplay = rangeChecks.map((rangeCheck, rangeIndex) => {
            const { itemOid } = rangeCheck;
            const comparator = rangeCheck.comparator || '';
            const checkValues = rangeCheck.checkValues || [];

            const itemDef = itemDefs[itemOid];
            const itemName = itemDef?.name || itemOid;
            const dataType = itemDef?.dataType || 'text';
            const codeListRef = itemDef?.codeListRef;
            const codeList = codeListRef ? codelists[codeListRef] : undefined;

            let operatorText = '';
            let valueDisplay: React.ReactNode = '';

            if (comparator === 'IN' || comparator === 'NOTIN') {
                operatorText = comparator === 'IN' ? ' IN ' : ' NOT IN ';
                valueDisplay = (
                    <>
                        {' ('}
                        {checkValues.map((val, idx) => (
                            <p
                                key={`${whereOid}-val-${idx}`}
                                className="linebreakcell"
                            >
                                {displayValue(val, dataType, codeList, isArm)}
                                {idx !== checkValues.length - 1 ? ', ' : ''}
                            </p>
                        ))}
                        {' ) '}
                    </>
                );
            } else {
                switch (comparator) {
                    case 'EQ':
                        operatorText = ' = ';
                        break;
                    case 'NE':
                        operatorText = ' \u2260 ';
                        break;
                    case 'LT':
                        operatorText = ' < ';
                        break;
                    case 'LE':
                        operatorText = ' \u2264 ';
                        break;
                    case 'GT':
                        operatorText = ' > ';
                        break;
                    case 'GE':
                        operatorText = ' \u2265 ';
                        break;
                    default:
                        operatorText = ` ${comparator} `;
                }
                const val = checkValues[0] || '';
                valueDisplay = displayValue(val, dataType, codeList, isArm);
            }

            return (
                <React.Fragment key={whereOid}>
                    {rangeIndex > 0 && <> and {!isArm && <br />}</>}
                    <a href={`#${datasetOid}.${itemOid}`} title={itemDef?.name}>
                        {itemName}
                    </a>
                    {operatorText}
                    {valueDisplay}
                </React.Fragment>
            );
        });

        return (
            <React.Fragment key={whereOid}>
                {whereIndex > 0 && (
                    <>
                        {' '}
                        or <br />
                    </>
                )}
                {whereClauseDisplay}
            </React.Fragment>
        );
    });
}

/**
 * Get Analysis Parameter display
 * Based on XSLT logic for displaying analysis parameters
 */
export function getAnalysisParameterDisplay(
    dataset: ArmDefine21.AnalysisDataset,
    parameterOid: string,
    whereClauseDefs: Record<
        string,
        Define20.WhereClauseDef | Define21.WhereClauseDef
    >,
    itemDefs: Record<string, ItemDef>,
    codeLists: Record<string, CodeList>,
): React.ReactNode {
    const { whereClauseRefs } = dataset;
    if (!whereClauseRefs || whereClauseRefs.length === 0) return null;

    return (
        <React.Fragment key={dataset.itemGroupOid}>
            {whereClauseRefs.map((whereOid) => {
                const whereDef = whereClauseDefs[whereOid];
                if (!whereDef) return null;

                const rangeChecks = whereDef.rangeChecks.filter(
                    (rc) => rc.itemOid === parameterOid,
                );

                if (rangeChecks.length === 0) return null;

                return (
                    <React.Fragment key={whereOid}>
                        {rangeChecks.map((rangeCheck, rangeIndex: number) => {
                            const { itemOid } = rangeCheck;
                            const comparator = rangeCheck.comparator || '';
                            const checkValues = rangeCheck.checkValues || [];

                            const itemDef = itemDefs[itemOid];
                            const itemName = itemDef?.name || itemOid;
                            const dataType = itemDef?.dataType || 'text';
                            const codeListRef = itemDef?.codeListRef;
                            const codeList = codeListRef
                                ? codeLists[codeListRef]
                                : undefined;

                            let operatorText = '';
                            let valueDisplay: React.ReactNode = '';

                            if (comparator === 'IN' || comparator === 'NOTIN') {
                                operatorText =
                                    comparator === 'IN' ? ' IN ' : ' NOT IN ';
                                valueDisplay = (
                                    <>
                                        {' ('}
                                        {checkValues.map(
                                            (val: string, idx: number) => (
                                                <p
                                                    key={`${whereOid}-val-${idx}`}
                                                    className="linebreakcell"
                                                >
                                                    {displayValue(
                                                        val,
                                                        dataType,
                                                        codeList,
                                                        false,
                                                    )}
                                                    {idx !==
                                                    checkValues.length - 1
                                                        ? ', '
                                                        : ''}
                                                </p>
                                            ),
                                        )}
                                        {' ) '}
                                    </>
                                );
                            } else {
                                switch (comparator) {
                                    case 'EQ':
                                        operatorText = ' = ';
                                        break;
                                    case 'NE':
                                        operatorText = ' \u2260 ';
                                        break;
                                    case 'LT':
                                        operatorText = ' < ';
                                        break;
                                    case 'LE':
                                        operatorText = ' \u2264 ';
                                        break;
                                    case 'GT':
                                        operatorText = ' > ';
                                        break;
                                    case 'GE':
                                        operatorText = ' \u2265 ';
                                        break;
                                    default:
                                        operatorText = ` ${comparator} `;
                                }
                                const val = checkValues[0] || '';
                                valueDisplay = displayValue(
                                    val,
                                    dataType,
                                    codeList,
                                    false,
                                );
                            }

                            return (
                                <React.Fragment
                                    key={`${whereOid}-${rangeIndex}`}
                                >
                                    {rangeIndex > 0 && <> and </>}
                                    <a
                                        href={`#${dataset.itemGroupOid}.${itemOid}`}
                                        title={itemDef?.name}
                                    >
                                        {itemName}
                                    </a>
                                    {operatorText}
                                    {valueDisplay}
                                    <br />
                                </React.Fragment>
                            );
                        })}
                    </React.Fragment>
                );
            })}
        </React.Fragment>
    );
}
