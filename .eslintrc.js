module.exports = {
    extends: ['erb', 'prettier'],
    rules: {
        // A temporary hack related to IDE not resolving correct package.json
        'import/no-extraneous-dependencies': 'off',
        'react/react-in-jsx-scope': 'off',
        'react/jsx-filename-extension': 'off',
        'import/extensions': 'off',
        'import/no-unresolved': 'off',
        'import/no-import-module-exports': 'off',
        'react/function-component-definition': [
            2,
            { namedComponents: 'arrow-function' },
        ],
        'react/jsx-props-no-spreading': 'off',
        'class-methods-use-this': [0],
        'no-plusplus': [0],
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
    },
    settings: {
        'import/resolver': {
            // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
                moduleDirectory: ['node_modules', 'src/'],
            },
            webpack: {
                config: require.resolve(
                    './.erb/configs/webpack.config.eslint.ts',
                ),
            },
            typescript: {},
        },
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx'],
        },
    },
};
