import React from 'react';
import { Define21, DefineXmlContent } from 'interfaces/defineXml';
import {
    getCodeLists,
    getStandards,
    getCommentDefs,
    getTranslatedText,
    getLeafs,
} from 'renderer/components/DefineXmlStylesheet/utils/defineXmlHelpers';
import { getCommentContent } from 'renderer/components/DefineXmlStylesheet/utils/itemRenderHelpers';

interface CodeListsProps {
    content: DefineXmlContent;
}

const CodeLists: React.FC<CodeListsProps> = ({ content }) => {
    const codeListsArray = getCodeLists(content);
    const standards = getStandards(content);
    const commentDefsArray = getCommentDefs(content);
    const commentDefs = commentDefsArray.reduce(
        (acc, comment) => {
            acc[comment.oid] = comment;
            return acc;
        },
        {} as Record<string, (typeof commentDefsArray)[0]>,
    );
    const leafsArray = getLeafs(content);
    const leafs = leafsArray.reduce(
        (acc, leaf) => {
            acc[leaf.id] = leaf;
            return acc;
        },
        {} as Record<string, (typeof leafsArray)[0]>,
    );
    const { defineVersion } = content;

    // Filter codelists that have items (CodeListItems or EnumeratedItems)
    const codeListsWithItems = codeListsArray.filter((cl) => {
        const hasCodeListItems =
            cl.codeListItems && Object.keys(cl.codeListItems).length > 0;
        const hasEnumItems =
            cl.enumeratedItems && Object.keys(cl.enumeratedItems).length > 0;
        return hasCodeListItems || hasEnumItems;
    });

    // Filter codelists that have externalCodeList
    const externalCodeLists = codeListsArray.filter(
        (cl) => cl.externalCodeList,
    );

    if (codeListsWithItems.length === 0 && externalCodeLists.length === 0) {
        return null;
    }

    return (
        <>
            {codeListsWithItems.length > 0 && (
                <>
                    {/* eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid */}
                    <a id="decodelist" />
                    <div className="containerbox">
                        <h1 className="header">CodeLists</h1>

                        {codeListsWithItems.map((codeList) => {
                            const hasCodeListItems =
                                codeList.codeListItems &&
                                Object.keys(codeList.codeListItems).length > 0;
                            const hasEnumItems =
                                codeList.enumeratedItems &&
                                Object.keys(codeList.enumeratedItems).length >
                                    0;
                            // Check if codelist is standard;
                            const { alias } = codeList;
                            let standardName: string | undefined;
                            let standardVersion: string | undefined;
                            let isNonStandard: boolean | undefined;
                            let commentContent: React.ReactNode | undefined;
                            if (defineVersion === '2.1') {
                                const { standardOid, commentOid } =
                                    codeList as Define21.CodeList;
                                // Standard attributes
                                isNonStandard = (codeList as Define21.CodeList)
                                    .isNonStandard;
                                const standard = standards.find(
                                    (std) => std.oid === standardOid,
                                );
                                standardName = standard?.name;
                                standardVersion = standard?.version;
                                // Comment
                                commentContent = getCommentContent(
                                    commentOid,
                                    commentDefs,
                                    leafs,
                                );
                            }

                            // Check if any of the codelist items has an extendedValue
                            let hasExtendedValue = false;
                            if (hasCodeListItems) {
                                hasExtendedValue = Object.values(
                                    codeList.codeListItems!,
                                ).some((item) => item.extendedValue);
                            }
                            if (!hasExtendedValue && hasEnumItems) {
                                hasExtendedValue = Object.values(
                                    codeList.enumeratedItems!,
                                ).some((item) => item.extendedValue);
                            }

                            return (
                                <div
                                    key={codeList.oid}
                                    id={`${codeList.oid}`}
                                    className="codelist"
                                >
                                    <div className="codelist-caption">
                                        {codeList.name}
                                        {alias &&
                                            alias.map((a) => (
                                                <span> [{a.name}]</span>
                                            ))}
                                        {standardName && (
                                            <span>
                                                {' '}
                                                [{standardName}{' '}
                                                {standardVersion}]
                                            </span>
                                        )}
                                        {defineVersion === '2.1' &&
                                            isNonStandard && (
                                                <span> [Non Standard]</span>
                                            )}
                                    </div>

                                    <div className="description">
                                        {commentContent && (
                                            <p className="linebreakcell">
                                                {commentContent}
                                            </p>
                                        )}
                                    </div>

                                    {hasCodeListItems && (
                                        <table
                                            summary={`Controlled Term - ${codeList.name}`}
                                            className="datatable"
                                        >
                                            <thead>
                                                <tr className="header">
                                                    <th
                                                        scope="col"
                                                        className="codedvalue"
                                                    >
                                                        Permitted Value (Code)
                                                    </th>
                                                    <th scope="col">
                                                        Display Value (Decode)
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.values(
                                                    codeList.codeListItems!,
                                                ).map((item, index) => {
                                                    const decode =
                                                        getTranslatedText(
                                                            item.decode,
                                                        );
                                                    const {
                                                        alias: itemAlias,
                                                        extendedValue,
                                                    } = item;
                                                    const rowClass =
                                                        index % 2 === 0
                                                            ? 'tableroweven'
                                                            : 'tablerowodd';

                                                    return (
                                                        <tr
                                                            key={
                                                                item.codedValue
                                                            }
                                                            className={rowClass}
                                                        >
                                                            <td>
                                                                {
                                                                    item.codedValue
                                                                }
                                                                {itemAlias &&
                                                                    itemAlias.map(
                                                                        (a) => (
                                                                            <span>
                                                                                {' '}
                                                                                [
                                                                                {
                                                                                    a.name
                                                                                }

                                                                                ]
                                                                            </span>
                                                                        ),
                                                                    )}
                                                                {extendedValue && (
                                                                    <span>
                                                                        {' [*]'}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="codelist-item-decode">
                                                                {decode}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}

                                    {hasEnumItems && (
                                        <table
                                            summary={`Controlled Term - ${codeList.name}`}
                                            className="datatable"
                                        >
                                            <thead>
                                                <tr className="header">
                                                    <th
                                                        scope="col"
                                                        className="codedvalue"
                                                    >
                                                        Permitted Value
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.values(
                                                    codeList.enumeratedItems!,
                                                ).map((item, index) => {
                                                    const rowClass =
                                                        index % 2 === 0
                                                            ? 'tableroweven'
                                                            : 'tablerowodd';

                                                    const {
                                                        alias: itemAlias,
                                                        extendedValue,
                                                    } = item;
                                                    return (
                                                        <tr
                                                            key={
                                                                item.codedValue
                                                            }
                                                            className={rowClass}
                                                        >
                                                            <td>
                                                                {
                                                                    item.codedValue
                                                                }

                                                                {itemAlias &&
                                                                    itemAlias.map(
                                                                        (a) => (
                                                                            <span>
                                                                                {' '}
                                                                                [
                                                                                {
                                                                                    a.name
                                                                                }

                                                                                ]
                                                                            </span>
                                                                        ),
                                                                    )}
                                                                {extendedValue && (
                                                                    <span>
                                                                        {' [*]'}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                    {hasExtendedValue && (
                                        <p className="footnote">
                                            <span className="super">*</span>{' '}
                                            Extended Value
                                        </p>
                                    )}
                                </div>
                            );
                        })}

                        <p className="linktop">
                            Go to the <a href="#main">top</a> of the Define-XML
                            document
                        </p>
                        <br />
                    </div>
                </>
            )}

            {externalCodeLists.length > 0 && (
                <>
                    {/* eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid */}
                    <a id="externaldictionary" />
                    <h1 className="invisible">External Dictionaries</h1>
                    <div className="containerbox">
                        <table
                            summary="External Dictionaries"
                            className="datatable"
                        >
                            <caption className="header">
                                External Dictionaries
                            </caption>
                            <thead>
                                <tr className="header">
                                    <th scope="col">Reference Name</th>
                                    <th scope="col">External Dictionary</th>
                                    <th scope="col">Dictionary Version</th>
                                </tr>
                            </thead>
                            <tbody>
                                {externalCodeLists.map((codeList, index) => {
                                    const { name, externalCodeList, oid } =
                                        codeList;
                                    let description:
                                        | Define21.CodeList['description']
                                        | undefined;
                                    const rowClass =
                                        index % 2 === 0
                                            ? 'tableroweven'
                                            : 'tablerowodd';

                                    let commentContent:
                                        | React.ReactNode
                                        | undefined;
                                    if (defineVersion === '2.1') {
                                        const { commentOid } =
                                            codeList as Define21.CodeList;
                                        description = (
                                            codeList as Define21.CodeList
                                        ).description;
                                        commentContent = getCommentContent(
                                            commentOid,
                                            commentDefs,
                                            leafs,
                                        );
                                    }

                                    return (
                                        <tr
                                            key={oid}
                                            id={oid}
                                            className={rowClass}
                                        >
                                            <td>
                                                {name}
                                                {description && (
                                                    <div className="description">
                                                        {getTranslatedText(
                                                            description,
                                                        )}
                                                    </div>
                                                )}
                                                {commentContent && (
                                                    <div className="description">
                                                        {commentContent}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {externalCodeList?.href ? (
                                                    <>
                                                        <a
                                                            href={
                                                                externalCodeList.href
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            {
                                                                externalCodeList.dictionary
                                                            }
                                                        </a>
                                                        <span className="external-link-gif" />
                                                    </>
                                                ) : (
                                                    externalCodeList?.dictionary
                                                )}
                                                {externalCodeList?.ref && (
                                                    <>
                                                        {' ('}
                                                        <a
                                                            href={
                                                                externalCodeList.ref
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            {
                                                                externalCodeList.ref
                                                            }
                                                        </a>
                                                        )
                                                    </>
                                                )}
                                            </td>
                                            <td>{externalCodeList?.version}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <p className="linktop">
                            Go to the <a href="#main">top</a> of the Define-XML
                            document
                        </p>
                        <br />
                    </div>
                </>
            )}
        </>
    );
};

export default CodeLists;
