const CracoLessPlugin = require('craco-less');

module.exports = {
    plugins: [
        {
            plugin: CracoLessPlugin,
            options: {
                lessLoaderOptions: {
                    lessOptions: {
                        javascriptEnabled: true,
                        modifyVars: {
                            '@primary-color': '#E889D7FF',
                            '@link-color': '#00bfff',
                            '@success-color': '#52c41a',
                            '@warning-color': '#faad14',
                            '@error-color': '#ff4d4f',
                            '@heading-color': 'rgba(0, 0, 0, 0.85)',
                            '@text-color': 'rgba(0, 0, 0, 0.65)',
                            '@text-color-secondary': 'rgba(0, 0, 0, 0.45)',
                            '@body-background': '#e0f7fa',
                            '@component-background': '#ffffff',
                            '@font-size-base': '14px',
                            '@border-radius-base': '8px',
                            '@border-color-base': '#d9d9d9',
                            '@box-shadow-base': '0 4px 12px rgba(0, 0, 0, 0.1)',
                            '@table-header-bg': '#e6f7ff',
                            '@table-row-hover-bg': '#f0f5fa',
                        },
                    },
                },
            },
        },
    ],
    babel: {
        plugins: [
            ['import', { libraryName: 'antd', libraryDirectory: 'es', style: true }, 'antd']
        ],
    },
};