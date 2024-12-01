import React from 'react';
import { useAppSelector } from 'renderer/redux/hooks';
import ModalGoTo from 'renderer/components/Modal/GoTo';

const MODAL_COMPONENTS = {
    'GOTO': ModalGoTo,
};

const ModalRoot: React.FC = () => {
    let modals = useAppSelector(state => state.ui.modals);
    if (modals.length === 0) {
        return null;
    }

    let result: JSX.Element[] = [];
    modals.forEach(modal=> {
        const Modal = MODAL_COMPONENTS[modal.type];
        result.push(<Modal key={modal.type} { ...modal } />);
    });
    return result;
};

export default ModalRoot;
