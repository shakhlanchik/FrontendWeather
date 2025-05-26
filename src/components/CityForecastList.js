import React, { useState, useEffect } from 'react';
import { Table, Spin, Typography, Button, Modal, message, Space, Card, Alert, Layout, Input } from 'antd';
import axios from 'axios';
import CityFormModal from './CityFormModal';
import ForecastFormModal from './ForecastFormModal';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { WiDaySunny, WiCloudy, WiRain, WiSnow, WiThunderstorm, WiFog } from 'react-icons/wi';

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
        fetchCitiesInitial();
    }, []);

    const fetchCitiesInitial = async () => {
        setLoading(true);
        try {
            const url = `http://localhost:8080/city/all?_t=${Date.now()}`;
            console.log('Изначальный URL для всех городов:', url);
            const response = await axios.get(url);
            setCities(response.data);
            setError(null);
        } catch (err) {
            console.error('Ошибка при изначальной загрузке городов:', err);
            if (err.response) {
                setError(`Ошибка сервера: ${err.response.status} - ${err.response.data.error || err.message}`);
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
            let url = `http://localhost:8080/forecast/name?_t=${Date.now()}`

            if (searchName) {
                url += `&name=${encodeURIComponent(searchName)}`;
            }
            if (searchCountry) {
                url += `&country=${encodeURIComponent(searchCountry)}`;
            }

            console.log('Отправляемый URL для поиска прогнозов:', url);
            const response = await axios.get(url);

            console.log('Полученные данные от бэкенда (только прогнозы):', response.data);

            const fetchedForecasts = response.data;

            const groupedCities = {};

            const allCitiesMap = new Map(cities.map(city => [city.id, city]));

            fetchedForecasts.forEach(forecast => {
                const cityId = forecast.cityId;
                let cityName = 'Неизвестный город';
                let cityCountry = 'Неизвестная страна';

                if (allCitiesMap.has(cityId)) {
                    const existingCity = allCitiesMap.get(cityId);
                    cityName = existingCity.name;
                    cityCountry = existingCity.country;
                }

                if (!groupedCities[cityId]) {
                    groupedCities[cityId] = {
                        id: cityId,
                        name: cityName,
                        country: cityCountry,
                        forecasts: []
                    };
                }
                groupedCities[cityId].forecasts.push(forecast);
            });

            const resultCities = Object.values(groupedCities);

            setCities(resultCities);

            setError(null);
        } catch (err) {
            console.error('Ошибка при поиске прогнозов:', err);
            if (err.response) {
                setError(`Ошибка сервера: ${err.response.status} - ${err.response.data.error || err.message}`);
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

        fetchCities(name, country);
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
                await axios.put(`http://localhost:8080/city/${editingCity.id}`, updatedCity);
                message.success(`Город "${values.name}" успешно обновлен!`);
            } else {
                await axios.post('http://localhost:8080/city', values);
                message.success(`Город "${values.name}" успешно добавлен!`);
            }
            setIsCityModalVisible(false);
            fetchCities();
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
                    await axios.delete(`http://localhost:8080/city/${cityId}`);
                    message.success(`Город "${cityName}" успешно удален!`);
                    fetchCities();
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
                city: { id: values.cityId }
            };

            if (editingForecast) {
                await axios.put(`http://localhost:8080/forecast/${editingForecast.id}`, { ...editingForecast, ...forecastDataToSend });
                message.success(`Прогноз на ${values.date} успешно обновлен!`);
            } else {
                await axios.post('http://localhost:8080/forecast', forecastDataToSend);
                message.success(`Прогноз на ${values.date} успешно добавлен!`);
            }
            setIsForecastModalVisible(false);
            fetchCities();
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
                    await axios.delete(`http://localhost:8080/forecast/${forecastId}`);
                    message.success(`Прогноз на ${forecastDate} успешно удален!`);
                    setCities(prevCities => {
                        return prevCities.map(city => {
                            if (city.forecasts) {
                                return {
                                    ...city,
                                    forecasts: city.forecasts.filter(forecast => forecast.id !== forecastId)
                                };
                            }
                            return city;
                        });
                    });
                } catch (err) {
                    console.error('Ошибка при удалении прогноза:', err);
                    message.error(`Ошибка при удалении прогноза: ${err.response?.data?.error || err.message}`);
                    fetchCities();
                }
            },
        });
    };

    const cityColumns = [
        ...(isAdmin ? [{ title: 'ID', dataIndex: 'id', key: 'id' }] : []),
        { title: 'Город', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: 'Страна', dataIndex: 'country', key: 'country', sorter: (a, b) => a.country.localeCompare(b.country) },
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
                {/* Здесь можно добавить логику входа/выхода/регистрации */}
                <Space>
                    {/* <Button type="primary">Войти</Button> */}
                </Space>
                <Space>
                    {isAdmin && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={showAddCityModal}
                    >
                        Добавить город
                    </Button>
                    )} {/*
                    {/* <Button type="primary">Войти</Button> */}
                    {/* Для других кнорок, например, для входа/выхода, они могут быть здесь */}
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
                            rowExpandable: record => record.forecasts && record.forecasts.length > 0,
                            expandedRowKeys: expandedRowKeys,
                            onExpand: (expanded, record) => {
                                const keys = expanded
                                    ? [...expandedRowKeys, record.id]
                                    : expandedRowKeys.filter(key => key !== record.id);
                                setExpandedRowKeys(keys);
                            },
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
