import React from 'react';
import { useAppSelector } from 'renderer/redux/hooks';
import GoTo from 'renderer/components/Modal/GoTo';
import DatasetInfo from 'renderer/components/Modal/DatasetInfo';
import VariableInfo from 'renderer/components/Modal/VariableInfo';
import Filter from 'renderer/components/Modal/Filter';
import AppUpdate from 'renderer/components/Modal/AppUpdate';
import EditApi from 'renderer/components/Modal/EditApi';
import ErrorModal from 'renderer/components/Modal/ErrorModal';
import { modals as modalNames } from 'misc/constants';
import { IUiModal } from 'interfaces/store';

const MODAL_COMPONENTS = {
    [modalNames.GOTO]: GoTo,
    [modalNames.DATASETINFO]: DatasetInfo,
    [modalNames.FILTER]: Filter,
    [modalNames.APPUPDATE]: AppUpdate,
    [modalNames.EDITAPI]: EditApi,
    [modalNames.ERROR]: ErrorModal,
    [modalNames.VARIABLEINFO]: VariableInfo,
};

const ModalRoot: React.FC = () => {
    const modals = useAppSelector((state) => state.ui.modals);
    if (modals.length === 0) {
        return null;
    }

    const result: React.JSX.Element[] = [];
    modals.forEach((modal) => {
        const Modal = MODAL_COMPONENTS[modal.type] as React.FC<IUiModal>;
        result.push(<Modal key={modal.type} {...modal} />);
    });
    return result;
};

export default ModalRoot;
