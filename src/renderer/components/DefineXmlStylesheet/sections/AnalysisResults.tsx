/* eslint-disable react/no-array-index-key */
import React from 'react';
import { DefineXmlContent } from 'interfaces/defineXml';
import {
    getAnalysisResultDisplays,
    getTranslatedText,
    getMetaDataVersion,
} from 'renderer/components/DefineXmlStylesheet/utils/defineXmlHelpers';
import {
    renderDocumentRefs,
    getCommentContent,
    getWhereClauseText,
    getAnalysisParameterDisplay,
} from 'renderer/components/DefineXmlStylesheet/utils/itemRenderHelpers';

interface AnalysisResultsProps {
    content: DefineXmlContent;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ content }) => {
    const analysisResults = getAnalysisResultDisplays(content);
    const metaDataVersion = getMetaDataVersion(content);
    const itemDefs = metaDataVersion.itemDefs || {};
    const codeLists = metaDataVersion.codeLists || {};

    const whereClauseDefs = metaDataVersion.whereClauseDefs || {};

    const itemGroupDefs = metaDataVersion.itemGroupDefs || {};

    const leafs = metaDataVersion.leafs || {};
    const commentDefs = metaDataVersion.commentDefs || {};

    if (!content.arm || analysisResults.length === 0) {
        return null;
    }

    return (
        <>
            {/* Summary Table */}
            <div className="containerbox">
                <h1 id="ARM_Table_Summary">
                    Analysis Results Metadata - Summary
                </h1>
                <div className="arm-summary">
                    {analysisResults.map((display) => {
                        const results = display.analysisResults
                            ? Object.values(display.analysisResults)
                            : [];
                        return (
                            <div
                                key={display.oid}
                                className="arm-summary-resultdisplay"
                            >
                                <a href={`#ARD.${display.oid}`}>
                                    {display.name}
                                </a>
                                <span className="arm-display-title">
                                    {getTranslatedText(display.description)}
                                </span>
                                {results.map((result) => (
                                    <p
                                        key={result.oid}
                                        className="arm-summary-result"
                                    >
                                        <a href={`#AR.${result.oid}`}>
                                            {getTranslatedText(
                                                result.description,
                                            )}
                                        </a>
                                    </p>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            <br />

            {/* Detail Tables */}
            <h1 id="ARM_Table_Detail">Analysis Results Metadata - Detail</h1>
            {analysisResults.map((display) => {
                const results = display.analysisResults
                    ? Object.values(display.analysisResults)
                    : [];
                return (
                    <div key={display.oid} className="containerbox">
                        {/* eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid */}
                        <a id={`ARD.${display.oid}`} />
                        <table
                            className="datatable"
                            summary="Analysis Results Metadata - Detail"
                        >
                            <caption>{display.name}</caption>
                            <thead>
                                <tr className="arm-resulttitle">
                                    <th scope="col" className="arm-resultlabel">
                                        Display
                                    </th>
                                    <th scope="col">
                                        {renderDocumentRefs(
                                            display.documents || [],
                                            leafs,
                                        )}{' '}
                                        <span className="arm-displaytitle">
                                            {getTranslatedText(
                                                display.description,
                                            )}
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((result) => {
                                    const commentContent = getCommentContent(
                                        result.analysisDatasets.commentOid,
                                        commentDefs,
                                        leafs,
                                    );
                                    return (
                                        <React.Fragment key={result.oid}>
                                            {/* Analysis Result Row */}
                                            <tr className="arm-analysisresult">
                                                <td>Analysis Result</td>
                                                <td>
                                                    <span
                                                        id={`AR.${result.oid}`}
                                                    >
                                                        {getTranslatedText(
                                                            result.description,
                                                        )}
                                                    </span>
                                                </td>
                                            </tr>

                                            {/* Analysis Parameter(s) */}
                                            <tr>
                                                <td className="arm-label">
                                                    Analysis Parameter(s)
                                                </td>
                                                <td>
                                                    {/* Check unresolved parameter */}
                                                    {result.parameterOid &&
                                                        !itemDefs[
                                                            result.parameterOid
                                                        ] && (
                                                            <span className="unresolved">
                                                                [unresolved:{' '}
                                                                {
                                                                    result.parameterOid
                                                                }
                                                                ]
                                                            </span>
                                                        )}

                                                    {result.analysisDatasets.analysisDatasetsOrder?.map(
                                                        (
                                                            datasetOid,
                                                            dsIndex: number,
                                                        ) => {
                                                            const dataset =
                                                                result
                                                                    .analysisDatasets
                                                                    .analysisDatasets[
                                                                    datasetOid
                                                                ];
                                                            if (
                                                                !result.parameterOid
                                                            )
                                                                return null;
                                                            return (
                                                                <div
                                                                    key={
                                                                        dsIndex
                                                                    }
                                                                >
                                                                    {getAnalysisParameterDisplay(
                                                                        dataset,
                                                                        result.parameterOid,
                                                                        whereClauseDefs,
                                                                        itemDefs,
                                                                        codeLists,
                                                                    )}
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </td>
                                            </tr>

                                            {/* Analysis Variable(s) */}
                                            <tr>
                                                <td className="arm-label">
                                                    Analysis Variable(s)
                                                </td>
                                                <td>
                                                    {result.analysisDatasets.analysisDatasetsOrder?.map(
                                                        (
                                                            datasetOid,
                                                            dsIndex: number,
                                                        ) => {
                                                            const dataset =
                                                                result
                                                                    .analysisDatasets
                                                                    .analysisDatasets[
                                                                    datasetOid
                                                                ];
                                                            return (
                                                                <div
                                                                    key={
                                                                        dsIndex
                                                                    }
                                                                >
                                                                    {dataset.analysisVariables?.map(
                                                                        (
                                                                            itemOid,
                                                                            vIndex: number,
                                                                        ) => {
                                                                            const itemDef =
                                                                                itemDefs[
                                                                                    itemOid
                                                                                ];
                                                                            const itemGroupDef =
                                                                                itemGroupDefs[
                                                                                    dataset
                                                                                        .itemGroupOid
                                                                                ];
                                                                            return (
                                                                                <p
                                                                                    key={
                                                                                        vIndex
                                                                                    }
                                                                                    className="arm-analysisvariable"
                                                                                >
                                                                                    {itemGroupDef ? (
                                                                                        <a
                                                                                            href={`#${dataset.itemGroupOid}`}
                                                                                        >
                                                                                            {
                                                                                                itemGroupDef.name
                                                                                            }
                                                                                        </a>
                                                                                    ) : (
                                                                                        <span className="unresolved">
                                                                                            [unresolved:{' '}
                                                                                            {
                                                                                                dataset.itemGroupOid
                                                                                            }

                                                                                            ]
                                                                                        </span>
                                                                                    )}

                                                                                    .
                                                                                    {itemGroupDef &&
                                                                                    itemDef ? (
                                                                                        <>
                                                                                            <a
                                                                                                href={`#${dataset.itemGroupOid}.${itemOid}`}
                                                                                            >
                                                                                                {
                                                                                                    itemDef.name
                                                                                                }
                                                                                            </a>{' '}
                                                                                            (
                                                                                            {getTranslatedText(
                                                                                                itemDef.description,
                                                                                            )}

                                                                                            )
                                                                                        </>
                                                                                    ) : (
                                                                                        <span className="unresolved">
                                                                                            [unresolved:{' '}
                                                                                            {
                                                                                                itemOid
                                                                                            }

                                                                                            ]
                                                                                        </span>
                                                                                    )}
                                                                                </p>
                                                                            );
                                                                        },
                                                                    )}
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </td>
                                            </tr>

                                            {/* Reason & Purpose */}
                                            <tr>
                                                <td className="arm-label">
                                                    Analysis Reason
                                                </td>
                                                <td>{result.analysisReason}</td>
                                            </tr>
                                            <tr>
                                                <td className="arm-label">
                                                    Analysis Purpose
                                                </td>
                                                <td>
                                                    {result.analysisPurpose}
                                                </td>
                                            </tr>

                                            {/* Data References */}
                                            <tr>
                                                <td className="arm-label">
                                                    Data References (incl.
                                                    Selection Criteria)
                                                </td>
                                                <td>
                                                    {result.analysisDatasets.analysisDatasetsOrder?.map(
                                                        (
                                                            datasetOid,
                                                            dsIndex: number,
                                                        ) => {
                                                            const dataset =
                                                                result
                                                                    .analysisDatasets
                                                                    .analysisDatasets[
                                                                    datasetOid
                                                                ];
                                                            const itemGroupDef =
                                                                itemGroupDefs[
                                                                    dataset
                                                                        .itemGroupOid
                                                                ];
                                                            const whereClauseRefs =
                                                                dataset.whereClauseRefs
                                                                    ? dataset.whereClauseRefs
                                                                    : [];

                                                            return (
                                                                <div
                                                                    key={
                                                                        dsIndex
                                                                    }
                                                                    className="arm-data-reference"
                                                                >
                                                                    {itemGroupDef ? (
                                                                        <a
                                                                            href={`#${dataset.itemGroupOid}`}
                                                                            title={getTranslatedText(
                                                                                itemGroupDef.description,
                                                                            )}
                                                                        >
                                                                            {
                                                                                itemGroupDef.name
                                                                            }
                                                                        </a>
                                                                    ) : (
                                                                        <span className="unresolved">
                                                                            [unresolved:{' '}
                                                                            {
                                                                                dataset.itemGroupOid
                                                                            }
                                                                            ]
                                                                        </span>
                                                                    )}
                                                                    {' ['}
                                                                    {getWhereClauseText(
                                                                        whereClauseRefs,
                                                                        whereClauseDefs,
                                                                        itemDefs,
                                                                        codeLists,
                                                                        dataset.itemGroupOid,
                                                                        true,
                                                                    )}
                                                                    ]
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                    {commentContent && (
                                                        <p className="linebreakcell">
                                                            {commentContent}
                                                        </p>
                                                    )}
                                                </td>
                                            </tr>

                                            {/* Documentation */}
                                            {result.documentation && (
                                                <tr>
                                                    <td className="arm-label">
                                                        Documentation
                                                    </td>
                                                    <td>
                                                        {result.documentation
                                                            .description && (
                                                            <span>
                                                                {getTranslatedText(
                                                                    result
                                                                        .documentation
                                                                        .description,
                                                                )}
                                                            </span>
                                                        )}
                                                        {renderDocumentRefs(
                                                            result.documentation
                                                                .documents ||
                                                                [],
                                                            leafs,
                                                        )}
                                                    </td>
                                                </tr>
                                            )}

                                            {/* Programming Code */}
                                            {result.programmingCode && (
                                                <tr>
                                                    <td className="arm-label">
                                                        Programming Statements
                                                    </td>
                                                    <td>
                                                        {result.programmingCode
                                                            .context && (
                                                            <span className="arm-code-context">
                                                                [
                                                                {
                                                                    result
                                                                        .programmingCode
                                                                        .context
                                                                }
                                                                ]
                                                            </span>
                                                        )}
                                                        {result.programmingCode
                                                            .code && (
                                                            <pre className="arm-code">
                                                                {
                                                                    result
                                                                        .programmingCode
                                                                        .code
                                                                }
                                                            </pre>
                                                        )}
                                                        <div className="arm-code-ref">
                                                            {renderDocumentRefs(
                                                                result
                                                                    .programmingCode
                                                                    .documents ||
                                                                    [],
                                                                leafs,
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
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
                );
            })}
        </>
    );
};

export default AnalysisResults;
