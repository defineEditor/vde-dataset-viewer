import React, { useState } from 'react';
import {
    List,
    ListItemButton,
    ListItemText,
    Collapse,
    ListItemIcon,
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
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

const NavigationMenu: React.FC<NavigationMenuProps> = ({
    content,
    activeSection,
    onNavigate,
}) => {
    const [openSections, setOpenSections] = useState({
        arm: false,
        datasets: false,
        controlledTerminology: false,
        codeLists: false,
        externalDictionaries: false,
        methods: false,
        comments: false,
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
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

    const handleScrollTo = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const renderLeafLink = (leafID: string, noIndent: boolean = false) => {
        const leaf = leafs[leafID];
        if (!leaf) return null;
        // Try to get title from leaf.title (def:title) or just use href if missing
        const title = leaf.title ? leaf.title : leaf.xlink_href;

        return (
            <ListItemButton
                key={leafID}
                component="a"
                href={leaf.xlink_href}
                target="_blank"
                sx={{ pl: noIndent ? 2 : 4 }}
            >
                <ListItemText
                    primary={
                        <>
                            {title}
                            <span className="external-link-gif" />
                        </>
                    }
                />
            </ListItemButton>
        );
    };

    return (
        <>
            <span className="study-name">{studyName}</span>
            <List component="nav" dense>
                {/* Annotated CRF */}
                {aCrf.length > 1 && (
                    <ListItemButton>
                        <ListItemText primary="Annotated CRF" />
                    </ListItemButton>
                )}

                {aCrf &&
                    aCrf.map((doc) =>
                        renderLeafLink(doc.leafId, aCrf.length === 1),
                    )}

                {/* Supplemental Documents */}
                {supplementalDoc && supplementalDoc.length > 0 && (
                    <ListItemButton>
                        <ListItemText primary="Supplemental Documents" />
                    </ListItemButton>
                )}
                {supplementalDoc &&
                    supplementalDoc.map((doc) => renderLeafLink(doc.leafId))}

                {/* Standards */}
                {standards.length > 0 && (
                    <ListItemButton
                        onClick={() => onNavigate('standards')}
                        selected={activeSection === 'standards'}
                        sx={{ pl: 2 }}
                    >
                        <ListItemText primary="Standards" />
                    </ListItemButton>
                )}

                {/* Analysis Results Metadata */}
                {analysisResults.length > 0 && (
                    <>
                        <ListItemButton onClick={() => toggleSection('arm')}>
                            <ListItemIcon sx={{ minWidth: 30 }}>
                                {openSections.arm ? (
                                    <ExpandLess />
                                ) : (
                                    <ExpandMore />
                                )}
                            </ListItemIcon>
                            <ListItemText
                                primary="Analysis Results Metadata"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate('analysis');
                                }}
                            />
                        </ListItemButton>
                        <Collapse
                            in={openSections.arm}
                            timeout="auto"
                            unmountOnExit
                        >
                            <List component="div" disablePadding dense>
                                {analysisResults.map((result) => (
                                    <ListItemButton
                                        key={result.oid}
                                        sx={{ pl: 4 }}
                                        onClick={() =>
                                            handleScrollTo(`ARD.${result.oid}`)
                                        }
                                    >
                                        <ListItemText
                                            primary={result.name}
                                            title={getTranslatedText(
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                result.description as any,
                                            )}
                                        />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Collapse>
                    </>
                )}

                {/* Datasets */}
                <ListItemButton onClick={() => toggleSection('datasets')}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                        {openSections.datasets ? (
                            <ExpandLess />
                        ) : (
                            <ExpandMore />
                        )}
                    </ListItemIcon>
                    <ListItemText
                        primary="Datasets"
                        onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('datasets');
                        }}
                    />
                </ListItemButton>
                <Collapse
                    in={openSections.datasets}
                    timeout="auto"
                    unmountOnExit
                >
                    <List component="div" disablePadding dense>
                        {itemGroupDefs.map((itemGroup) => (
                            <ListItemButton
                                key={itemGroup.oid}
                                sx={{ pl: 4 }}
                                onClick={() => handleScrollTo(itemGroup.oid)}
                            >
                                <ListItemText
                                    primary={`${itemGroup.name} (${getTranslatedText(
                                        itemGroup.description,
                                    )})`}
                                />
                            </ListItemButton>
                        ))}
                    </List>
                </Collapse>

                {/* Controlled Terminology */}
                {(codeListsWithItems.length > 0 ||
                    externalCodeLists.length > 0) && (
                    <>
                        <ListItemButton
                            onClick={() =>
                                toggleSection('controlledTerminology')
                            }
                        >
                            <ListItemIcon sx={{ minWidth: 30 }}>
                                {openSections.controlledTerminology ? (
                                    <ExpandLess />
                                ) : (
                                    <ExpandMore />
                                )}
                            </ListItemIcon>
                            <ListItemText
                                primary="Controlled Terminology"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate('codelists');
                                }}
                            />
                        </ListItemButton>
                        <Collapse
                            in={openSections.controlledTerminology}
                            timeout="auto"
                            unmountOnExit
                        >
                            <List component="div" disablePadding dense>
                                {/* CodeLists */}
                                {codeListsWithItems.length > 0 && (
                                    <>
                                        <ListItemButton
                                            sx={{ pl: 4 }}
                                            onClick={() =>
                                                toggleSection('codeLists')
                                            }
                                        >
                                            <ListItemIcon sx={{ minWidth: 30 }}>
                                                {openSections.codeLists ? (
                                                    <ExpandLess />
                                                ) : (
                                                    <ExpandMore />
                                                )}
                                            </ListItemIcon>
                                            <ListItemText primary="CodeLists" />
                                        </ListItemButton>
                                        <Collapse
                                            in={openSections.codeLists}
                                            timeout="auto"
                                            unmountOnExit
                                        >
                                            <List
                                                component="div"
                                                disablePadding
                                                dense
                                            >
                                                {codeListsWithItems.map(
                                                    (cl) => (
                                                        <ListItemButton
                                                            key={cl.oid}
                                                            sx={{ pl: 8 }}
                                                            onClick={() =>
                                                                handleScrollTo(
                                                                    cl.oid,
                                                                )
                                                            }
                                                        >
                                                            <ListItemText
                                                                primary={
                                                                    cl.name
                                                                }
                                                            />
                                                        </ListItemButton>
                                                    ),
                                                )}
                                            </List>
                                        </Collapse>
                                    </>
                                )}

                                {/* External Dictionaries */}
                                {externalCodeLists.length > 0 && (
                                    <>
                                        <ListItemButton
                                            sx={{ pl: 4 }}
                                            onClick={() =>
                                                toggleSection(
                                                    'externalDictionaries',
                                                )
                                            }
                                        >
                                            <ListItemIcon sx={{ minWidth: 30 }}>
                                                {openSections.externalDictionaries ? (
                                                    <ExpandLess />
                                                ) : (
                                                    <ExpandMore />
                                                )}
                                            </ListItemIcon>
                                            <ListItemText primary="External Dictionaries" />
                                        </ListItemButton>
                                        <Collapse
                                            in={
                                                openSections.externalDictionaries
                                            }
                                            timeout="auto"
                                            unmountOnExit
                                        >
                                            <List
                                                component="div"
                                                disablePadding
                                                dense
                                            >
                                                {externalCodeLists.map((cl) => (
                                                    <ListItemButton
                                                        key={cl.oid}
                                                        sx={{ pl: 8 }}
                                                        onClick={() =>
                                                            handleScrollTo(
                                                                cl.oid,
                                                            )
                                                        }
                                                    >
                                                        <ListItemText
                                                            primary={cl.name}
                                                        />
                                                    </ListItemButton>
                                                ))}
                                            </List>
                                        </Collapse>
                                    </>
                                )}
                            </List>
                        </Collapse>
                    </>
                )}

                {/* Methods */}
                {methodDefs.length > 0 && (
                    <>
                        <ListItemButton
                            onClick={() => toggleSection('methods')}
                        >
                            <ListItemIcon sx={{ minWidth: 30 }}>
                                {openSections.methods ? (
                                    <ExpandLess />
                                ) : (
                                    <ExpandMore />
                                )}
                            </ListItemIcon>
                            <ListItemText
                                primary="Methods"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate('methods');
                                }}
                            />
                        </ListItemButton>
                        <Collapse
                            in={openSections.methods}
                            timeout="auto"
                            unmountOnExit
                        >
                            <List component="div" disablePadding dense>
                                {methodDefs.map((method) => (
                                    <ListItemButton
                                        key={method.oid}
                                        sx={{ pl: 4 }}
                                        onClick={() =>
                                            handleScrollTo(method.oid)
                                        }
                                    >
                                        <ListItemText primary={method.name} />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Collapse>
                    </>
                )}

                {/* Comments */}
                {commentDefs.length > 0 && (
                    <>
                        <ListItemButton
                            onClick={() => toggleSection('comments')}
                        >
                            <ListItemIcon sx={{ minWidth: 30 }}>
                                {openSections.comments ? (
                                    <ExpandLess />
                                ) : (
                                    <ExpandMore />
                                )}
                            </ListItemIcon>
                            <ListItemText
                                primary="Comments"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate('comments');
                                }}
                            />
                        </ListItemButton>
                        <Collapse
                            in={openSections.comments}
                            timeout="auto"
                            unmountOnExit
                        >
                            <List component="div" disablePadding dense>
                                {commentDefs.map((comment) => (
                                    <ListItemButton
                                        key={comment.oid}
                                        sx={{ pl: 4 }}
                                        onClick={() =>
                                            handleScrollTo(comment.oid)
                                        }
                                    >
                                        <ListItemText primary={comment.oid} />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Collapse>
                    </>
                )}
            </List>
        </>
    );
};

export default NavigationMenu;
