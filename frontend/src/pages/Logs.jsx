import React, { useEffect, useState, useCallback } from 'react';
import { Button, Typography, Space, Spin, Alert, List, Tag, Divider } from 'antd';
import apiClient from '../api';
import { useLogs } from '../contexts/LogContext';
import { useConfigPaths } from '../contexts/ConfigPathContext';

const { Title, Paragraph } = Typography;

const LogPage = () => {
  const { logs, clearLogs } = useLogs();
  const { paths } = useConfigPaths();
  const isDockerMode = (paths.deployment_mode || 'docker') !== 'linux';

  const [dockerLogs, setDockerLogs] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDockerLogs = useCallback(async () => {
    if (!isDockerMode) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/docker/logs', { params: { limit: 400 } });
      setDockerLogs(response.data.logs || '');
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || '获取日志失败';
      setError(detail);
    } finally {
      setLoading(false);
    }
  }, [isDockerMode]);

  useEffect(() => {
    if (isDockerMode) {
      fetchDockerLogs();
    }
  }, [isDockerMode, fetchDockerLogs]);

  if (!isDockerMode) {
    return (
      <Alert
        type="info"
        message="Linux 部署模式未启用日志页"
        description="请在 Docker 部署模式下查看容器日志。"
        showIcon
      />
    );
  }

  const renderDockerLogs = () => (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Title level={3} style={{ margin: 0 }}>
          容器日志
        </Title>
        <Space>
          <Button onClick={fetchDockerLogs} loading={loading}>
            刷新
          </Button>
          <Button onClick={fetchDockerLogs} loading={loading} type="primary">
            再次获取
          </Button>
        </Space>
      </div>
      {error && (
        <Alert type="error" message={error} showIcon style={{ marginBottom: 12 }} />
      )}
      {loading ? (
        <Spin tip="正在获取 docker compose 日志..." />
      ) : (
        <pre
          style={{
            background: '#111826',
            color: '#dbe4ff',
            padding: '16px',
            borderRadius: 8,
            maxHeight: '60vh',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          {dockerLogs || '暂无日志输出。'}
        </pre>
      )}
    </div>
  );

  const renderActionLogs = () => (
    <>
      <Divider />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>
          WebUI 操作日志
        </Title>
        <Button onClick={clearLogs} danger>
          清空
        </Button>
      </div>
      <List
        bordered
        dataSource={logs}
        renderItem={(log) => (
          <List.Item>
            <Paragraph style={{ margin: 0 }}>
              <Tag color={log.type === 'error' ? 'red' : log.type === 'success' ? 'green' : 'blue'}>
                {log.type.toUpperCase()}
              </Tag>
              <span style={{ color: '#888', marginRight: 10 }}>
                {new Date(log.timestamp).toLocaleString()}
              </span>
              {log.message}
            </Paragraph>
          </List.Item>
        )}
        style={{ maxHeight: '40vh', overflowY: 'auto' }}
      />
    </>
  );

  return (
    <div>
      {renderDockerLogs()}
      {renderActionLogs()}
    </div>
  );
};

export default LogPage;
