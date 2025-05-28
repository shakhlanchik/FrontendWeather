import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Select, Button } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;

const ForecastFormModal = ({ visible, onCancel, onSave, initialValues, cities, currentCityId }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible) {
            form.resetFields();

            if (initialValues) {
                const formData = {
                    ...initialValues,
                    date: initialValues.date ? dayjs(initialValues.date) : null,
                    cityId: initialValues.cityId || initialValues.city?.id || null,
                };
                form.setFieldsValue(formData);
            } else if (currentCityId) {
                form.setFieldsValue({ cityId: currentCityId });
            }
        }
    }, [visible, initialValues, currentCityId, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const formattedValues = {
                ...values,
                date: values.date ? values.date.format('YYYY-MM-DD') : null,
            };
            onSave(formattedValues);
        } catch (errorInfo) {
            console.log('Неудачная валидация формы прогноза:', errorInfo);
        }
    };

    return (
        <Modal
            title={initialValues ? "Редактировать прогноз" : "Добавить новый прогноз"}
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="back" onClick={onCancel}>
                    Отмена
                </Button>,
                <Button key="submit" type="primary" onClick={handleOk}>
                    {initialValues ? "Сохранить изменения" : "Добавить"}
                </Button>,
            ]}
            destroyOnClose={true}
        >
            <Form
                form={form}
                layout="vertical"
                name="forecast_form"
            >
                <Form.Item
                    name="cityId"
                    label="Город"
                    rules={[{ required: true, message: 'Пожалуйста, выберите город!' }]}
                    style={{ marginBottom: '5px' }}
                >
                    <Select placeholder="Выберите город" disabled={!!currentCityId && !initialValues}>
                        {cities.map(city => (
                            <Option key={city.id} value={city.id}>
                                {city.name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="date"
                    label="Дата"
                    rules={[{ required: true, message: 'Пожалуйста, выберите дату!' }]}
                    style={{ marginBottom: '5px' }}
                >
                    <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                    name="temperatureMin"
                    label="Минимальная температура (°C)"
                    rules={[{ required: true, message: 'Пожалуйста, введите мин. температуру!' }]}
                    style={{ marginBottom: '5px' }}
                >
                    <InputNumber min={-100} max={100} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                    name="temperatureMax"
                    label="Максимальная температура (°C)"
                    rules={[{ required: true, message: 'Пожалуйста, введите макс. температуру!' }]}
                    style={{ marginBottom: '5px' }}
                >
                    <InputNumber min={-50} max={50} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                    name="humidity"
                    label="Влажность (%)"
                    rules={[{ required: true, message: 'Пожалуйста, введите влажность!' }]}
                    style={{ marginBottom: '5px' }}
                >
                    <InputNumber min={0} max={100} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                    name="windSpeed"
                    label="Скорость ветра (км/ч)"
                    rules={[{ required: true, message: 'Пожалуйста, введите скорость ветра!' }]}
                    style={{ marginBottom: '5px' }}
                >
                    <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                    name="condition"
                    label="Погодные условия"
                    rules={[{ required: true, message: 'Пожалуйста, введите погодные условия!' }]}
                    style={{ marginBottom: '5px' }}                >
                    <Input />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ForecastFormModal;