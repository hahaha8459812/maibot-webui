import React from 'react';
import { Button, Form, Input, Typography } from 'antd';
import apiClient from '../api';
import { useConfigPaths } from '../contexts/ConfigPathContext';
import { useLogs } from '../contexts/LogContext';

const { Title } = Typography;

const Paths = () => {
  const [form] = Form.useForm();
  const { updatePaths } = useConfigPaths();
  const { addLog } = useLogs();

  const onFinish = async (values) => {
    addLog('正在保存文件路径...', 'info');
    const pathsPayload = {
      bot_config_path: values.bot_config,
      model_config_path: values.model_config,
      env_path: values.env,
    };

    try {
      const response = await apiClient.post('/config-paths', pathsPayload);
      const successMessage = response.data.message || '路径保存成功！';
      addLog(successMessage, 'success');
      updatePaths(pathsPayload); // Update global context
    } catch (error) {
      const errorDetail = error.response?.data?.detail || '未知错误';
      const errorMessage = `路径保存失败: ${errorDetail} (Status: ${error.response?.status || 'N/A'})`;
      addLog(errorMessage, 'error');
    }
  };

  return (
    <div>
      <Title level={2}>文件路径设置</Title>
      <p>请输入三个配置文件的绝对路径。</p>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ maxWidth: 600 }}
      >
        <Form.Item
          name="bot_config"
          label="Bot 配置文件 (bot_config.toml)"
          rules={[{ required: true, message: '请输入 bot_config.toml 的路径' }]}
        >
          <Input placeholder="例如：C:\Users\YourUser\my-bot\bot_config.toml" />
        </Form.Item>
        <Form.Item
          name="model_config"
          label="模型配置文件 (model_config.toml)"
          rules={[{ required: true, message: '请输入 model_config.toml 的路径' }]}
        >
          <Input placeholder="例如：C:\Users\YourUser\my-bot\model_config.toml" />
        </Form.Item>
        <Form.Item
          name="env"
          label="环境配置文件 (.env)"
          rules={[{ required: true, message: '请输入 .env 文件的路径' }]}
        >
          <Input placeholder="例如：C:\Users\YourUser\my-bot\.env" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            保存路径
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Paths;