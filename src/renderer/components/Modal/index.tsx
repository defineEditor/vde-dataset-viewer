import React from 'react';
import { useAppSelector } from '@redux/hooks';
import CommandLine from '@components/Modal/CommandLine';
import GoTo from '@components/Modal/GoTo';
import Help from '@components/Modal/Help';
import DatasetInfo from '@components/Modal/DatasetInfo';
import Developer from '@components/Modal/Developer';
import VariableInfo from '@components/Modal/VariableInfo';
import Filter from '@components/Modal/Filter';
import AppUpdate from '@components/Modal/AppUpdate';
import EditApi from '@components/Modal/EditApi';
import ErrorModal from '@components/Modal/ErrorModal';
import IdColumns from '@components/Modal/IdColumns';
import Mask from '@components/Modal/Mask';
import Sorting from '@components/Modal/Sorting';
import Validator from '@components/Modal/Validator';
import SelectCompare from '@components/Modal/SelectCompare';
import { modals as modalNames } from '@/misc/constants';
import { IUiModal } from '@interfaces/store';

const MODAL_COMPONENTS = {
    [modalNames.COMMANDLINE]: CommandLine,
    [modalNames.GOTO]: GoTo,
    [modalNames.HELP]: Help,
    [modalNames.DATASETINFO]: DatasetInfo,
    [modalNames.FILTER]: Filter,
    [modalNames.APPUPDATE]: AppUpdate,
    [modalNames.EDITAPI]: EditApi,
    [modalNames.ERROR]: ErrorModal,
    [modalNames.VARIABLEINFO]: VariableInfo,
    [modalNames.IDCOLUMNS]: IdColumns,
    [modalNames.MASK]: Mask,
    [modalNames.SORTING]: Sorting,
    [modalNames.VALIDATOR]: Validator,
    [modalNames.SELECTCOMPARE]: SelectCompare,
    [modalNames.DEVELOPER]: Developer,
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
