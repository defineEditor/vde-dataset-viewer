import React from 'react';
import {
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    Box,
} from '@mui/material';
import {
    Description as DescriptionIcon,
    Dataset as DatasetIcon,
    List as ListIcon,
    Code as CodeIcon,
    Functions as FunctionsIcon,
    Comment as CommentIcon,
    Analytics as AnalyticsIcon,
    ExpandLess,
    ExpandMore,
    FolderOpen,
} from '@mui/icons-material';
import { DefineXmlContent } from 'interfaces/defineXml';

export type Section =
    | 'study'
    | 'standards'
    | 'datasets'
    | 'codelists'
    | 'methods'
    | 'comments'
    | 'analysis';

interface NavigationMenuProps {
    content: DefineXmlContent;
    activeSection: Section;
    onNavigate: (section: Section) => void;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({
    content,
    activeSection,
    onNavigate,
}) => {
    const [datasetsOpen, setDatasetsOpen] = React.useState(true);

    const getMetaDataVersion = () => {
        const { odm } = content.content;
        return odm.study.metaDataVersion;
    };

    const metaDataVersion = getMetaDataVersion();
    const itemGroupDefsOrder = metaDataVersion.itemGroupDefsOrder || [];
    const codeListsOrder = metaDataVersion.codeListsOrder || [];
    const methodsOrder = metaDataVersion.methodDefsOrder || [];
    const commentsOrder = metaDataVersion.commentDefsOrder || [];

    return (
        <Box sx={{ overflowY: 'auto', height: '100%' }}>
            <List>
                <ListItemButton
                    selected={activeSection === 'study'}
                    onClick={() => onNavigate('study')}
                >
                    <ListItemIcon>
                        <DescriptionIcon />
                    </ListItemIcon>
                    <ListItemText primary="Study Metadata" />
                </ListItemButton>

                <ListItemButton
                    selected={activeSection === 'standards'}
                    onClick={() => onNavigate('standards')}
                >
                    <ListItemIcon>
                        <ListIcon />
                    </ListItemIcon>
                    <ListItemText primary="Standards" />
                </ListItemButton>

                <ListItemButton onClick={() => setDatasetsOpen(!datasetsOpen)}>
                    <ListItemIcon>
                        <DatasetIcon />
                    </ListItemIcon>
                    <ListItemText
                        primary={`Datasets (${itemGroupDefsOrder.length})`}
                    />
                    {datasetsOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>

                <Collapse in={datasetsOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItemButton
                            sx={{ pl: 4 }}
                            selected={activeSection === 'datasets'}
                            onClick={() => onNavigate('datasets')}
                        >
                            <ListItemIcon>
                                <FolderOpen fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                                primary="All Datasets"
                                primaryTypographyProps={{ variant: 'body2' }}
                            />
                        </ListItemButton>
                    </List>
                </Collapse>

                <ListItemButton
                    selected={activeSection === 'codelists'}
                    onClick={() => onNavigate('codelists')}
                >
                    <ListItemIcon>
                        <CodeIcon />
                    </ListItemIcon>
                    <ListItemText
                        primary={`CodeLists (${codeListsOrder.length})`}
                    />
                </ListItemButton>

                {methodsOrder.length > 0 && (
                    <ListItemButton
                        selected={activeSection === 'methods'}
                        onClick={() => onNavigate('methods')}
                    >
                        <ListItemIcon>
                            <FunctionsIcon />
                        </ListItemIcon>
                        <ListItemText
                            primary={`Methods (${methodsOrder.length})`}
                        />
                    </ListItemButton>
                )}

                {commentsOrder.length > 0 && (
                    <ListItemButton
                        selected={activeSection === 'comments'}
                        onClick={() => onNavigate('comments')}
                    >
                        <ListItemIcon>
                            <CommentIcon />
                        </ListItemIcon>
                        <ListItemText
                            primary={`Comments (${commentsOrder.length})`}
                        />
                    </ListItemButton>
                )}

                <ListItemButton
                    selected={activeSection === 'analysis'}
                    onClick={() => onNavigate('analysis')}
                >
                    <ListItemIcon>
                        <AnalyticsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Analysis Results" />
                </ListItemButton>
            </List>
        </Box>
    );
};

export default NavigationMenu;
