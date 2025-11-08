import React, { useEffect, useState } from 'react';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Switch,
  Typography,
  Collapse,
  Spin,
  Space,
  Card,
  Empty,
  theme,
  Divider,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import apiClient from '../api';
import { useConfigPaths } from '../contexts/ConfigPathContext';
import { useLogs } from '../contexts/LogContext';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const taskNameMap = {
  utils: {
    name: "通用模型",
    comment: "在麦麦的一些组件中使用的模型，例如表情包模块，取名模块，关系模块，麦麦的情绪变化等，是麦麦必须的模型"
  },
  utils_small: {
    name: "通用小模型",
    comment: "在麦麦的一些组件中使用的小模型，消耗量较大，建议使用速度较快的小模型"
  },
  tool_use: {
    name: "工具调用模型",
    comment: "需要使用支持工具调用的模型"
  },
  replyer: {
    name: "首要回复模型",
    comment: "还用于表达器和表达方式学习"
  },
  planner: {
    name: "决策模型",
    comment: "负责决定麦麦该什么时候回复的模型"
  },
  vlm: {
    name: "图像识别模型 (VLM)",
    comment: "用于识别图片内容"
  },
  voice: {
    name: "语音识别模型",
    comment: "用于识别语音消息"
  },
  embedding: {
    name: "嵌入模型",
    comment: "用于lpmm知识库等需要用到向量搜索的功能"
  },
  lpmm_entity_extract: {
    name: "LPMM 实体提取模型",
    comment: "用于从文本中提取实体"
  },
  lpmm_rdf_build: {
    name: "LPMM RDF 构建模型",
    comment: "用于构建知识图谱"
  },
  lpmm_qa: {
    name: "LPMM 问答模型",
    comment: "用于在知识库中进行问答"
  }
};


const ModelConfig = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState(null);
  const { paths } = useConfigPaths();
  const { addLog } = useLogs();
  const { token } = theme.useToken();

  const cardStyle = {
    marginBottom: 16,
    border: `2px solid ${token.colorPrimary}`,
  };

  useEffect(() => {
    if (paths.model_config_path) {
      setLoading(true);
      addLog('正在加载模型配置...', 'info');
      const fetchConfig = async () => {
        try {
          const response = await apiClient.get('/config/model_config');
          setInitialValues(response.data);
          form.setFieldsValue(response.data);
          addLog('模型配置加载成功。', 'success');
        } catch (error) {
          const errorDetail = error.response?.data?.detail || '未知错误';
          const errorMessage = `加载模型配置失败: ${errorDetail}`;
          addLog(errorMessage, 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchConfig();
    }
  }, [paths.model_config_path, form, addLog]);

  const onFinish = async (values) => {
    addLog('正在保存模型配置...', 'info');
    // Handle the extra_params logic before submitting
    const processedValues = JSON.parse(JSON.stringify(values)); // Deep copy
    if (processedValues.models) {
      processedValues.models.forEach(model => {
        if (model.extra_params && model.extra_params.enable_thinking === false) {
          // If the switch is off, we set extra_params to null to signal deletion to the backend
          model.extra_params = null;
        }
      });
    }

    try {
      const response = await apiClient.put('/config/model_config', processedValues);
      const successMessage = response.data.message || '配置保存成功！';
      addLog(successMessage, 'success');
      // Refetch config to get the cleaned data structure from the server
      const newConfig = await apiClient.get('/config/model_config');
      setInitialValues(newConfig.data);
      form.setFieldsValue(newConfig.data);

    } catch (error) {
      const errorDetail = error.response?.data?.detail || '未知错误';
      const errorMessage = `保存模型配置失败: ${errorDetail}`;
      addLog(errorMessage, 'error');
    }
  };

  if (!paths.model_config_path) {
    return <Empty description="请先在“文件路径设置”页面中设置 model_config.toml 的路径。" />;
  }

  if (loading) {
    return <Spin tip="加载中..." size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }} />;
  }

  return (
    <div>
      <Title level={2}>模型配置 (model_config.toml)</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={initialValues}
        autoComplete="off"
      >
        <Collapse defaultActiveKey={[]}>
          <Panel header="API 服务提供商" key="api_providers">
            <Form.List name="api_providers">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(field => (
                    <Card
                      key={field.key}
                      title={`服务商 ${field.name + 1}`}
                      extra={<MinusCircleOutlined onClick={() => remove(field.name)} />}
                      style={cardStyle}
                    >
                      <Form.Item {...field} name={[field.name, 'name']} label="名称">
                        <Input />
                      </Form.Item>
                      <Form.Item {...field} name={[field.name, 'base_url']} label="Base URL">
                        <Input />
                      </Form.Item>
                      <Form.Item {...field} name={[field.name, 'api_key']} label="API Key">
                        <Input.Password />
                      </Form.Item>
                      <Form.Item {...field} name={[field.name, 'client_type']} label="客户端类型">
                        <Input placeholder="openai / gemini" />
                      </Form.Item>
                       <Form.Item {...field} name={[field.name, 'max_retry']} label="最大重试次数">
                        <InputNumber />
                      </Form.Item>
                       <Form.Item {...field} name={[field.name, 'timeout']} label="超时时间 (秒)">
                        <InputNumber />
                      </Form.Item>
                       <Form.Item {...field} name={[field.name, 'retry_interval']} label="重试间隔 (秒)">
                        <InputNumber />
                      </Form.Item>
                    </Card>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      添加 API 服务商
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Panel>
          <Panel header="模型" key="models">
            <Form.List name="models">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => (
                    <Card
                      key={field.key}
                      title={`模型 ${index + 1}`}
                      extra={<MinusCircleOutlined onClick={() => remove(field.name)} />}
                      style={cardStyle}
                    >
                      <Form.Item {...field} name={[field.name, 'model_identifier']} label="模型 ID">
                        <Input />
                      </Form.Item>
                      <Form.Item {...field} name={[field.name, 'name']} label="模型名称 (自定义)">
                        <Input />
                      </Form.Item>
                      <Form.Item {...field} name={[field.name, 'api_provider']} label="API 服务商名称">
                        <Input />
                      </Form.Item>
                      <Form.Item {...field} name={[field.name, 'price_in']} label="输入价格 (元/M token)">
                        <InputNumber />
                      </Form.Item>
                      <Form.Item {...field} name={[field.name, 'price_out']} label="输出价格 (元/M token)">
                        <InputNumber />
                      </Form.Item>
                       <Form.Item {...field} name={[field.name, 'force_stream_mode']} label="强制流式输出" valuePropName="checked">
                        <Switch />
                      </Form.Item>
                      <Divider />
                      <Form.Item 
                        {...field} 
                        name={[field.name, 'extra_params', 'enable_thinking']} 
                        label="启用思考 (Enable Thinking)" 
                        valuePropName="checked"
                        // Set initial value to false if extra_params is missing
                        initialValue={initialValues?.models?.[index]?.extra_params?.enable_thinking || false}
                      >
                        <Switch />
                      </Form.Item>
                    </Card>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      添加模型
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Panel>
           <Panel header="模型任务配置" key="model_task_config">
            {Object.keys(initialValues?.model_task_config || {}).map(taskName => (
              <Card 
                key={taskName} 
                title={taskNameMap[taskName]?.name || taskName} 
                style={cardStyle}
              >
                {taskNameMap[taskName]?.comment && (
                  <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                    {taskNameMap[taskName].comment}
                  </Text>
                )}
                <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontStyle: 'italic' }}>
                  注意：请在此处填写您在上方“模型”部分定义的“模型名称 (自定义)”。
                </Text>
                <Form.List name={['model_task_config', taskName, 'model_list']}>
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((field, index) => (
                        <Space key={field.key} align="baseline">
                          <Form.Item {...field} name={[field.name]} label={`模型 ${index + 1}`}>
                            <Input />
                          </Form.Item>
                          <MinusCircleOutlined onClick={() => remove(field.name)} />
                        </Space>
                      ))}
                      <Form.Item>
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                          添加模型到列表
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
                {/* Conditionally render temperature and max_tokens based on taskName */}
                {!['vlm', 'voice', 'embedding'].includes(taskName) && (
                  <>
                    <Form.Item name={['model_task_config', taskName, 'temperature']} label="温度">
                      <InputNumber min={0} max={2} step={0.1} />
                    </Form.Item>
                    <Form.Item name={['model_task_config', taskName, 'max_tokens']} label="最大 Tokens">
                      <InputNumber />
                    </Form.Item>
                  </>
                )}
                 {taskName === 'vlm' && (
                    <Form.Item name={['model_task_config', taskName, 'max_tokens']} label="最大 Tokens">
                      <InputNumber />
                    </Form.Item>
                 )}
              </Card>
            ))}
          </Panel>
        </Collapse>

        <Form.Item style={{ marginTop: 24 }}>
          <Button type="primary" htmlType="submit">
            保存模型配置
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ModelConfig;