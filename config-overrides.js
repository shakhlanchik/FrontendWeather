const { override, fixBabelImports, addLessLoader } = require('customize-cra');

module.exports = override(
    fixBabelImports('import', {
        libraryName: 'antd',
        libraryDirectory: 'es',
        style: true, // ВАЖНО: устанавливаем true для загрузки Less файлов стилей
    }),
    addLessLoader({
        lessOptions: {
            javascriptEnabled: true, // Необходимо для корректной работы Less-файлов Ant Design
            modifyVars: {
                // Здесь вы можете переопределить переменные темы Ant Design
                // Пример базового набора переменных:

                // Основные цвета
                '@primary-color': '#e889d7', // Основной цвет: светло-голубой, "небесный" цвет (например, для кнопок, ссылок)
                '@link-color': '#00bfff',    // Цвет ссылок
                '@success-color': '#52c41a', // Цвет для сообщений об успехе
                '@warning-color': '#faad14', // Цвет для предупреждений
                '@error-color': '#ff4d4f',   // Цвет для сообщений об ошибках

                // Цвета текста
                '@heading-color': 'rgba(0, 0, 0, 0.85)', // Цвет заголовков
                '@text-color': 'rgba(0, 0, 0, 0.65)',    // Основной цвет текста
                '@text-color-secondary': 'rgba(0, 0, 0, 0.45)', // Второстепенный цвет текста

                // Фон
                '@body-background': '#e0f7fa',      // Фон всей страницы (очень светлый голубой)
                '@component-background': '#ffffff', // Фон компонентов (например, карточек, модальных окон)

                // Размеры и геометрия
                '@font-size-base': '14px',   // Базовый размер шрифта
                '@border-radius-base': '8px', // Базовый радиус скругления углов (сделаем побольше для мягкости)
                '@border-color-base': '#d9d9d9', // Базовый цвет границы

                // Тени
                '@box-shadow-base': '0 4px 12px rgba(0, 0, 0, 0.1)', // Более выраженная базовая тень

                // Специфичные для таблицы
                '@table-header-bg': '#e6f7ff',      // Фон заголовков таблицы (светло-голубой)
                '@table-row-hover-bg': '#f0f5fa', // Фон строки таблицы при наведении
            },
        },
    })
);