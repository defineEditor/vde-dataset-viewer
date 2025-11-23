import React, { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import { DefineXmlContent } from 'interfaces/defineXml';
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
import './defineXml.css';

const MENU_WIDTH = '20%';
const MAIN_LEFT = '22%';

export type Section =
    | 'study'
    | 'standards'
    | 'datasets'
    | 'codelists'
    | 'methods'
    | 'comments'
    | 'analysis';

interface DefineViewerLayoutProps {
    content: DefineXmlContent;
}

const DefineViewerLayout: React.FC<DefineViewerLayoutProps> = ({ content }) => {
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
        <Box
            className="define-xml-stylesheet"
            sx={{
                display: 'flex',
                height: '100vh',
                position: 'relative',
            }}
        >
            {/* Menu - Fixed Left Side */}
            <Box
                id="menu"
                sx={{
                    position: 'fixed',
                    left: 0,
                    top: '10px',
                    width: MENU_WIDTH,
                    height: '96%',
                    bottom: 0,
                    overflowY: 'auto',
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    border: 0,
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                }}
            >
                <NavigationMenu
                    content={content}
                    activeSection={activeSection}
                    onNavigate={handleNavigate}
                />
            </Box>

            {/* Main Content */}
            <Box
                id="main"
                component="main"
                sx={{
                    position: 'absolute',
                    left: MAIN_LEFT,
                    top: 0,
                    right: 0,
                    overflowY: 'auto',
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    padding: '30px',
                }}
            >
                {/* Document Info */}
                <DocumentInfo content={content} />

                <Box ref={setRef('study')} data-section="study" sx={{ mb: 4 }}>
                    <StudyMetadata content={content} />
                </Box>

                <Box
                    ref={setRef('standards')}
                    data-section="standards"
                    sx={{ mb: 4 }}
                >
                    <Standards content={content} />
                </Box>

                <Box
                    ref={setRef('datasets')}
                    data-section="datasets"
                    sx={{ mb: 4 }}
                >
                    <Datasets content={content} />
                </Box>

                {/* Dataset Details - Individual sections for each dataset */}
                {itemGroupDefs.map((dataset) => (
                    <Box key={dataset.oid} sx={{ mb: 4 }}>
                        <DatasetDetails content={content} dataset={dataset} />
                    </Box>
                ))}

                <Box
                    ref={setRef('codelists')}
                    data-section="codelists"
                    sx={{ mb: 4 }}
                >
                    <CodeLists content={content} />
                </Box>

                <Box
                    ref={setRef('methods')}
                    data-section="methods"
                    sx={{ mb: 4 }}
                >
                    <Methods content={content} />
                </Box>

                <Box
                    ref={setRef('comments')}
                    data-section="comments"
                    sx={{ mb: 4 }}
                >
                    <Comments content={content} />
                </Box>

                <Box
                    ref={setRef('analysis')}
                    data-section="analysis"
                    sx={{ mb: 4 }}
                >
                    <AnalysisResults content={content} />
                </Box>
            </Box>
        </Box>
    );
};

export default DefineViewerLayout;
