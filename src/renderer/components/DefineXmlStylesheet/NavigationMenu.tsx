import React, { useState, useCallback } from 'react';
import { DefineXmlContent } from 'interfaces/defineXml';
import {
    DefineStylesheetSection as Section,
    Define20,
    Define21,
} from 'interfaces/common';
import {
    getMetaDataVersion,
    getItemGroupDefs,
    getCodeLists,
    getStandards,
    getAnalysisResultDisplays,
    getTranslatedText,
    getMethodDefs,
    getCommentDefs,
} from 'renderer/components/DefineXmlStylesheet/utils/defineXmlHelpers';

interface NavigationMenuProps {
    content: DefineXmlContent;
    activeSection: Section;
    onNavigate: (section: Section) => void;
}

// Unicode characters for bullets (matching XSLT)
const BULLET_CLOSED = '\u25BA'; // ►
const BULLET_OPEN = '\u25BC'; // ▼
const BULLET_ITEM = '\u00A0';
const BULLET_EXTERNAL = '\u00A0';

const NavigationMenu: React.FC<NavigationMenuProps> = ({
    content,
    activeSection: _activeSection,
    onNavigate,
}) => {
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        arm: false,
        datasets: false,
        controlledTerminology: false,
        codeLists: false,
        externalDictionaries: false,
        methods: false,
        comments: false,
        supplementalDocs: false,
    });

    const toggleSection = useCallback((section: string) => {
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
    }, []);

    const handleKeyDown = useCallback(
        (section: string) => (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSection(section);
            }
        },
        [toggleSection],
    );

    const handleVlmState = (open: boolean) => {
        // ExpandAll
        const define = document.getElementById('stylesheetContainer');
        if (!define) return;
        const rows = define.getElementsByClassName('vlm');
        for (let j = 0; j < rows.length; j++) {
            (rows[j] as HTMLElement).style.display = open ? '' : 'none';
        }
    };

    const metaDataVersion = getMetaDataVersion(content);
    const itemGroupDefs = getItemGroupDefs(content);
    const standards = getStandards(content);
    const analysisResults = getAnalysisResultDisplays(content);
    const codeListsArray = getCodeLists(content);
    const methodDefs = getMethodDefs(content);
    const commentDefs = getCommentDefs(content);
    const leafs = metaDataVersion.leafs || {};
    const itemDefs = metaDataVersion.itemDefs || {};
    const { studyName } = content.content.odm.study.globalVariables;

    // Filter codelists
    const codeListsWithItems = codeListsArray.filter((cl) => {
        const hasCodeListItems =
            cl.codeListItems && Object.keys(cl.codeListItems).length > 0;
        const hasEnumItems =
            cl.enumeratedItems && Object.keys(cl.enumeratedItems).length > 0;
        return hasCodeListItems || hasEnumItems;
    });

    const externalCodeLists = codeListsArray.filter(
        (cl) => cl.externalCodeList,
    );

    // Annotated CRF
    const { annotatedCrf, supplementalDoc } = metaDataVersion;

    let aCrf: Define21.DocumentRef[] = [];

    if (annotatedCrf) {
        aCrf = annotatedCrf;
    } else {
        // Search through itemDefs for Origins with leaf references
        Object.values(itemDefs).forEach(
            (itemDef: Define20.ItemDef | Define21.ItemDef) => {
                if (itemDef.origins && itemDef.origins.length > 0) {
                    itemDef.origins.forEach(
                        (origin: Define20.Origin | Define21.Origin) => {
                            if (
                                (origin.type === 'CRF' ||
                                    origin.type === 'Collected') &&
                                origin.documentRefs
                            ) {
                                origin.documentRefs.forEach((doc) => {
                                    if (
                                        doc.leafId &&
                                        !aCrf
                                            .map((d) => d.leafId)
                                            .includes(doc.leafId)
                                    ) {
                                        aCrf.push({ leafId: doc.leafId });
                                    }
                                });
                            }
                        },
                    );
                }
            },
        );
    }

    const handleScrollTo = useCallback((id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    const renderLeafLink = (leafID: string) => {
        const leaf = leafs[leafID];
        if (!leaf) return null;
        const title = leaf.title ? leaf.title : leaf.xlink_href;

        return (
            <li key={leafID} className="hmenu-item">
                <span className="hmenu-bullet">{BULLET_EXTERNAL}</span>
                <a
                    className="external tocItem"
                    href={leaf.xlink_href}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {title}
                </a>
                <span className="external-link-gif" />
            </li>
        );
    };

    return (
        <>
            <span className="study-name">{studyName}</span>
            <ul className="hmenu">
                {/* Annotated CRF - render items directly */}
                {aCrf.map((doc) => renderLeafLink(doc.leafId))}

                {/* Supplemental Documents */}
                {supplementalDoc && supplementalDoc.length > 0 && (
                    <li className="hmenu-submenu">
                        <span
                            className="hmenu-bullet"
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleSection('supplementalDocs')}
                            onKeyDown={handleKeyDown('supplementalDocs')}
                            style={{ cursor: 'pointer' }}
                        >
                            {openSections.supplementalDocs
                                ? BULLET_OPEN
                                : BULLET_CLOSED}
                        </span>
                        <span className="tocItem">Supplemental Documents</span>
                        {openSections.supplementalDocs && (
                            <ul>
                                {supplementalDoc.map((doc) =>
                                    renderLeafLink(doc.leafId),
                                )}
                            </ul>
                        )}
                    </li>
                )}

                {/* Standards */}
                {standards.length > 0 && (
                    <li className="hmenu-item">
                        <span className="hmenu-bullet">{BULLET_ITEM}</span>
                        <a
                            className="tocItem"
                            href="#Standards_Table"
                            onClick={(e) => {
                                e.preventDefault();
                                onNavigate('standards');
                            }}
                        >
                            Standards
                        </a>
                    </li>
                )}

                {/* Analysis Results Metadata */}
                {analysisResults.length > 0 && (
                    <li className="hmenu-submenu">
                        <span
                            className="hmenu-bullet"
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleSection('arm')}
                            onKeyDown={handleKeyDown('arm')}
                            style={{ cursor: 'pointer' }}
                        >
                            {openSections.arm ? BULLET_OPEN : BULLET_CLOSED}
                        </span>
                        <a
                            className="tocItem"
                            href="#ARM_Table_Summary"
                            onClick={(e) => {
                                e.preventDefault();
                                onNavigate('analysis');
                            }}
                        >
                            Analysis Results Metadata
                        </a>
                        {openSections.arm && (
                            <ul>
                                {analysisResults.map((result) => (
                                    <li key={result.oid} className="hmenu-item">
                                        <span className="hmenu-bullet">
                                            {BULLET_ITEM}
                                        </span>
                                        <a
                                            className="tocItem"
                                            href={`#ARD.${result.oid}`}
                                            title={getTranslatedText(
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                result.description as any,
                                            )}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleScrollTo(
                                                    `ARD.${result.oid}`,
                                                );
                                            }}
                                        >
                                            {result.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                )}

                {/* Datasets */}
                <li className="hmenu-submenu">
                    <span
                        className="hmenu-bullet"
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleSection('datasets')}
                        onKeyDown={handleKeyDown('datasets')}
                        style={{ cursor: 'pointer' }}
                    >
                        {openSections.datasets ? BULLET_OPEN : BULLET_CLOSED}
                    </span>
                    <a
                        className="tocItem"
                        href="#datasets"
                        onClick={(e) => {
                            e.preventDefault();
                            onNavigate('datasets');
                        }}
                    >
                        Datasets
                    </a>
                    {openSections.datasets && (
                        <ul>
                            {itemGroupDefs.map((itemGroup) => (
                                <li key={itemGroup.oid} className="hmenu-item">
                                    <span className="hmenu-bullet">
                                        {BULLET_ITEM}
                                    </span>
                                    <a
                                        className="tocItem"
                                        href={`#IG.${itemGroup.oid}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleScrollTo(itemGroup.oid);
                                        }}
                                    >
                                        {`${itemGroup.name} (${getTranslatedText(itemGroup.description)})`}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </li>

                {/* Controlled Terminology */}
                {(codeListsWithItems.length > 0 ||
                    externalCodeLists.length > 0) && (
                    <li className="hmenu-submenu">
                        <span
                            className="hmenu-bullet"
                            role="button"
                            tabIndex={0}
                            onClick={() =>
                                toggleSection('controlledTerminology')
                            }
                            onKeyDown={handleKeyDown('controlledTerminology')}
                            style={{ cursor: 'pointer' }}
                        >
                            {openSections.controlledTerminology
                                ? BULLET_OPEN
                                : BULLET_CLOSED}
                        </span>
                        <a
                            className="tocItem"
                            href="#decodelist"
                            onClick={(e) => {
                                e.preventDefault();
                                onNavigate('codelists');
                            }}
                        >
                            Controlled Terminology
                        </a>
                        {openSections.controlledTerminology && (
                            <ul>
                                {/* CodeLists */}
                                {codeListsWithItems.length > 0 && (
                                    <li className="hmenu-submenu">
                                        <span
                                            className="hmenu-bullet"
                                            role="button"
                                            tabIndex={0}
                                            onClick={() =>
                                                toggleSection('codeLists')
                                            }
                                            onKeyDown={handleKeyDown(
                                                'codeLists',
                                            )}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {openSections.codeLists
                                                ? BULLET_OPEN
                                                : BULLET_CLOSED}
                                        </span>
                                        <a
                                            className="tocItem"
                                            href="#decodelist"
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            CodeLists
                                        </a>
                                        {openSections.codeLists && (
                                            <ul>
                                                {codeListsWithItems.map(
                                                    (cl) => (
                                                        <li
                                                            key={cl.oid}
                                                            className="hmenu-item"
                                                        >
                                                            <span className="hmenu-bullet">
                                                                {BULLET_ITEM}
                                                            </span>
                                                            <a
                                                                className="tocItem"
                                                                href={`#CL.${cl.oid}`}
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault();
                                                                    handleScrollTo(
                                                                        cl.oid,
                                                                    );
                                                                }}
                                                            >
                                                                {cl.name}
                                                            </a>
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        )}
                                    </li>
                                )}

                                {/* External Dictionaries */}
                                {externalCodeLists.length > 0 && (
                                    <li className="hmenu-submenu">
                                        <span
                                            className="hmenu-bullet"
                                            role="button"
                                            tabIndex={0}
                                            onClick={() =>
                                                toggleSection(
                                                    'externalDictionaries',
                                                )
                                            }
                                            onKeyDown={handleKeyDown(
                                                'externalDictionaries',
                                            )}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {openSections.externalDictionaries
                                                ? BULLET_OPEN
                                                : BULLET_CLOSED}
                                        </span>
                                        <a
                                            className="tocItem"
                                            href="#externaldictionary"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleScrollTo(
                                                    'externaldictionary',
                                                );
                                            }}
                                        >
                                            External Dictionaries
                                        </a>
                                        {openSections.externalDictionaries && (
                                            <ul>
                                                {externalCodeLists.map((cl) => (
                                                    <li
                                                        key={cl.oid}
                                                        className="hmenu-item"
                                                    >
                                                        <span className="hmenu-bullet">
                                                            {BULLET_ITEM}
                                                        </span>
                                                        <a
                                                            className="tocItem"
                                                            href={`#CL.${cl.oid}`}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleScrollTo(
                                                                    cl.oid,
                                                                );
                                                            }}
                                                        >
                                                            {cl.name}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                )}
                            </ul>
                        )}
                    </li>
                )}

                {/* Methods */}
                {methodDefs.length > 0 && (
                    <li className="hmenu-submenu">
                        <span
                            className="hmenu-bullet"
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleSection('methods')}
                            onKeyDown={handleKeyDown('methods')}
                            style={{ cursor: 'pointer' }}
                        >
                            {openSections.methods ? BULLET_OPEN : BULLET_CLOSED}
                        </span>
                        <a
                            className="tocItem"
                            href="#compmethod"
                            onClick={(e) => {
                                e.preventDefault();
                                onNavigate('methods');
                            }}
                        >
                            Methods
                        </a>
                        {openSections.methods && (
                            <ul>
                                {methodDefs.map((method) => (
                                    <li key={method.oid} className="hmenu-item">
                                        <span className="hmenu-bullet">
                                            {BULLET_ITEM}
                                        </span>
                                        <a
                                            className="tocItem"
                                            href={`#MT.${method.oid}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleScrollTo(method.oid);
                                            }}
                                        >
                                            {method.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                )}

                {/* Comments */}
                {commentDefs.length > 0 && (
                    <li className="hmenu-submenu">
                        <span
                            className="hmenu-bullet"
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleSection('comments')}
                            onKeyDown={handleKeyDown('comments')}
                            style={{ cursor: 'pointer' }}
                        >
                            {openSections.comments
                                ? BULLET_OPEN
                                : BULLET_CLOSED}
                        </span>
                        <a
                            className="tocItem"
                            href="#comment"
                            onClick={(e) => {
                                e.preventDefault();
                                onNavigate('comments');
                            }}
                        >
                            Comments
                        </a>
                        {openSections.comments && (
                            <ul>
                                {commentDefs.map((comment) => (
                                    <li
                                        key={comment.oid}
                                        className="hmenu-item"
                                    >
                                        <span className="hmenu-bullet">
                                            {BULLET_ITEM}
                                        </span>
                                        <a
                                            className="tocItem"
                                            href={`#COMM.${comment.oid}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleScrollTo(comment.oid);
                                            }}
                                        >
                                            {comment.oid}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                )}
            </ul>
            <div className="buttons">
                <div className="button">
                    <button
                        onClick={(_e) => {
                            handleVlmState(true);
                        }}
                        type="button"
                    >
                        Expand All VLM
                    </button>
                </div>
                <div className="button">
                    <button
                        onClick={(_e) => {
                            handleVlmState(false);
                        }}
                        type="button"
                    >
                        Collapse All VLM
                    </button>
                </div>
            </div>
        </>
    );
};

export default NavigationMenu;
