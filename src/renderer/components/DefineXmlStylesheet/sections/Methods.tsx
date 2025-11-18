/* eslint-disable react/no-array-index-key */
import React from 'react';
import { DefineXmlContent } from 'interfaces/defineXml';
import { renderDocumentRefs } from 'renderer/components/DefineXmlStylesheet/utils/itemRenderHelpers';
import {
    getMetaDataVersion,
    getMethodDefs,
    getTranslatedText,
} from 'renderer/components/DefineXmlStylesheet/utils/defineXmlHelpers';

interface MethodsProps {
    content: DefineXmlContent;
}

const Methods: React.FC<MethodsProps> = ({ content }) => {
    const methodDefs = getMethodDefs(content);
    const metaDataVersion = getMetaDataVersion(content);
    const leafs = metaDataVersion.leafs || {};

    if (methodDefs.length === 0) {
        return null;
    }

    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid */}
            <a id="compmethod" />
            <div className="containerbox">
                <h1 className="invisible">Methods</h1>

                <table summary="Methods">
                    <caption className="header">Methods</caption>

                    <thead>
                        <tr className="header">
                            <th scope="col">Method</th>
                            <th scope="col">Type</th>
                            <th scope="col">Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {methodDefs.map((method, index) => {
                            const description = getTranslatedText(
                                method.description,
                            );
                            const rowClass =
                                index % 2 === 0
                                    ? 'tableroweven'
                                    : 'tablerowodd';

                            return (
                                <tr
                                    key={method.oid}
                                    id={`MT.${method.oid}`}
                                    className={rowClass}
                                >
                                    <td>{method.name}</td>
                                    <td>{method.type}</td>
                                    <td>
                                        <div className="method-code">
                                            {description}
                                        </div>
                                        {method.formalExpressions &&
                                            method.formalExpressions.length >
                                                0 &&
                                            method.formalExpressions.map(
                                                (expr, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="formalexpression"
                                                    >
                                                        <span className="label">
                                                            Formal Expression
                                                        </span>
                                                        {expr.context && (
                                                            <>
                                                                {' ['}
                                                                {expr.context}]
                                                            </>
                                                        )}
                                                        :
                                                        <span className="formalexpression-code">
                                                            {expr.value}
                                                        </span>
                                                    </div>
                                                ),
                                            )}
                                        {renderDocumentRefs(
                                            method.documentRefs || [],
                                            leafs,
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default Methods;
