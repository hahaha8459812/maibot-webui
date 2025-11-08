import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  FileOutlined,
  SettingOutlined,
  ApartmentOutlined,
  CodeOutlined,
  ReadOutlined,
  AppstoreAddOutlined,
} from '@ant-design/icons';
import { Layout, Menu, theme, ConfigProvider, Space, App as AntApp, Button } from 'antd';
import Paths from './pages/Paths';
import LogPage from './pages/Logs';
import BotConfig from './pages/BotConfig';
import ModelConfig from './pages/ModelConfig';
import EnvConfig from './pages/EnvConfig';
import PluginMarket from './pages/PluginMarket';
import { useTheme } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import { useConfigPaths } from './contexts/ConfigPathContext';

const { Header, Content, Sider } = Layout;

const MainApp = () => {
  const location = useLocation();
  const { passwordRequired, logout } = useAuth();
  const { paths } = useConfigPaths();
  const {
    token: { colorBgContainer, borderRadiusLG, colorTextSecondary },
  } = theme.useToken();
  const isDockerMode = (paths.deployment_mode || 'docker') !== 'linux';

  const menuItems = [
    {
      key: '/',
      icon: <FileOutlined />,
      label: <Link to="/">文件路径</Link>,
    },
    {
      key: '/bot-config',
      icon: <SettingOutlined />,
      label: <Link to="/bot-config">Bot 配置</Link>,
    },
    {
      key: '/model-config',
      icon: <ApartmentOutlined />,
      label: <Link to="/model-config">模型配置</Link>,
    },
    {
      key: '/env-config',
      icon: <CodeOutlined />,
      label: <Link to="/env-config">环境配置</Link>,
    },
    {
      key: '/plugin-market',
      icon: <AppstoreAddOutlined />,
      label: <Link to="/plugin-market">插件广场</Link>,
    },
  ];

  if (isDockerMode) {
    menuItems.push({
      key: '/logs',
      icon: <ReadOutlined />,
      label: <Link to="/logs">容器日志</Link>,
    });
  }

  const siderWidth = 200;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={siderWidth}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '6px' }} />
        <Menu theme="dark" selectedKeys={[location.pathname]} mode="inline" items={menuItems} />
      </Sider>
      <Layout style={{ marginLeft: siderWidth }}>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Space>
            <span style={{ color: colorTextSecondary }}>暗色模式</span>
            {passwordRequired && (
              <Button type="link" onClick={logout}>
                退出登录
              </Button>
            )}
          </Space>
        </Header>
        <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          <div
            style={{
              padding: 24,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              textAlign: 'left',
            }}
          >
            <Routes>
              <Route path="/" element={<Paths />} />
              <Route path="/bot-config" element={<BotConfig />} />
              <Route path="/model-config" element={<ModelConfig />} />
              <Route path="/env-config" element={<EnvConfig />} />
              <Route path="/plugin-market" element={<PluginMarket />} />
              {isDockerMode && <Route path="/logs" element={<LogPage />} />}
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

const App = () => {
  const { themeConfig } = useTheme();

  return (
    <ConfigProvider theme={themeConfig}>
      <AntApp>
        <MainApp />
      </AntApp>
    </ConfigProvider>
  );
};

export default App;
