import React from 'react';
import { DefineXmlContent } from 'interfaces/defineXml';
import {
    getStandards,
    getGlobalVariables,
    getCommentDefs,
    getTranslatedText,
} from '../utils/defineXmlHelpers';

interface StandardsProps {
    content: DefineXmlContent;
}

const Standards: React.FC<StandardsProps> = ({ content }) => {
    const standards = getStandards(content);
    const globalVars = getGlobalVariables(content);
    const commentDefsArray = getCommentDefs(content);
    const studyName = globalVars?.studyName || '';

    // Create map for quick lookup
    const commentDefs = commentDefsArray.reduce(
        (acc, comment) => {
            acc[comment.oid] = comment;
            return acc;
        },
        {} as Record<string, (typeof commentDefsArray)[0]>,
    );

    if (standards.length === 0) {
        return null;
    }

    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid */}
            <a id="standards" />
            <h1 className="invisible">Standards for Study {studyName}</h1>

            <div className="containerbox">
                <table id="Standards_Table" summary="Standards">
                    <caption className="header">
                        Standards for Study {studyName}
                    </caption>
                    <thead>
                        <tr className="header">
                            <th scope="col">Standard</th>
                            <th scope="col">Type</th>
                            <th scope="col">Status</th>
                            <th scope="col">Documentation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {standards.map((standard, index) => {
                            const rowClass =
                                index % 2 === 0
                                    ? 'tableroweven'
                                    : 'tablerowodd';

                            // Build standard display: Name [PublishingSet] Version
                            const standardDisplay = [
                                standard.name,
                                standard.publishingSet,
                                standard.version,
                            ]
                                .filter(Boolean)
                                .join(' ');

                            // Get comment if present
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const { commentOid } = standard as any;
                            const comment =
                                commentOid && commentDefs[commentOid]
                                    ? getTranslatedText(
                                          commentDefs[commentOid].description,
                                      )
                                    : '';

                            return (
                                <tr
                                    key={standard.oid}
                                    id={`STD.${standard.oid}`}
                                    className={rowClass}
                                >
                                    <td>{standardDisplay}</td>
                                    <td>{standard.type}</td>
                                    <td>{standard.status}</td>
                                    <td>{comment}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default Standards;
