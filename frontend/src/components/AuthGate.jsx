import React, { useState } from 'react';
import { Alert, Button, Card, Form, Input, Spin, Typography } from 'antd';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;

const LoginPanel = () => {
  const { login, refreshStatus } = useAuth();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const onFinish = async ({ password }) => {
    setSubmitting(true);
    setError(null);
    try {
      await login(password);
      await refreshStatus();
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || '登录失败，请重试';
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Card style={{ width: 360 }}>
        <Title level={3} style={{ textAlign: 'center' }}>
          WebUI 登录
        </Title>
        {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="password"
            label="WebUI 密码"
            rules={[{ required: true, message: '请输入 WebUI 密码' }]}
          >
            <Input.Password placeholder="请输入 WebUI 密码" autoFocus />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={submitting}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

const AuthGate = ({ children }) => {
  const { loading, passwordRequired, authenticated } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" tip="正在加载 WebUI..." />
      </div>
    );
  }

  if (!passwordRequired || authenticated) {
    return children;
  }

  return <LoginPanel />;
};

export default AuthGate;
