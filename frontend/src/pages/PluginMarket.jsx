import React, { useState } from 'react';
import { Alert, Spin, Button } from 'antd';

const PLUGIN_MARKET_URL = 'https://plugins.maibot.chat/';

const PluginMarket = () => {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: 'calc(100vh - 220px)',
    minHeight: 500,
    padding: 12,
    backgroundColor: '#0f1a2b',
    borderRadius: 12,
  };

  const iframeStyle = {
    border: 'none',
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#fff',
  };

  return (
    <div style={containerStyle}>
      {loading && !hasError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <Spin tip="插件广场加载中，请稍候..." />
        </div>
      )}
      {hasError ? (
        <Alert
          type="error"
          showIcon
          message="插件广场加载失败"
          description={
            <>
              可能是浏览器阻止了内嵌内容。请
              <Button
                type="link"
                href={PLUGIN_MARKET_URL}
                target="_blank"
                rel="noreferrer"
                style={{ padding: 0 }}
              >
                点击这里
              </Button>
              在新窗口中打开。
            </>
          }
        />
      ) : (
        <iframe
          title="Maibot 插件广场"
          src={PLUGIN_MARKET_URL}
          style={iframeStyle}
          loading="lazy"
          allow="fullscreen"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setHasError(true);
          }}
        />
      )}
    </div>
  );
};

export default PluginMarket;
