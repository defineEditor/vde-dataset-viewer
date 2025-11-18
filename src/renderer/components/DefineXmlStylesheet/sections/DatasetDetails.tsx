import React from 'react';
import type {
    Define20,
    Define21,
    ArmDefine20,
    ArmDefine21,
} from 'parse-define-xml';
import { DefineXmlContent } from 'interfaces/defineXml';
import {
    getTranslatedText,
    getItemDefs,
    getCodeLists,
    getCommentDefs,
    getMethodDefs,
    getMetaDataVersion,
    getStandards,
} from '../utils/defineXmlHelpers';

type ItemGroupDef =
    | Define20.ItemGroupDef
    | Define21.ItemGroupDef
    | ArmDefine20.ItemGroupDef
    | ArmDefine21.ItemGroupDef;

interface DatasetDetailsProps {
    content: DefineXmlContent;
    dataset: ItemGroupDef;
}

const DatasetDetails: React.FC<DatasetDetailsProps> = ({
    content,
    dataset,
}) => {
    const description = getTranslatedText(dataset.description);
    const itemRefsOrder = dataset.itemRefsOrder || [];
    const itemRefs = dataset.itemRefs || {};

    const itemDefsArray = getItemDefs(content);
    const codeListsArray = getCodeLists(content);
    const commentDefsArray = getCommentDefs(content);
    const methodDefsArray = getMethodDefs(content);
    const metaDataVersion = getMetaDataVersion(content);
    const standards = getStandards(content);
    const leafs = metaDataVersion.leafs || {};

    // Get standard reference if present
    const { archiveLocationId } = dataset;
    let standardOid: string | undefined;
    if (Object.prototype.hasOwnProperty.call(dataset, 'standardOid')) {
        standardOid = (dataset as Define21.ItemGroupDef).standardOid;
    }
    const standard = standardOid
        ? standards.find((s) => s.oid === standardOid)
        : null;
    const standardRef = standard
        ? ` [${[standard.name, standard.publishingSet, standard.version].filter(Boolean).join(' ')}]`
        : '';

    // Get archive location
    const archiveLeaf = archiveLocationId ? leafs[archiveLocationId] : null;
    const archiveHref = archiveLeaf?.xlink_href || '';
    const archiveTitle = archiveLeaf?.title || archiveLocationId || '';

    // Create maps for quick lookup
    const itemDefs = itemDefsArray.reduce(
        (acc, item) => {
            acc[item.oid] = item;
            return acc;
        },
        {} as Record<string, (typeof itemDefsArray)[0]>,
    );

    const codeLists = codeListsArray.reduce(
        (acc, list) => {
            acc[list.oid] = list;
            return acc;
        },
        {} as Record<string, (typeof codeListsArray)[0]>,
    );

    // Get value lists for VLM
    const valueLists = metaDataVersion.valueListDefs || {};

    // Check if any item has VLM
    const hasVLM = itemRefsOrder.some((refOid) => {
        const itemRef = itemRefs[refOid];
        const itemDef = itemRef ? itemDefs[itemRef.itemOid] : null;
        return itemDef && itemDef.valueListRef;
    });

    const commentDefs = commentDefsArray.reduce(
        (acc, comment) => {
            acc[comment.oid] = comment;
            return acc;
        },
        {} as Record<string, (typeof commentDefsArray)[0]>,
    );

    const methodDefs = methodDefsArray.reduce(
        (acc, method) => {
            acc[method.oid] = method;
            return acc;
        },
        {} as Record<string, (typeof methodDefsArray)[0]>,
    );

    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid */}
            <a id={`IG.${dataset.oid}`} />
            <div className="containerbox">
                <table>
                    <caption>
                        <span>
                            {dataset.name} ({description}) -{' '}
                            {standardRef && (
                                <span className="standard-refeference">
                                    {standardRef}
                                </span>
                            )}
                            {archiveHref && (
                                <span className="dataset">
                                    Location:{' '}
                                    <a
                                        className="external"
                                        href={archiveHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {archiveTitle}
                                    </a>
                                    <span className="external-link-gif" />
                                </span>
                            )}
                        </span>
                    </caption>
                    <thead>
                        <tr className="header">
                            <th scope="col">Variable</th>
                            {hasVLM && <th scope="col">Where Condition</th>}
                            <th scope="col">Label / Description</th>
                            <th scope="col">Type</th>
                            <th scope="col">Role</th>
                            <th scope="col" className="length">
                                Length or Display Format
                            </th>
                            <th scope="col" abbr="Format">
                                Controlled Terms or ISO Format
                            </th>
                            <th scope="col">
                                Origin / Source / Method / Comment
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemRefsOrder.map((refOid, index) => {
                            const itemRef = itemRefs[refOid];
                            const itemDef = itemRef
                                ? itemDefs[itemRef.itemOid]
                                : null;

                            if (!itemDef) {
                                return null;
                            }

                            const label = getTranslatedText(
                                itemDef.description,
                            );
                            const dataType = itemDef.dataType || '';

                            // Get length or display format
                            let lengthDisplay = '';
                            if (itemDef.length) {
                                lengthDisplay = String(itemDef.length);
                            }
                            // Check for display format (ISO 8601, etc.)
                            const defDisplayFormat = itemDef.displayFormat;
                            if (defDisplayFormat) {
                                lengthDisplay = ''; // Display format takes precedence over length
                            }

                            // Get CodeList or ISO format for "Controlled Terms or ISO Format" column
                            let codeListContent: React.ReactNode = '';
                            const { codeListRef } = itemDef;

                            if (codeListRef) {
                                const codeList = codeLists[codeListRef];
                                if (codeList) {
                                    // Display codelist name as link and first 5 items inline
                                    const codeListItems =
                                        codeList.codeListItems || [];
                                    const enumeratedItems =
                                        codeList.enumeratedItems || [];

                                    const displayItems = codeListItems.slice(
                                        0,
                                        5,
                                    );
                                    const enumItems = enumeratedItems.slice(
                                        0,
                                        5,
                                    );

                                    codeListContent = (
                                        <>
                                            <span className="linebreakcell">
                                                <a href={`#${codeListRef}`}>
                                                    {codeList.name}
                                                </a>
                                            </span>
                                            {displayItems.length > 0 && (
                                                <ul className="codelist">
                                                    {displayItems.map(
                                                        (item) => {
                                                            const decode =
                                                                getTranslatedText(
                                                                    item.decode,
                                                                );
                                                            return (
                                                                <li
                                                                    key={
                                                                        item.codedValue
                                                                    }
                                                                    className="codelist-item"
                                                                >
                                                                    •&nbsp;
                                                                    &quot;
                                                                    {
                                                                        item.codedValue
                                                                    }
                                                                    &quot;
                                                                    {decode &&
                                                                        ` = "${decode}"`}
                                                                </li>
                                                            );
                                                        },
                                                    )}
                                                </ul>
                                            )}
                                            {enumItems.length > 0 && (
                                                <ul className="codelist">
                                                    {enumItems.map((item) => (
                                                        <li
                                                            key={
                                                                item.codedValue
                                                            }
                                                            className="codelist-item"
                                                        >
                                                            •&nbsp;&quot;
                                                            {item.codedValue}
                                                            &quot;
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </>
                                    );
                                }
                            } else if (defDisplayFormat) {
                                codeListContent = defDisplayFormat;
                            }

                            // Get Origin with full details
                            let originContent: React.ReactNode = null;
                            const { origins } = itemDef;
                            if (origins) {
                                originContent = origins.map((o, originIdx) => {
                                    if (!o.type) return null;

                                    const key = `origin-${originIdx}`;
                                    let originText = o.type;
                                    if (o.source) {
                                        originText += ` (Source: ${o.source})`;
                                    }

                                    const originDesc = o.description
                                        ? getTranslatedText(o.description)
                                        : '';

                                    return (
                                        <div key={key}>
                                            <div className="linebreakcell">
                                                {originText}
                                                {o.type === 'Predecessor' &&
                                                    originDesc &&
                                                    `: ${originDesc}`}
                                            </div>
                                            {o.type !== 'Predecessor' &&
                                                originDesc && (
                                                    <p className="linebreakcell">
                                                        {originDesc}
                                                    </p>
                                                )}
                                        </div>
                                    );
                                });
                            }

                            // Get Method
                            let methodContent: React.ReactNode = '';
                            const { methodOid } = itemRef;
                            if (methodOid) {
                                const method = methodDefs[methodOid];
                                if (method) {
                                    const methodDesc = getTranslatedText(
                                        method.description,
                                    );
                                    methodContent = (
                                        <div className="method-code">
                                            {methodDesc}
                                        </div>
                                    );
                                }
                            }

                            // Get Comment
                            let commentContent: React.ReactNode = '';
                            const { commentOid } = itemDef;
                            if (commentOid) {
                                const comment = commentDefs[commentOid];
                                if (comment) {
                                    commentContent = (
                                        <p className="linebreakcell">
                                            {getTranslatedText(
                                                comment.description,
                                            )}
                                        </p>
                                    );
                                }
                            }

                            // Build the Origin/Source/Method/Comment column content
                            const originMethodCommentContent = (
                                <>
                                    {originContent}
                                    {methodContent}
                                    {commentContent}
                                </>
                            );

                            // Get Role from ItemRef
                            const role = itemRef.role || '';

                            const rowClass =
                                index % 2 === 0
                                    ? 'tableroweven'
                                    : 'tablerowodd';

                            // Check if this item has VLM
                            const { valueListRef } = itemDef;
                            const hasItemVLM =
                                valueListRef && valueLists[valueListRef];

                            // Prepare VLM rows if this item has value list
                            const vlmRows: React.ReactNode[] = [];
                            if (hasItemVLM) {
                                const valueList = valueLists[valueListRef];
                                const vlItemRefs = valueList.itemRefs || {};
                                const vlItemRefsOrder =
                                    valueList.itemRefsOrder || [];

                                vlItemRefsOrder.forEach((vlRefOid) => {
                                    const vlItemRef = vlItemRefs[vlRefOid];
                                    const vlItemDef = vlItemRef
                                        ? itemDefs[vlItemRef.itemOid]
                                        : null;

                                    if (!vlItemDef) return;

                                    // Get where clause
                                    let whereClauseDisplay: React.ReactNode =
                                        '';
                                    const whereClauseRefs =
                                        vlItemRef.whereClauseRefs || [];
                                    if (whereClauseRefs.length > 0) {
                                        // For now, simple display - full implementation needs WhereClauseDef lookup
                                        whereClauseDisplay = (
                                            <div className="qval-indent">
                                                ➤ Where clause condition
                                            </div>
                                        );
                                    }

                                    // Get VLM item details
                                    const vlLabel = getTranslatedText(
                                        vlItemDef.description,
                                    );
                                    const vlDataType = vlItemDef.dataType || '';
                                    const vlRole = vlItemRef.role || '';

                                    let vlLengthDisplay = '';
                                    if (vlItemDef.length) {
                                        vlLengthDisplay = String(
                                            vlItemDef.length,
                                        );
                                    }

                                    // Get codelist for VLM item
                                    let vlCodeListContent: React.ReactNode = '';
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const vlCodeListOid = vlItemDef.codeListRef;
                                    if (vlCodeListOid) {
                                        const vlCodeList =
                                            codeLists[vlCodeListOid];
                                        if (vlCodeList) {
                                            const vlCodeListItems =
                                                vlCodeList.codeListItems || [];
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            const displayItems =
                                                vlCodeListItems.slice(0, 5);

                                            vlCodeListContent = (
                                                <>
                                                    <span className="linebreakcell">
                                                        <a
                                                            href={`#CL.${vlCodeListOid}`}
                                                        >
                                                            {vlCodeList.name}
                                                        </a>
                                                    </span>
                                                    {displayItems.length >
                                                        0 && (
                                                        <ul className="codelist">
                                                            {displayItems.map(
                                                                (item) => {
                                                                    const decode =
                                                                        getTranslatedText(
                                                                            item.decode,
                                                                        );
                                                                    return (
                                                                        <li
                                                                            key={
                                                                                item.codedValue
                                                                            }
                                                                            className="codelist-item"
                                                                        >
                                                                            •&nbsp;&quot;
                                                                            {
                                                                                item.codedValue
                                                                            }
                                                                            &quot;
                                                                            =
                                                                            &quot;
                                                                            {
                                                                                decode
                                                                            }
                                                                            &quot;
                                                                        </li>
                                                                    );
                                                                },
                                                            )}
                                                        </ul>
                                                    )}
                                                </>
                                            );
                                        }
                                    }

                                    // Get VLM origin/method/comment
                                    let vlOriginContent: React.ReactNode = '';
                                    const vlOrigins =
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        vlItemDef.origins || [];
                                    if (vlOrigins.length > 0) {
                                        vlOriginContent = vlOrigins.map(
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            (o: any, originIdx: number) => {
                                                let originText = o.type;
                                                if (o.source) {
                                                    originText += ` (Source: ${o.source})`;
                                                }
                                                const originDesc = o.description
                                                    ? getTranslatedText(
                                                          o.description,
                                                      )
                                                    : '';

                                                const key = `origin-${o.type}-${originIdx}`;
                                                return (
                                                    <div key={key}>
                                                        <div className="linebreakcell">
                                                            {originText}
                                                            {o.type ===
                                                                'Predecessor' &&
                                                                originDesc &&
                                                                `: ${originDesc}`}
                                                        </div>
                                                        {o.type !==
                                                            'Predecessor' &&
                                                            originDesc && (
                                                                <p className="linebreakcell">
                                                                    {originDesc}
                                                                </p>
                                                            )}
                                                    </div>
                                                );
                                            },
                                        );
                                    }

                                    let vlMethodContent: React.ReactNode = '';
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const vlMethodOid = vlItemRef.methodOid;
                                    if (vlMethodOid) {
                                        const vlMethod =
                                            methodDefs[vlMethodOid];
                                        if (vlMethod) {
                                            const vlMethodDesc =
                                                getTranslatedText(
                                                    vlMethod.description,
                                                );
                                            vlMethodContent = (
                                                <div className="method-code">
                                                    {vlMethodDesc}
                                                </div>
                                            );
                                        }
                                    }

                                    let vlCommentContent: React.ReactNode = '';
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const vlCommentOid = vlItemDef.commentOid;
                                    if (vlCommentOid) {
                                        const vlComment =
                                            commentDefs[vlCommentOid];
                                        if (vlComment) {
                                            vlCommentContent = (
                                                <p className="linebreakcell">
                                                    {getTranslatedText(
                                                        vlComment.description,
                                                    )}
                                                </p>
                                            );
                                        }
                                    }

                                    const vlOriginMethodCommentContent = (
                                        <>
                                            {vlOriginContent}
                                            {vlMethodContent}
                                            {vlCommentContent}
                                        </>
                                    );

                                    // Create VLM row
                                    const vlmRowKey = `${refOid}-vlm-${vlRefOid}`;
                                    const vlmId = `IG.${dataset.oid}.IT.${dataset.oid}.${itemDef.name}`;
                                    vlmRows.push(
                                        <tr
                                            key={vlmRowKey}
                                            className={`vlm ${rowClass} ${vlmId}`}
                                        >
                                            <td>{whereClauseDisplay}</td>
                                            {hasVLM && (
                                                <td aria-label="Where Condition" />
                                            )}
                                            <td>{vlLabel}</td>
                                            <td className="datatype">
                                                {vlDataType}
                                            </td>
                                            <td className="role">{vlRole}</td>
                                            <td className="number">
                                                {vlLengthDisplay}
                                            </td>
                                            <td>{vlCodeListContent}</td>
                                            <td>
                                                {vlOriginMethodCommentContent}
                                            </td>
                                        </tr>,
                                    );
                                });
                            }

                            return (
                                <>
                                    <tr key={refOid} className={rowClass}>
                                        <td>
                                            {/* eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid */}
                                            <a
                                                id={`IG.${dataset.oid}.IT.${dataset.oid}.${itemDef.name}`}
                                            />
                                            {itemDef.name}
                                            {hasItemVLM && (
                                                <span
                                                    className="valuelist-reference"
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => {
                                                        const vlmId = `IG.${dataset.oid}.IT.${dataset.oid}.${itemDef.name}`;
                                                        const rows =
                                                            document.getElementsByClassName(
                                                                vlmId,
                                                            );
                                                        for (
                                                            let j = 0;
                                                            j < rows.length;
                                                            j++
                                                        ) {
                                                            const row = rows[
                                                                j
                                                            ] as HTMLElement;
                                                            if (
                                                                row.style
                                                                    .display ===
                                                                'none'
                                                            ) {
                                                                row.style.display =
                                                                    '';
                                                            } else {
                                                                row.style.display =
                                                                    'none';
                                                            }
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (
                                                            e.key === 'Enter' ||
                                                            e.key === ' '
                                                        ) {
                                                            const vlmId = `IG.${dataset.oid}.IT.${dataset.oid}.${itemDef.name}`;
                                                            const rows =
                                                                document.getElementsByClassName(
                                                                    vlmId,
                                                                );
                                                            for (
                                                                let j = 0;
                                                                j < rows.length;
                                                                j++
                                                            ) {
                                                                const row =
                                                                    rows[
                                                                        j
                                                                    ] as HTMLElement;
                                                                if (
                                                                    row.style
                                                                        .display ===
                                                                    'none'
                                                                ) {
                                                                    row.style.display =
                                                                        '';
                                                                } else {
                                                                    row.style.display =
                                                                        'none';
                                                                }
                                                            }
                                                        }
                                                    }}
                                                >
                                                    {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                                                    <a
                                                        id={`IG.${dataset.oid}.IT.${dataset.oid}.${itemDef.name}`}
                                                        style={{
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        VLM
                                                    </a>
                                                </span>
                                            )}
                                        </td>
                                        {hasVLM && <td>{undefined}</td>}
                                        <td>{label}</td>
                                        <td className="datatype">{dataType}</td>
                                        <td className="role">{role}</td>
                                        <td className="number">
                                            {lengthDisplay}
                                        </td>
                                        <td>{codeListContent}</td>
                                        <td>{originMethodCommentContent}</td>
                                    </tr>
                                    {vlmRows}
                                </>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <p className="linktop">
                Go to the <a href="#main">top</a> of the Define-XML document
            </p>
            <br />
        </>
    );
};

export default DatasetDetails;
