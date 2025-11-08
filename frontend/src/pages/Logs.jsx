import React from 'react';
import { Button, Typography, List, Tag } from 'antd';
import { useLogs } from '../contexts/LogContext';

const { Title, Paragraph } = Typography;

const LogPage = () => {
  const { logs, clearLogs } = useLogs();

  const getTagColor = (type) => {
    switch (type) {
      case 'error':
        return 'red';
      case 'success':
        return 'green';
      case 'info':
      default:
        return 'blue';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>应用日志</Title>
        <Button onClick={clearLogs} danger>
          清空日志
        </Button>
      </div>
      <List
        bordered
        dataSource={logs}
        renderItem={(log) => (
          <List.Item>
            <Paragraph style={{ margin: 0 }}>
              <Tag color={getTagColor(log.type)}>{log.type.toUpperCase()}</Tag>
              <span style={{ color: '#888', marginRight: '10px' }}>{new Date(log.timestamp).toLocaleString()}</span>
              {log.message}
            </Paragraph>
          </List.Item>
        )}
        style={{ height: '70vh', overflowY: 'auto' }}
      />
    </div>
  );
};

export default LogPage;