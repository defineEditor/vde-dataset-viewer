import React from 'react';
import { DefineXmlContent } from 'interfaces/defineXml';
import { getCodeLists, getTranslatedText } from '../utils/defineXmlHelpers';

interface CodeListsProps {
    content: DefineXmlContent;
}

const CodeLists: React.FC<CodeListsProps> = ({ content }) => {
    const codeListsArray = getCodeLists(content);

    // Filter codelists that have items (CodeListItems or EnumeratedItems)
    const codeListsWithItems = codeListsArray.filter((cl) => {
        const hasCodeListItems =
            cl.codeListItems && Object.keys(cl.codeListItems).length > 0;
        const hasEnumItems =
            cl.enumeratedItems && Object.keys(cl.enumeratedItems).length > 0;
        return hasCodeListItems || hasEnumItems;
    });

    if (codeListsWithItems.length === 0) {
        return null;
    }

    return (
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
                        Object.keys(codeList.enumeratedItems).length > 0;

                    return (
                        <div
                            key={codeList.oid}
                            id={`${codeList.oid}`}
                            className="codelist"
                        >
                            <div className="codelist-caption">
                                {codeList.name}
                                {/* TODO: Add NCI code, standard, description, comment */}
                            </div>

                            {hasCodeListItems && (
                                <table
                                    summary={`Controlled Term - ${codeList.name}`}
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
                                            const decode = getTranslatedText(
                                                item.decode,
                                            );
                                            const rowClass =
                                                index % 2 === 0
                                                    ? 'tableroweven'
                                                    : 'tablerowodd';

                                            return (
                                                <tr
                                                    key={item.codedValue}
                                                    className={rowClass}
                                                >
                                                    <td>{item.codedValue}</td>
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

                                            return (
                                                <tr
                                                    key={item.codedValue}
                                                    className={rowClass}
                                                >
                                                    <td>{item.codedValue}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    );
                })}

                <p className="linktop">
                    Go to the <a href="#main">top</a> of the Define-XML document
                </p>
                <br />
            </div>
        </>
    );
};

export default CodeLists;
