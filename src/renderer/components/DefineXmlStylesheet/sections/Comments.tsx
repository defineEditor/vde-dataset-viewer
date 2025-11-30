import React from 'react';
import { DefineXmlContent } from 'interfaces/defineXml';
import {
    getCommentDefs,
    getMetaDataVersion,
} from 'renderer/components/DefineXmlStylesheet/utils/defineXmlHelpers';
import { getCommentContent } from 'renderer/components/DefineXmlStylesheet/utils/itemRenderHelpers';

interface CommentsProps {
    content: DefineXmlContent;
    onOpenFile: (
        event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    ) => void;
}

const Comments: React.FC<CommentsProps> = ({ content, onOpenFile }) => {
    const metadataVersion = getMetaDataVersion(content);
    const commentDefs = getCommentDefs(content);
    const leafs = metadataVersion.leafs || {};

    if (commentDefs.length === 0) {
        return null;
    }

    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid */}
            <a id="compcomment" />
            <div className="containerbox">
                <h1 className="invisible">Comments</h1>

                <table summary="Comments" className="datatable">
                    <caption className="header">Comments</caption>

                    <thead>
                        <tr className="header">
                            <th scope="col">CommentOID</th>
                            <th scope="col">Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {commentDefs.map((comment, index) => {
                            const description = getCommentContent(
                                comment.oid,
                                { [comment.oid]: comment },
                                leafs,
                                onOpenFile,
                            );
                            const rowClass =
                                index % 2 === 0
                                    ? 'tableroweven'
                                    : 'tablerowodd';

                            return (
                                <tr
                                    key={comment.oid}
                                    id={`COMM.${comment.oid}`}
                                    className={rowClass}
                                >
                                    <td>{comment.oid}</td>
                                    <td>{description}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <p className="linktop">
                    Go to the <a href="#main">top</a> of the Define-XML document
                </p>
            </div>
        </>
    );
};

export default Comments;
