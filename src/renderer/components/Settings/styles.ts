export const styles = {
    paper: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 0,
    },
    contentContainer: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden',
    },
    scrollableContent: {
        flex: 1,
        overflow: 'auto',
        paddingBottom: '60px', // Ensure space for the button bar
    },
    fixedButtonBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '10px 16px',
        backgroundColor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        zIndex: 10,
    },
    buttonContainer: {
        justifyContent: 'flex-end',
    },
    refreshContainer: {
        alignContent: 'center',
    },
    tabs: {
        background:
            'radial-gradient(circle farthest-corner at bottom center,#eeeeee,#e5e4e4)',
        textTransform: 'none',
    },
    tabPanel: {
        padding: 2,
    },
    main: {
        height: '100%',
    },
    inputField: {
        maxWidth: '250px',
    },
    inputFieldLong: {
        maxWidth: '800px',
    },
    helperText: {
        paddingLeft: 2,
        margin: 0,
        mt: 0,
    },
    alert: {
        mt: 1,
        mb: 2,
    },
    circularProgress: {
        color: 'white',
    },
    refreshButton: {
        width: '90px',
    },
};
