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
    getMetaDataVersion,
    getStandards,
    displayNoData,
    displayNonStandard,
    displayStandard,
    getItemGroupDefs,
} from 'renderer/components/DefineXmlStylesheet/utils/defineXmlHelpers';
import {
    getItemAttributes,
    getOriginContent,
    getMethodContent,
    getCommentContent,
    getWhereClauseText,
} from 'renderer/components/DefineXmlStylesheet/utils/itemRenderHelpers';

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
    const { defineVersion } = content;
    const description = getTranslatedText(dataset.description);
    const itemRefsOrder = dataset.itemRefsOrder || [];
    const itemRefs = dataset.itemRefs || {};

    const itemDefsArray = getItemDefs(content);
    const metaDataVersion = getMetaDataVersion(content);
    const standards = getStandards(content);
    const leafs = metaDataVersion.leafs || {};
    const itemGroupDefsArray = getItemGroupDefs(content);

    // Get standard reference if present
    const { archiveLocationId, hasNoData, standardOid, isNonStandard } =
        dataset as Define21.ItemGroupDef;

    // Get archive location
    const archiveLeaf: null | Define21.Leaf = archiveLocationId
        ? dataset?.leaf || null
        : null;
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

    const codeLists = metaDataVersion.codeLists || {};

    // Get value lists for VLM
    const valueLists = metaDataVersion.valueListDefs || {};

    // Check if any item has VLM
    const hasVLM = itemRefsOrder.some((refOid) => {
        const itemRef = itemRefs[refOid];
        const itemDef = itemRef ? itemDefs[itemRef.itemOid] : null;
        return itemDef && itemDef.valueListRef;
    });

    const commentDefs = metaDataVersion.commentDefs || {};
    const methodDefs = metaDataVersion.methodDefs || {};

    const classObj = dataset.class;
    let classDisplay = '';
    if (typeof classObj === 'string') {
        classDisplay = classObj;
    } else if (classObj && typeof classObj === 'object') {
        classDisplay = classObj.name;
    }

    // Check if there is at least one Role present
    const hasRole = itemRefsOrder.some((refOid) => {
        const itemRef = itemRefs[refOid];
        return itemRef && itemRef.role;
    });

    // Check if this is a SuppQual dataset (starts with SUPP or SQAP)
    const isSuppQual =
        dataset.name.startsWith('SUPP') || dataset.name.startsWith('SQAP');

    // For SuppQual datasets, always show the Role column
    const showRoleColumn = hasRole || isSuppQual;

    // Get where clause definitions for VLM
    const whereClauseDefs = metaDataVersion.whereClauseDefs || {};

    const domain = dataset.domain || '';
    // Check if there is a parent domain and use it's description in the label
    const parentDataset = itemGroupDefsArray.find(
        (ig) => ig.name === domain && ig.name !== dataset.name,
    );

    const parentDatasetLabel = parentDataset
        ? getTranslatedText(parentDataset.description)
        : null;

    const suppDataset = isSuppQual
        ? null
        : itemGroupDefsArray.find(
              (ig) => ig.domain === domain && ig.name !== dataset.name,
          );

    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid */}
            <a id={`${dataset.oid}`} />
            <div className="containerbox">
                <table className="datatable">
                    <caption>
                        <span>
                            {dataset.name} ({description}
                            {parentDatasetLabel
                                ? `, ${parentDatasetLabel}`
                                : ''}
                            ) - {defineVersion === '2.0' ? classDisplay : ''}
                            {standardOid &&
                                displayStandard(standardOid, standards)}
                            {hasNoData && displayNoData(hasNoData)}
                            {isNonStandard && displayNonStandard(isNonStandard)}
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
                        {parentDataset && (
                            <tr>
                                <td colSpan={8}>
                                    Related Parent Dataset:{' '}
                                    <a href={`#${parentDataset.oid}`}>
                                        {parentDataset.name}
                                    </a>
                                    {parentDataset.description
                                        ? ` (${getTranslatedText(
                                              parentDataset.description,
                                          )})`
                                        : ''}
                                </td>
                            </tr>
                        )}
                        {suppDataset && (
                            <tr>
                                <td colSpan={8}>
                                    Related Supplemental Qualifiers Dataset:{' '}
                                    <a href={`#${suppDataset.oid}`}>
                                        {suppDataset.name}
                                    </a>
                                    {suppDataset.description
                                        ? ` (${getTranslatedText(
                                              suppDataset.description,
                                          )})`
                                        : ''}
                                </td>
                            </tr>
                        )}
                        <tr className="header">
                            <th scope="col">Variable</th>
                            {hasVLM && !isSuppQual && (
                                <th scope="col">Where Condition</th>
                            )}
                            <th scope="col">Label / Description</th>
                            <th scope="col">Type</th>
                            {showRoleColumn && <th scope="col">Role</th>}
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

                            // Use utility function to get all item attributes
                            const {
                                label,
                                dataType,
                                role,
                                lengthDisplay,
                                codeListContent,
                            } = getItemAttributes(itemDef, itemRef, codeLists);

                            // Get origin, method, comment content using utility functions
                            const originContent = getOriginContent(
                                itemDef,
                                leafs,
                            );
                            const methodContent = getMethodContent(
                                itemRef.methodOid,
                                methodDefs,
                                leafs,
                            );
                            const commentContent = getCommentContent(
                                itemDef.commentOid,
                                commentDefs,
                                leafs,
                            );

                            const originMethodCommentContent = (
                                <>
                                    {originContent}
                                    {methodContent}
                                    {commentContent}
                                </>
                            );

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

                                    // Use utility functions for VLM item attributes
                                    const {
                                        label: vlLabel,
                                        dataType: vlDataType,
                                        role: vlRole,
                                        lengthDisplay: vlLengthDisplay,
                                        codeListContent: vlCodeListContent,
                                    } = getItemAttributes(
                                        vlItemDef,
                                        vlItemRef,
                                        codeLists,
                                    );

                                    // Get where clause text using utility function
                                    let whereClauseDisplay: React.ReactNode =
                                        '';
                                    const whereClauseRefs =
                                        vlItemRef.whereClauseRefs || [];
                                    if (whereClauseRefs.length > 0) {
                                        whereClauseDisplay = (
                                            <>
                                                {getWhereClauseText(
                                                    whereClauseRefs,
                                                    whereClauseDefs,
                                                    itemDefs,
                                                    codeLists,
                                                    dataset.oid,
                                                )}
                                            </>
                                        );
                                    }

                                    // Get VLM origin/method/comment using utility functions
                                    const vlOriginContent = getOriginContent(
                                        vlItemDef,
                                        leafs,
                                    );
                                    const vlMethodContent = getMethodContent(
                                        vlItemRef.methodOid,
                                        methodDefs,
                                        leafs,
                                    );
                                    const vlCommentContent = getCommentContent(
                                        vlItemDef.commentOid,
                                        commentDefs,
                                        leafs,
                                    );

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

                                    // For SuppQual datasets, show where clause in variable column with arrow prefix
                                    if (isSuppQual) {
                                        vlmRows.push(
                                            <tr
                                                key={vlmRowKey}
                                                className={`vlm ${rowClass} ${vlmId}`}
                                            >
                                                <td>
                                                    <div className="qval-indent">
                                                        ➤ {whereClauseDisplay}
                                                    </div>
                                                </td>
                                                <td>{vlLabel}</td>
                                                <td className="datatype">
                                                    {vlDataType}
                                                </td>
                                                <td className="role">
                                                    {vlRole}
                                                </td>
                                                <td className="number">
                                                    {vlLengthDisplay}
                                                </td>
                                                <td>{vlCodeListContent}</td>
                                                <td>
                                                    {
                                                        vlOriginMethodCommentContent
                                                    }
                                                </td>
                                            </tr>,
                                        );
                                    } else {
                                        vlmRows.push(
                                            <tr
                                                key={vlmRowKey}
                                                className={`vlm ${rowClass} ${vlmId}`}
                                            >
                                                <td>{null}</td>
                                                <td>{whereClauseDisplay}</td>
                                                <td>{vlLabel}</td>
                                                <td className="datatype">
                                                    {vlDataType}
                                                </td>
                                                {showRoleColumn && (
                                                    <td className="role">
                                                        {vlRole}
                                                    </td>
                                                )}
                                                <td className="number">
                                                    {vlLengthDisplay}
                                                </td>
                                                <td>{vlCodeListContent}</td>
                                                <td>
                                                    {
                                                        vlOriginMethodCommentContent
                                                    }
                                                </td>
                                            </tr>,
                                        );
                                    }
                                });
                            }

                            return (
                                <>
                                    <tr key={refOid} className={rowClass}>
                                        <td>
                                            {/* eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid */}
                                            <a
                                                id={`${dataset.oid}.${itemDef.oid}`}
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
                                                        id={`${dataset.oid}.${itemDef.oid}`}
                                                        style={{
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        VLM
                                                    </a>
                                                </span>
                                            )}
                                        </td>
                                        {hasVLM && !isSuppQual && (
                                            <td>{null}</td>
                                        )}
                                        <td>{label}</td>
                                        <td className="datatype">{dataType}</td>
                                        {showRoleColumn && (
                                            <td className="role">{role}</td>
                                        )}
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
