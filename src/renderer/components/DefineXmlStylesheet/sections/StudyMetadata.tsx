import React from 'react';
import { DefineXmlContent } from 'interfaces/defineXml';
import type { Define20, ArmDefine20 } from 'parse-define-xml';
import {
    getGlobalVariables,
    getMetaDataVersion,
    getCommentDefs,
    getTranslatedText,
} from '../utils/defineXmlHelpers';

interface StudyMetadataProps {
    content: DefineXmlContent;
}

const StudyMetadata: React.FC<StudyMetadataProps> = ({ content }) => {
    const globalVars = getGlobalVariables(content);
    const metaDataVersion = getMetaDataVersion(content);
    const commentDefsArray = getCommentDefs(content);

    // Create map for quick lookup
    const commentDefs = commentDefsArray.reduce(
        (acc, comment) => {
            acc[comment.oid] = comment;
            return acc;
        },
        {} as Record<string, (typeof commentDefsArray)[0]>,
    );

    // For Define 2.0, standardName and standardVersion are on MetaDataVersion
    // For Define 2.1, they come from Standards/Standard[@Type='IG']
    const standardName =
        content.defineVersion === '2.0'
            ? (
                  metaDataVersion as
                      | Define20.MetaDataVersion
                      | ArmDefine20.MetaDataVersion
              ).standardName
            : undefined;
    const standardVersion =
        content.defineVersion === '2.0'
            ? (
                  metaDataVersion as
                      | Define20.MetaDataVersion
                      | ArmDefine20.MetaDataVersion
              ).standardVersion
            : undefined;

    // Get comment for MetaDataVersion (Define-XML 2.1)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { commentOid } = metaDataVersion as any;
    const metaDataComment =
        commentOid && commentDefs[commentOid]
            ? getTranslatedText(commentDefs[commentOid].description)
            : null;

    return (
        <div className="study-metadata">
            <dl className="study-metadata">
                {standardName && (
                    <>
                        <dt>Standard</dt>
                        <dd>
                            {standardName} {standardVersion}
                        </dd>
                    </>
                )}

                {globalVars?.studyName && (
                    <>
                        <dt>Study Name</dt>
                        <dd>{globalVars.studyName}</dd>
                    </>
                )}

                {globalVars?.studyDescription && (
                    <>
                        <dt>Study Description</dt>
                        <dd>{globalVars.studyDescription}</dd>
                    </>
                )}

                {globalVars?.protocolName && (
                    <>
                        <dt>Protocol Name</dt>
                        <dd>{globalVars.protocolName}</dd>
                    </>
                )}

                {metaDataVersion?.name && (
                    <>
                        <dt>Metadata Name</dt>
                        <dd>{metaDataVersion.name}</dd>
                    </>
                )}

                {metaDataVersion?.description && (
                    <>
                        <dt>Metadata Description</dt>
                        <dd>{metaDataVersion.description}</dd>
                    </>
                )}
            </dl>

            {metaDataComment && (
                <div className="description">
                    <p>{metaDataComment}</p>
                </div>
            )}
        </div>
    );
};

export default StudyMetadata;
