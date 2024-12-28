import React from 'react';
import { useAppSelector } from 'renderer/redux/hooks';
import GoTo from 'renderer/components/Modal/GoTo';
import DatasetInfo from 'renderer/components/Modal/DatasetInfo';
import Filter from 'renderer/components/Modal/Filter';

const MODAL_COMPONENTS = {
    GOTO: GoTo,
    DATASETINFO: DatasetInfo,
    FILTER: Filter,
};

const ModalRoot: React.FC = () => {
    const modals = useAppSelector((state) => state.ui.modals);
    if (modals.length === 0) {
        return null;
    }

    const result: React.JSX.Element[] = [];
    modals.forEach((modal) => {
        const Modal = MODAL_COMPONENTS[modal.type];
        result.push(<Modal key={modal.type} {...modal} />);
    });
    return result;
};

export default ModalRoot;
