import React, { useEffect } from 'react';
import { Modal, Form, Input, Button } from 'antd';

const CityFormModal = ({ visible, onCancel, onSave, initialValues }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible) {
            form.resetFields();
            if (initialValues) {
                form.setFieldsValue(initialValues);
            }
        }
    }, [visible, initialValues, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            onSave(values);
        } catch (errorInfo) {
            console.log('Неудачная валидация формы города:', errorInfo);
        }
    };

    return (
        <Modal
            title={initialValues ? "Редактировать город" : "Добавить новый город"}
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
            >
                <Form.Item
                    name="country"
                    label="Страна"
                    rules={[{ required: true, message: 'Пожалуйста, введите название страны!' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="name"
                    label="Название города"
                    rules={[{ required: true, message: 'Пожалуйста, введите название города!' }]}
                >
                    <Input />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CityFormModal;