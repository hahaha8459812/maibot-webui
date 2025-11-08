import React, { useEffect, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Typography,
  Spin,
  Empty,
} from 'antd';
import apiClient from '../api';
import { useConfigPaths } from '../contexts/ConfigPathContext';
import { useLogs } from '../contexts/LogContext';

const { Title } = Typography;

const EnvConfig = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState(null);
  const { paths, loading: pathsLoading, refreshPaths } = useConfigPaths();
  const { addLog } = useLogs();

  useEffect(() => {
    if (paths.env_path && !pathsLoading) {
      setLoading(true);
      addLog('正在加载 .env 配置...', 'info');
      const fetchConfig = async () => {
        try {
          const response = await apiClient.get('/config/env');
          setInitialValues(response.data);
          form.setFieldsValue(response.data);
          addLog('.env 配置加载成功。', 'success');
        } catch (error) {
          const errorDetail = error.response?.data?.detail || '未知错误';
          const errorMessage = `加载 .env 配置失败: ${errorDetail}`;
          addLog(errorMessage, 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchConfig();
    }
  }, [paths.env_path, pathsLoading, form, addLog]);

  const onFinish = async (values) => {
    addLog('正在保存 .env 配置...', 'info');
    try {
      const response = await apiClient.put('/config/env', values);
      const successMessage = response.data.message || '配置保存成功！';
      addLog(successMessage, 'success');
    } catch (error) {
      const errorDetail = error.response?.data?.detail || '未知错误';
      const errorMessage = `保存 .env 配置失败: ${errorDetail}`;
      addLog(errorMessage, 'error');
    }
  };

  if (pathsLoading) {
    return <Spin tip="正在读取 WebUI 配置..." size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }} />;
  }

  if (!paths.env_path) {
    return (
      <Empty description="请先在“文件路径设置”页面中设置 .env 文件的路径。">
        <Button type="primary" onClick={() => refreshPaths().catch(() => {})}>
          手动加载配置
        </Button>
      </Empty>
    );
  }

  if (loading) {
    return <Spin tip="加载中..." size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }} />;
  }

  return (
    <div>
      <Title level={2}>环境配置 (.env)</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={initialValues}
        style={{ maxWidth: 600 }}
      >
        <Form.Item name="HOST" label="主机 (HOST)">
          <Input />
        </Form.Item>
        <Form.Item name="PORT" label="端口 (PORT)">
          <Input />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            保存环境配置
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default EnvConfig;
