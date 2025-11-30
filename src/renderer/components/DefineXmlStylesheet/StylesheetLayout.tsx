import React, { useState, useRef, useEffect } from 'react';
import {
    DefineXmlContent,
    DefineStylesheetSection as Section,
} from 'interfaces/common';
import NavigationMenu from 'renderer/components/DefineXmlStylesheet/NavigationMenu';
import DocumentInfo from 'renderer/components/DefineXmlStylesheet/sections/DocumentInfo';
import StudyMetadata from 'renderer/components/DefineXmlStylesheet/sections/StudyMetadata';
import Standards from 'renderer/components/DefineXmlStylesheet/sections/Standards';
import Datasets from 'renderer/components/DefineXmlStylesheet/sections/Datasets';
import DatasetDetails from 'renderer/components/DefineXmlStylesheet/sections/DatasetDetails';
import CodeLists from 'renderer/components/DefineXmlStylesheet/sections/CodeLists';
import Methods from 'renderer/components/DefineXmlStylesheet/sections/Methods';
import Comments from 'renderer/components/DefineXmlStylesheet/sections/Comments';
import AnalysisResults from 'renderer/components/DefineXmlStylesheet/sections/AnalysisResults';
import { getItemGroupDefs } from './utils/defineXmlHelpers';
import 'renderer/components/DefineXmlStylesheet/defineXml.css';

interface StylesheetLayoutProps {
    content: DefineXmlContent;
    onOpenFile: (
        event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    ) => void;
}

const StylesheetLayout: React.FC<StylesheetLayoutProps> = ({
    content,
    onOpenFile,
}) => {
    const [activeSection, setActiveSection] = useState<Section>('study');
    const contentRefs = useRef<{ [key: string]: HTMLElement | null }>({});
    const itemGroupDefs = getItemGroupDefs(content);

    const handleNavigate = (section: Section) => {
        setActiveSection(section);
        const element = contentRefs.current[section];
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Intersection Observer to update active section based on scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const section = entry.target.getAttribute(
                            'data-section',
                        ) as Section;
                        if (section) {
                            setActiveSection(section);
                        }
                    }
                });
            },
            { threshold: 0.3, rootMargin: '-100px 0px -50% 0px' },
        );

        Object.values(contentRefs.current).forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, []);

    const setRef = (section: Section) => (el: HTMLElement | null) => {
        contentRefs.current[section] = el;
    };

    return (
        <div
            className="define-xml-stylesheet"
            id="stylesheetContainer"
            style={{
                display: 'flex',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                isolation: 'isolate',
                contain: 'layout style paint',
            }}
        >
            {/* Menu */}
            <div
                id="menu"
                style={{
                    width: '20%',
                    minWidth: '200px',
                    maxWidth: '300px',
                    height: '100%',
                    overflow: 'auto',
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    borderRight: '1px solid #eee',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                }}
            >
                <NavigationMenu
                    content={content}
                    activeSection={activeSection}
                    onNavigate={handleNavigate}
                />
            </div>

            {/* Main Content */}
            <div
                id="main"
                style={{
                    flexGrow: 1,
                    padding: '0 20px',
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    overflowX: 'auto',
                    overflowY: 'auto',
                    height: '100%',
                }}
            >
                <div ref={setRef('study')} data-section="study">
                    <DocumentInfo content={content} />
                    <StudyMetadata content={content} />
                </div>

                <div ref={setRef('standards')} data-section="standards">
                    <Standards content={content} />
                </div>

                <div ref={setRef('analysis')} data-section="analysis">
                    <AnalysisResults
                        content={content}
                        onOpenFile={onOpenFile}
                    />
                </div>

                <div ref={setRef('datasets')} data-section="datasets">
                    <Datasets content={content} onOpenFile={onOpenFile} />
                    {itemGroupDefs.map((itemGroup) => (
                        <DatasetDetails
                            key={itemGroup['@OID']}
                            dataset={itemGroup}
                            content={content}
                            onOpenFile={onOpenFile}
                        />
                    ))}
                </div>

                <div ref={setRef('codelists')} data-section="codelists">
                    <CodeLists content={content} onOpenFile={onOpenFile} />
                </div>

                <div ref={setRef('methods')} data-section="methods">
                    <Methods content={content} onOpenFile={onOpenFile} />
                </div>

                <div ref={setRef('comments')} data-section="comments">
                    <Comments content={content} onOpenFile={onOpenFile} />
                </div>
            </div>
        </div>
    );
};

export default StylesheetLayout;
