import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Button, Form, Input, Typography, Space, Radio, Alert } from 'antd';
import apiClient from '../api';
import { useConfigPaths } from '../contexts/ConfigPathContext';
import { useLogs } from '../contexts/LogContext';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const Paths = () => {
  const [form] = Form.useForm();
  const { paths, updatePaths, refreshPaths, loading, error } = useConfigPaths();
  const { addLog } = useLogs();
  const { refreshStatus: refreshAuthStatus, login: loginWebui, logout: logoutWebui } = useAuth();
  const [saving, setSaving] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [initialPassword, setInitialPassword] = useState('');
  const [deploymentMode, setDeploymentMode] = useState(paths.deployment_mode || 'docker');

  const passwordRules = useMemo(
    () => [
      {
        validator: (_, value) => {
          if (!value) {
            return Promise.resolve();
          }
          if (/\s/.test(value)) {
            return Promise.reject(new Error('WebUI 密码不能包含空格'));
          }
          return Promise.resolve();
        },
      },
    ],
    [],
  );

  useEffect(() => {
    const safePassword = paths.webui_password ?? '';
    form.setFieldsValue({
      bot_config: paths.bot_config_path,
      model_config: paths.model_config_path,
      env: paths.env_path,
      webui_password: safePassword,
      deployment_mode: paths.deployment_mode || 'docker',
      adapter_config_path: paths.adapter_config_path,
      project_root_path: paths.project_root_path,
    });
    setInitialPassword(safePassword);
    setPasswordTouched(false);
    setDeploymentMode(paths.deployment_mode || 'docker');
  }, [paths, form]);

  const handleValuesChange = useCallback(
    (_, allValues) => {
      if (Object.prototype.hasOwnProperty.call(allValues, 'webui_password')) {
        const currentValue = allValues.webui_password ?? '';
        setPasswordTouched(currentValue !== initialPassword);
      }
      if (Object.prototype.hasOwnProperty.call(allValues, 'deployment_mode') && allValues.deployment_mode) {
        setDeploymentMode(allValues.deployment_mode);
      }
    },
    [initialPassword],
  );

  const onFinish = async (values) => {
    addLog('正在保存配置路径...', 'info');
    setSaving(true);
    const safeCurrentPassword = paths.webui_password ?? '';
    const nextPassword = passwordTouched ? (values.webui_password ?? '') : safeCurrentPassword;
    const currentMode = values.deployment_mode || deploymentMode || 'docker';
    const isDockerMode = currentMode === 'docker';

    const pathsPayload = {
      bot_config_path: values.bot_config,
      model_config_path: values.model_config,
      env_path: values.env,
      webui_password: passwordTouched ? values.webui_password ?? '' : null,
      deployment_mode: currentMode,
      adapter_config_path: isDockerMode ? '' : values.adapter_config_path,
      project_root_path: isDockerMode ? values.project_root_path : '',
    };

    const nextPaths = {
      bot_config_path: pathsPayload.bot_config_path,
      model_config_path: pathsPayload.model_config_path,
      env_path: pathsPayload.env_path,
      webui_password: nextPassword,
      webui_password_set: nextPassword.length > 0,
      deployment_mode: currentMode,
      adapter_config_path: pathsPayload.adapter_config_path || '',
      project_root_path: pathsPayload.project_root_path || '',
    };

    try {
      const response = await apiClient.post('/config-paths', pathsPayload);
      const successMessage = response.data.message || '配置保存成功';
      addLog(successMessage, 'success');
      updatePaths(nextPaths);
      const shouldUpdatePassword = passwordTouched;
      setInitialPassword(nextPassword);
      setPasswordTouched(false);
      await refreshPaths();
      if (shouldUpdatePassword) {
        if (values.webui_password) {
          try {
            await loginWebui(values.webui_password);
          } catch (err) {
            const detail = err.response?.data?.detail || '新密码验证失败';
            addLog(detail, 'error');
          }
        } else {
          logoutWebui();
        }
      }
      await refreshAuthStatus();
    } catch (error) {
      const errorDetail = error.response?.data?.detail || '未知错误';
      const errorMessage = `保存失败: ${errorDetail} (Status: ${error.response?.status || 'N/A'})`;
      addLog(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReload = async () => {
    addLog('正在重新加载 WebUI 配置...', 'info');
    setReloading(true);
    try {
      await refreshPaths();
      addLog('WebUI 配置加载完成', 'success');
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || '未知错误';
      addLog(`加载 WebUI 配置失败: ${detail}`, 'error');
    } finally {
      setReloading(false);
    }
  };

  const isDockerMode = deploymentMode === 'docker';

  return (
    <div>
      <Title level={2}>文件路径设置</Title>
      <p>根据部署方式填写配置文件路径及附加信息。</p>
      {loading && <Text type="secondary">正在读取已保存的路径...</Text>}
      {!loading && error && (
        <Text type="danger" style={{ display: 'block', marginBottom: 12 }}>
          自动加载失败，请检查服务端日志或手动点击下方按钮重试。
        </Text>
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={handleValuesChange}
        style={{ maxWidth: 650 }}
      >
        <Form.Item
          name="deployment_mode"
          label="部署方式"
          rules={[{ required: true, message: '请选择部署方式' }]}
        >
          <Radio.Group buttonStyle="solid">
            <Radio.Button value="docker">Docker（推荐）</Radio.Button>
            <Radio.Button value="linux">Linux 直接部署</Radio.Button>
          </Radio.Group>
        </Form.Item>
        {isDockerMode ? (
          <Alert
            type="info"
            showIcon
            message="Docker 模式"
            description="使用 docker compose 运行服务。额外填写项目根目录以便查看容器日志。"
            style={{ marginBottom: 16 }}
          />
        ) : (
          <Alert
            type="info"
            showIcon
            message="Linux 模式"
            description="直接在宿主机运行 MaiBot 和 Adapter，需提供 adapter 的 config.toml 路径。"
            style={{ marginBottom: 16 }}
          />
        )}
        <Form.Item
          name="bot_config"
          label="Bot 配置文件 (bot_config.toml)"
          rules={[{ required: true, message: '请输入 bot_config.toml 的路径' }]}
        >
          <Input placeholder="例如：C:\\Users\\YourUser\\my-bot\\bot_config.toml" />
        </Form.Item>
        <Form.Item
          name="model_config"
          label="模型配置文件 (model_config.toml)"
          rules={[{ required: true, message: '请输入 model_config.toml 的路径' }]}
        >
          <Input placeholder="例如：C:\\Users\\YourUser\\my-bot\\model_config.toml" />
        </Form.Item>
        <Form.Item
          name="env"
          label="环境配置文件 (.env)"
          rules={[{ required: true, message: '请输入 .env 文件的路径' }]}
        >
          <Input placeholder="例如：C:\\Users\\YourUser\\my-bot\\.env" />
        </Form.Item>
        {isDockerMode && (
          <Form.Item
            name="project_root_path"
            label="项目根目录（Docker）"
            extra="docker-compose.yml 所在路径，用于执行 docker compose logs。"
          >
            <Input placeholder="例如：/home/user/maim-bot" />
          </Form.Item>
        )}
        {!isDockerMode && (
          <Form.Item
            name="adapter_config_path"
            label="Adapter 配置文件 (config.toml)"
            rules={[{ required: true, message: '请输入 Adapter config.toml 的路径' }]}
          >
            <Input placeholder="例如：/home/user/MaiBot-Napcat-Adapter/config.toml" />
          </Form.Item>
        )}
        <Form.Item label="WebUI 密码">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text type={paths.webui_password_set ? 'success' : 'secondary'}>
              {paths.webui_password_set ? '当前已设置 WebUI 密码' : '当前未设置 WebUI 密码'}
            </Text>
            <Form.Item name="webui_password" noStyle rules={passwordRules}>
              <Input.Password placeholder="留空表示不修改，清空后保存即可移除密码" />
            </Form.Item>
          </Space>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving} disabled={loading}>
              保存位置
            </Button>
            <Button onClick={handleReload} loading={reloading || loading}>
              手动加载配置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Paths;
