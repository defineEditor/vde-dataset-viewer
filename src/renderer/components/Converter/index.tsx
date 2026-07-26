import React, { useState } from 'react';
import Configuration from '@components/Converter/Configuration';
import Execution from '@components/Converter/Execution';
import { ConvertTask } from '@interfaces/common';

const Converter: React.FC = () => {
    const [step, setStep] = useState<'configuration' | 'execution'>(
        'configuration',
    );

    const [task, setTask] = useState<ConvertTask | null>(null);

    const handleConvert = (newTask: ConvertTask) => {
        setTask(newTask);
        setStep('execution');
    };

    const handleBack = () => {
        setTask(null);
        setStep('configuration');
    };

    return step === 'configuration' ? (
        <Configuration onConvert={handleConvert} />
    ) : (
        task !== null && <Execution onBack={handleBack} task={task} />
    );
};

export default Converter;
