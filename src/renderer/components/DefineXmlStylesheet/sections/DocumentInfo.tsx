import React from 'react';
import { DefineXmlContent } from 'interfaces/defineXml';
import { getOdm, getMetaDataVersion } from '../utils/defineXmlHelpers';

interface DocumentInfoProps {
    content: DefineXmlContent;
}

const STYLESHEET_VERSION = '2019-02-11';

const DocumentInfo: React.FC<DocumentInfoProps> = ({ content }) => {
    const odm = getOdm(content);
    const metaDataVersion = getMetaDataVersion(content);

    // Context is only available on Define-XML 2.1 ODM
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { context } = odm as any;

    return (
        <div className="docinfo">
            {odm.creationDateTime && (
                <p className="documentinfo">
                    Date/Time of Define-XML document generation:{' '}
                    {odm.creationDateTime}
                </p>
            )}

            {metaDataVersion.defineVersion && (
                <p className="documentinfo">
                    Define-XML version: {metaDataVersion.defineVersion}
                </p>
            )}

            {context && (
                <p className="documentinfo">Define-XML Context: {context}</p>
            )}

            <p className="stylesheetinfo">
                Stylesheet version: {STYLESHEET_VERSION}
            </p>
        </div>
    );
};

export default DocumentInfo;
