import React, { useState, useEffect } from 'react';
import { Table, Spin, Typography, Button, Modal, message, Space, Card, Alert, Layout, Input } from 'antd';
import axios from 'axios';
import CityFormModal from './CityFormModal';
import ForecastFormModal from './ForecastFormModal';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { WiDaySunny, WiCloudy, WiRain, WiSnow, WiThunderstorm, WiFog } from 'react-icons/wi';

const BASE_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

const { Title } = Typography;
const { confirm } = Modal;
const { Header, Content, Footer } = Layout;

const getWeatherIcon = (condition) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('солнечно') || lowerCondition.includes('ясно')) return <WiDaySunny style={{ color: '#FFD700' }} />;
    if (lowerCondition.includes('облачно') || lowerCondition.includes('пасмурно')) return <WiCloudy style={{ color: '#A9A9A9' }} />;
    if (lowerCondition.includes('дождь') || lowerCondition.includes('дождливо')) return <WiRain style={{ color: '#6A5ACD' }} />;
    if (lowerCondition.includes('снег') || lowerCondition.includes('метель')) return <WiSnow style={{ color: '#ADD8E6' }} />;
    if (lowerCondition.includes('гроза')) return <WiThunderstorm style={{ color: '#4B0082' }} />;
    if (lowerCondition.includes('туман')) return <WiFog style={{ color: '#C0C0C0' }} />;
    return null;
};

const CityForecastList = () => {
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRowKeys, setExpandedRowKeys] = useState([]);
    const [error, setError] = useState(null);
    const [isAdmin, setIsAdmin] = useState(true); // Установить true для тестирования админского вида
    const [isCityModalVisible, setIsCityModalVisible] = useState(false);
    const [editingCity, setEditingCity] = useState(null);
    const [isForecastModalVisible, setIsForecastModalVisible] = useState(false);
    const [editingForecast, setEditingForecast] = useState(null);
    const [currentCityForForecast, setCurrentCityForForecast] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {

        fetchAllCitiesAndForecasts();
    }, []);

    const fetchAllCitiesAndForecasts = async () => {
        setLoading(true);
        try {

            const citiesResponse = await axios.get(`${BASE_BACKEND_URL}/city/all?_t=${Date.now()}`);
            const allCities = Array.isArray(citiesResponse.data) ? citiesResponse.data : [];
            console.log('Загружены все города:', allCities);

            const citiesWithForecastsPromises = allCities.map(async (city) => {
                try {
                    const forecastsResponse = await axios.get(`${BASE_BACKEND_URL}/forecast/by-city/${city.id}?_t=${Date.now()}`);

                    const forecasts = Array.isArray(forecastsResponse.data) ? forecastsResponse.data : [];
                    return { ...city, forecasts };
                } catch (forecastErr) {
                    console.warn(`Не удалось загрузить прогнозы для города ${city.name} (ID: ${city.id}):`, forecastErr);

                    return { ...city, forecasts: [] };
                }
            });

            const citiesWithForecasts = await Promise.all(citiesWithForecastsPromises);
            setCities(citiesWithForecasts);
            setError(null);
        } catch (err) {
            console.error('Ошибка при загрузке всех городов и прогнозов:', err);
            if (axios.isAxiosError(err) && err.response) {
                setError(`Ошибка сервера: ${err.response.status} - ${err.response.data?.message || err.message}`);
            } else if (err.request) {
                setError('Не удалось подключиться к серверу. Убедитесь, что бэкенд запущен и доступен.');
            } else {
                setError(`Неизвестная ошибка: ${err.message}`);
            }
            setCities([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCities = async (searchName = '', searchCountry = '') => {
        setLoading(true);
        try {
            let url;

            if (searchName || searchCountry) {
                url = `${BASE_BACKEND_URL}/forecast/filter/stream?_t=${Date.now()}`;
                if (searchName) {
                    url += `&cityName=${encodeURIComponent(searchName)}`;
                }
            } else {
                await fetchAllCitiesAndForecasts();
                return;
            }

            console.log('Отправляемый URL для поиска прогнозов:', url);
            const response = await axios.get(url);

            let fetchedForecasts = [];
            if (Array.isArray(response.data)) {
                fetchedForecasts = response.data;
            } else if (response.status === 204) {
                console.log('Нет содержимого (204 No Content) от бэкенда.');
                fetchedForecasts = [];
            } else {
                console.warn('Полученные данные от бэкенда не являются массивом или не соответствуют ожидаемому формату:', response.data);
                fetchedForecasts = [];
            }

            console.log('Полученные данные от бэкенда (после обработки):', fetchedForecasts);

            const allCitiesResponse = await axios.get(`${BASE_BACKEND_URL}/city/all?_t=${Date.now()}`);
            const allCitiesFromBackend = Array.isArray(allCitiesResponse.data) ? allCitiesResponse.data : [];
            const allCitiesMap = new Map(allCitiesFromBackend.map(city => [city.id, city]));

            const groupedCities = {};

            fetchedForecasts.forEach(forecast => {
                const cityId = forecast.cityId;
                if (allCitiesMap.has(cityId)) {
                    const city = allCitiesMap.get(cityId);
                    if (!groupedCities[cityId]) {
                        groupedCities[cityId] = {
                            id: cityId,
                            name: city.name,
                            country: city.country,
                            forecasts: []
                        };
                    }
                    groupedCities[cityId].forecasts.push(forecast);
                }
            });

            let resultCities = Object.values(groupedCities);

            if (searchCountry) {
                resultCities = resultCities.filter(city =>
                    city.country.toLowerCase().includes(searchCountry.toLowerCase())
                );
            }

            setCities(resultCities);
            setError(null);
        } catch (err) {
            console.error('Ошибка при поиске данных:', err);
            if (axios.isAxiosError(err) && err.response) {
                setError(`Ошибка сервера: ${err.response.status} - ${err.response.data?.message || err.message}`);
            } else if (err.request) {
                setError('Не удалось подключиться к серверу. Убедитесь, что бэкенд запущен и доступен.');
            } else {
                setError(`Неизвестная ошибка: ${err.message}`);
            }
            setCities([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        const parts = searchQuery.split(',').map(part => part.trim());

        let name = '';
        let country = '';

        if (parts.length === 1) {
            name = parts[0];
        } else if (parts.length >= 2) {
            name = parts[0];
            country = parts[1];
        }
        // Если поиск пустой, возвращаемся к полной загрузке
        if (!name && !country) {
            fetchAllCitiesAndForecasts();
        } else {
            fetchCities(name, country);
        }
    };

    const showAddCityModal = () => {
        setEditingCity(null);
        setIsCityModalVisible(true);
    };

    const showEditCityModal = (record) => {
        setEditingCity(record);
        setIsCityModalVisible(true);
    };

    const handleCityModalCancel = () => {
        setIsCityModalVisible(false);
        setEditingCity(null);
    };

    const handleCitySave = async (values) => {
        try {
            if (editingCity) {
                const updatedCity = { ...editingCity, ...values };
                await axios.put(`${BASE_BACKEND_URL}/city/${editingCity.id}`, updatedCity);
                message.success(`Город "${values.name}" успешно обновлен!`);
            } else {
                await axios.post(`${BASE_BACKEND_URL}/city`, values);
                message.success(`Город "${values.name}" успешно добавлен!`);
            }
            setIsCityModalVisible(false);
            // После сохранения города, перезагружаем все города и их прогнозы
            fetchAllCitiesAndForecasts();
        } catch (err) {
            console.error('Ошибка при сохранении города:', err);
            message.error(`Ошибка при сохранении города: ${err.response?.data?.error || err.message}`);
        }
    };

    const handleDeleteCity = (cityId, cityName) => {
        confirm({
            title: `Вы уверены, что хотите удалить город "${cityName}"?`,
            icon: <ExclamationCircleOutlined />,
            content: 'Это действие необратимо. Будут удалены все связанные прогнозы.',
            okText: 'Да, удалить',
            okType: 'danger',
            cancelText: 'Отмена',
            onOk: async () => {
                try {
                    await axios.delete(`${BASE_BACKEND_URL}/city/${cityId}`);
                    message.success(`Город "${cityName}" успешно удален!`);
                    // После удаления города, перезагружаем все города и их прогнозы
                    fetchAllCitiesAndForecasts();
                } catch (err) {
                    console.error('Ошибка при удалении города:', err);
                    message.error(`Ошибка при удалении города: ${err.response?.data?.error || err.message}`);
                }
            },
        });
    };

    const showAddForecastModal = (cityRecord) => {
        setEditingForecast(null);
        setCurrentCityForForecast(cityRecord);
        setIsForecastModalVisible(true);
    };

    const showEditForecastModal = (forecastRecord, cityRecord) => {
        setEditingForecast(forecastRecord);
        setCurrentCityForForecast(cityRecord);
        setIsForecastModalVisible(true);
    };

    const handleForecastModalCancel = () => {
        setIsForecastModalVisible(false);
        setEditingForecast(null);
        setCurrentCityForForecast(null);
    };

    const handleForecastSave = async (values) => {
        try {
            const forecastDataToSend = {
                ...values,
                cityId: values.cityId // Убедитесь, что cityId передается правильно
            };

            if (editingForecast) {
                await axios.put(`${BASE_BACKEND_URL}/forecast/${editingForecast.id}`, forecastDataToSend);
                message.success(`Прогноз на ${values.date} успешно обновлен!`);
            } else {
                await axios.post(`${BASE_BACKEND_URL}/forecast`, forecastDataToSend);
                message.success(`Прогноз на ${values.date} успешно добавлен!`);
            }
            setIsForecastModalVisible(false);
            // После сохранения прогноза, перезагружаем все города и их прогнозы
            fetchAllCitiesAndForecasts();
        } catch (err) {
            console.error('Ошибка при сохранении прогноза:', err);
            message.error(`Ошибка при сохранении прогноза: ${err.response?.data?.error || err.message}`);
        }
    };

    const handleDeleteForecast = (forecastId, forecastDate, cityName) => {
        confirm({
            title: `Вы уверены, что хотите удалить прогноз для "${cityName}" на дату ${forecastDate}?`,
            icon: <ExclamationCircleOutlined />,
            content: 'Это действие необратимо.',
            okText: 'Да, удалить',
            okType: 'danger',
            cancelText: 'Отмена',
            onOk: async () => {
                try {
                    await axios.delete(`${BASE_BACKEND_URL}/forecast/${forecastId}`);
                    message.success(`Прогноз на ${forecastDate} успешно удален!`);
                    // После удаления прогноза, перезагружаем все города и их прогнозы
                    fetchAllCitiesAndForecasts();
                } catch (err) {
                    console.error('Ошибка при удалении прогноза:', err);
                    message.error(`Ошибка при удалении прогноза: ${err.response?.data?.error || err.message}`);
                }
            },
        });
    };

    const cityColumns = [
        ...(isAdmin ? [{ title: 'ID', dataIndex: 'id', key: 'id', width: 100 }] : []),
        { title: 'Город', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name), width: 300 },
        { title: 'Страна', dataIndex: 'country', key: 'country', sorter: (a, b) => a.country.localeCompare(b.country), width: 300 },
        ...(isAdmin ? [{
            title: 'Действия',
            key: 'city_actions',
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => showEditCityModal(record)}
                    >
                        Редактировать
                    </Button>
                    <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteCity(record.id, record.name)}
                    >
                        Удалить
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => showAddForecastModal(record)}
                    >
                        Добавить прогноз
                    </Button>
                </Space>
            ),
            width: 700,
        }] : []),
    ];

    const forecastColumns = [
        ...(isAdmin ? [{ title: 'ID Прогноза', dataIndex: 'id', key: 'id' }] : []),
        {
            title: 'Дата',
            dataIndex: 'date',
            key: 'date',
            render: (text) => {
                if (!text) return 'N/A';
                try {
                    const date = new Date(text);
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    return `${day}.${month}.${year}`;
                } catch (e) {
                    console.error("Ошибка форматирования даты:", e);
                    return text;
                }
            },
        },
        {
            title: 'Температура (°C)',
            key: 'temperature',
            render: (text, record) => `${record.temperatureMin}°C / ${record.temperatureMax}°C`,
        },
        {
            title: 'Влажность (%)',
            dataIndex: 'humidity',
            key: 'humidity',
            render: (text) => text !== null && text !== undefined ? `${text}%` : 'N/A',
        },
        {
            title: 'Скорость ветра (км/ч)',
            dataIndex: 'windSpeed',
            key: 'windSpeed',
            render: (text) => text !== null && text !== undefined ? `${text} км/ч` : 'N/A',
        },
        {
            title: 'Погодные условия',
            dataIndex: 'condition',
            key: 'condition',
            render: (text) => (
                <Space>
                    {getWeatherIcon(text)}
                    {text}
                </Space>
            ),
        },
        ...(isAdmin ? [{
            title: 'Действия',
            key: 'forecast_actions',
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => showEditForecastModal(record, record.city)}
                    >
                        Редактировать
                    </Button>
                    <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteForecast(record.id, record.date, record.city?.name || 'Неизвестный город')}
                    >
                        Удалить
                    </Button>
                </Space>
            ),
        }] : []),
    ];

    const expandedRowRender = (record) => {
        const forecastsData = record.forecasts || [];

        return (
            <Card bordered={false} style={{ margin: 0, boxShadow: 'none' }}>
                {forecastsData && forecastsData.length > 0 ? (
                    <Table
                        columns={forecastColumns}
                        dataSource={forecastsData}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        locale={{ emptyText: 'Нет данных о прогнозах для этого города' }}
                        className="forecast-table-nested"
                    />
                ) : (
                    <Typography.Text type="secondary">Прогнозов пока нет.</Typography.Text>
                )}
            </Card>
        );
    };

    const handleExpand = async (expanded, record) => {
        const keys = expanded
            ? [...expandedRowKeys, record.id]
            : expandedRowKeys.filter(key => key !== record.id);
        setExpandedRowKeys(keys);

        // При разворачивании строки, если прогнозы для города еще не загружены, загружаем их
        if (expanded && (!record.forecasts || record.forecasts.length === 0)) {
            try {
                const forecastsResponse = await axios.get(`${BASE_BACKEND_URL}/forecast/by-city/${record.id}?_t=${Date.now()}`);
                const forecasts = Array.isArray(forecastsResponse.data) ? forecastsResponse.data : [];

                setCities(prevCities =>
                    prevCities.map(city =>
                        city.id === record.id ? { ...city, forecasts } : city
                    )
                );
            } catch (err) {
                console.error(`Ошибка при загрузке прогнозов для города ${record.name} при развертывании:`, err);
                message.error(`Не удалось загрузить прогнозы для ${record.name}.`);
            }
        }
    };


    if (loading) {
        return (
            <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Spin size="large" tip="Загрузка данных..." />
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout style={{ minHeight: '100vh', padding: '24px' }}>
                <Content style={{ margin: 'auto', maxWidth: '800px' }}>
                    <Alert
                        message="Ошибка загрузки"
                        description={error}
                        type="error"
                        showIcon
                        closable
                    />
                </Content>
            </Layout>
        );
    }

    return (
        <Layout className="layout" style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #87ceeb, #ffffff)' }}>
            <Header style={{ background: '#ffffff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                    Прогноз погоды
                </Title>
                <Space>
                    {isAdmin && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={showAddCityModal}
                        >
                            Добавить город
                        </Button>
                    )}
                </Space>
            </Header>
            <Content style={{ padding: '24px 50px' }}>
                <div style={{ background: '#ffffff', padding: 24, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                    <Title level={4} style={{ marginBottom: 24 }}>Список городов и их прогнозы</Title>
                    <Input.Search
                        placeholder="Минск, Беларусь"
                        allowClear
                        enterButton="Поиск"
                        size="large"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onSearch={handleSearch}
                        style={{ marginBottom: 20, maxWidth: 400 }}
                    />
                    <Table
                        columns={cityColumns}
                        dataSource={cities}
                        rowKey="id"
                        expandable={{
                            expandedRowRender: expandedRowRender,
                            // Новое или измененное свойство:
                            rowExpandable: record => record.forecasts && record.forecasts.length > 0,
                            expandedRowKeys: expandedRowKeys,
                            onExpand: handleExpand,
                        }}
                        loading={loading}
                        className="city-table"
                        style={{ borderRadius: '8px', overflow: 'hidden' }}
                    />
                </div>
            </Content>
            <Footer style={{ textAlign: 'center', background: 'transparent' }}>
                Weather App {new Date().getFullYear()}
            </Footer>

            <CityFormModal
                visible={isCityModalVisible}
                onCancel={handleCityModalCancel}
                onSave={handleCitySave}
                initialValues={editingCity ? { name: editingCity.name, country: editingCity.country } : null}
            />

            <ForecastFormModal
                visible={isForecastModalVisible}
                onCancel={handleForecastModalCancel}
                onSave={handleForecastSave}
                initialValues={editingForecast ? { ...editingForecast, cityId: editingForecast.city?.id } : null}
                cities={cities}
                currentCityId={currentCityForForecast?.id}
            />
        </Layout>
    );
};

export default CityForecastList;