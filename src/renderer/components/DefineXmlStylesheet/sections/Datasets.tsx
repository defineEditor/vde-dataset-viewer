import React from 'react';
import { DefineXmlContent, ArmDefine21 } from 'interfaces/common';
import {
    getItemGroupDefs,
    getItemDefs,
    getCommentDefs,
    getStandards,
    getTranslatedText,
    getMetaDataVersion,
} from 'renderer/components/DefineXmlStylesheet/utils/defineXmlHelpers';
import { getCommentContent } from 'renderer/components/DefineXmlStylesheet/utils/itemRenderHelpers';

interface DatasetsProps {
    content: DefineXmlContent;
}

const Datasets: React.FC<DatasetsProps> = ({ content }) => {
    const { defineVersion } = content;
    const itemGroupDefs = getItemGroupDefs(content);
    const itemDefsArray = getItemDefs(content);
    const commentDefsArray = getCommentDefs(content);
    const metaDataVersion = getMetaDataVersion(content);
    const standards = getStandards(content);
    const leafs = metaDataVersion.leafs || {};

    // Create maps for quick lookup
    const itemDefs = itemDefsArray.reduce(
        (acc, item) => {
            acc[item.oid] = item;
            return acc;
        },
        {} as Record<string, (typeof itemDefsArray)[0]>,
    );

    const commentDefs = commentDefsArray.reduce(
        (acc, comment) => {
            acc[comment.oid] = comment;
            return acc;
        },
        {} as Record<string, (typeof commentDefsArray)[0]>,
    );

    const standardsMap = standards.reduce(
        (acc, std) => {
            acc[std.oid] = std;
            return acc;
        },
        {} as Record<string, (typeof standards)[0]>,
    );

    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid */}
            <a id="datasets" />
            <h1 className="invisible">Datasets</h1>
            <div className="containerbox">
                <table summary="Data Definition Tables" className="datatable">
                    <caption className="header">Datasets</caption>
                    <thead>
                        <tr className="header">
                            <th scope="col">Dataset</th>
                            <th scope="col">Description</th>
                            <th scope="col">Class</th>
                            <th scope="col">Structure</th>
                            <th scope="col">Purpose</th>
                            <th scope="col">Keys</th>
                            <th scope="col">Documentation</th>
                            <th scope="col">Location</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemGroupDefs.map((dataset, index) => {
                            const description = getTranslatedText(
                                dataset.description,
                            );
                            const itemRefs = dataset.itemRefs || {};
                            const itemRefsOrder = dataset.itemRefsOrder || [];

                            // Get key variable names (not OIDs)
                            const keys = itemRefsOrder
                                .map((refOid) => itemRefs[refOid])
                                .filter((ref) => ref?.keySequence)
                                .sort(
                                    (a, b) =>
                                        (a.keySequence || 0) -
                                        (b.keySequence || 0),
                                )
                                .map((ref) => {
                                    const itemDef = itemDefs[ref.itemOid];
                                    return itemDef?.name || ref.itemOid;
                                })
                                .join(', ');

                            // Get comment
                            const { commentOid, standardOid } =
                                dataset as ArmDefine21.ItemGroupDef;
                            const comment = getCommentContent(
                                commentOid,
                                commentDefs,
                                leafs,
                            );
                            // Get standard reference if present
                            const standard = standardOid
                                ? standardsMap[standardOid]
                                : null;
                            const standardRef = standard
                                ? ` [${[standard.name, standard.publishingSet, standard.version].filter(Boolean).join(' ')}]`
                                : '';

                            // Get archive location
                            const { archiveLocationId, leaf } = dataset;
                            const archiveLeaf = archiveLocationId
                                ? leaf?.id === archiveLocationId
                                    ? leaf
                                    : leafs[archiveLocationId]
                                : null;
                            const archiveHref = archiveLeaf?.xlink_href || '';
                            const archiveTitle =
                                archiveLeaf?.title || archiveLocationId || '';

                            // Get class and subclass
                            const classObj = dataset.class;
                            let classDisplay = '';
                            if (typeof classObj === 'string') {
                                classDisplay = classObj;
                            } else if (
                                classObj &&
                                typeof classObj === 'object'
                            ) {
                                // Define 2.1 structure with subClass
                                classDisplay = classObj.name || '';
                                if (
                                    (classObj as ArmDefine21.ItemGroupDefClass)
                                        .subClasses &&
                                    Array.isArray(classObj.subClasses)
                                ) {
                                    const subClasses = classObj.subClasses
                                        .map((sc) => sc.name)
                                        .filter(Boolean)
                                        .join(', ');
                                    if (subClasses) {
                                        classDisplay += ` - ${subClasses}`;
                                    }
                                }
                            } else if (dataset.class) {
                                classDisplay = String(dataset.class);
                            }

                            // Check for NoData indicator
                            let hasNoData = false;
                            let isNonStandard = false;
                            if (defineVersion.startsWith('2.1')) {
                                hasNoData =
                                    (dataset as ArmDefine21.ItemGroupDef)
                                        .hasNoData || false;
                                isNonStandard =
                                    (dataset as ArmDefine21.ItemGroupDef)
                                        .isNonStandard || false;
                            }

                            const rowClass =
                                index % 2 === 0
                                    ? 'tableroweven'
                                    : 'tablerowodd';

                            return (
                                <tr
                                    key={dataset.oid}
                                    id={dataset.oid}
                                    className={rowClass}
                                >
                                    <td>
                                        <a href={`#IG.${dataset.oid}`}>
                                            {dataset.name}
                                        </a>
                                        {standardRef && (
                                            <span className="standard-reference">
                                                {standardRef}
                                            </span>
                                        )}
                                        {isNonStandard && (
                                            <span className="standard-reference">
                                                {' [Non Standard]'}
                                            </span>
                                        )}
                                        {hasNoData && (
                                            <span className="nodata">
                                                {' [No Data]'}
                                            </span>
                                        )}
                                    </td>
                                    <td>{description}</td>
                                    <td>{classDisplay}</td>
                                    <td>{dataset.structure || ''}</td>
                                    <td>{dataset.purpose || ''}</td>
                                    <td>{keys}</td>
                                    <td>{comment}</td>
                                    <td>
                                        {archiveHref ? (
                                            <>
                                                <a
                                                    href={archiveHref}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="external"
                                                >
                                                    {archiveTitle}
                                                </a>
                                                <span className="external-link-gif" />
                                            </>
                                        ) : (
                                            ''
                                        )}
                                    </td>
                                </tr>
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

export default Datasets;
