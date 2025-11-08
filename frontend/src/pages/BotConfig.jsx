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
  Empty,
  Card,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import apiClient from '../api';
import { useConfigPaths } from '../contexts/ConfigPathContext';
import { useLogs } from '../contexts/LogContext';

const { Title } = Typography;
const { Panel } = Collapse;

const BotConfig = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState(null);
  const { paths } = useConfigPaths();
  const { addLog } = useLogs();

  useEffect(() => {
    if (paths.bot_config_path) {
      setLoading(true);
      addLog('正在加载 Bot 配置...', 'info');
      const fetchConfig = async () => {
        try {
          const response = await apiClient.get('/config/bot_config');
          setInitialValues(response.data);
          form.setFieldsValue(response.data);
          addLog('Bot 配置加载成功。', 'success');
        } catch (error) {
          const errorDetail = error.response?.data?.detail || '未知错误';
          const errorMessage = `加载 Bot 配置失败: ${errorDetail}`;
          addLog(errorMessage, 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchConfig();
    }
  }, [paths.bot_config_path, form, addLog]);

  const onFinish = async (values) => {
    addLog('正在保存 Bot 配置...', 'info');
    const cleanValues = JSON.parse(JSON.stringify(values));
    try {
      const response = await apiClient.put('/config/bot_config', cleanValues);
      const successMessage = response.data.message || '配置保存成功！';
      addLog(successMessage, 'success');
    } catch (error) {
      const errorDetail = error.response?.data?.detail || '未知错误';
      const errorMessage = `保存 Bot 配置失败: ${errorDetail}`;
      addLog(errorMessage, 'error');
    }
  };

  if (!paths.bot_config_path) {
    return <Empty description="请先在“文件路径设置”页面中设置 bot_config.toml 的路径。" />;
  }

  if (loading) {
    return <Spin tip="加载中..." size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }} />;
  }

  return (
    <div>
      <Title level={2}>Bot 配置 (bot_config.toml)</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={initialValues}
      >
        <Collapse defaultActiveKey={[]}>
          <Panel header="机器人设置" key="bot">
            <Form.Item name={['bot', 'platform']} label="平台">
              <Input />
            </Form.Item>
            <Form.Item name={['bot', 'qq_account']} label="QQ 账号">
              <Input />
            </Form.Item>
            <Form.Item name={['bot', 'nickname']} label="昵称">
              <Input />
            </Form.Item>
            <Form.List name={['bot', 'alias_names']}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item {...restField} name={[name]} rules={[{ required: true, message: '请输入别名' }]}>
                        <Input placeholder="别名" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      添加别名
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Panel>
          <Panel header="性格设置" key="personality">
            <Form.Item name={['personality', 'personality']} label="性格描述">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item name={['personality', 'reply_style']} label="回复风格">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item name={['personality', 'interest']} label="兴趣">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item name={['personality', 'plan_style']} label="群聊行为风格">
              <Input.TextArea rows={6} />
            </Form.Item>
            <Form.Item name={['personality', 'visual_style']} label="识图规则">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item name={['personality', 'private_plan_style']} label="私聊行为风格">
              <Input.TextArea rows={4} />
            </Form.Item>
          </Panel>
          <Panel header="表达设置" key="expression">
            <Title level={5}>学习配置</Title>
            <Form.List name={['expression', 'learning_list']}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => (
                    <Card size="small" title={`学习配置 ${index + 1}`} key={field.key} extra={<MinusCircleOutlined onClick={() => remove(field.name)} />}>
                      <Space align="baseline" style={{ display: 'flex', flexWrap: 'wrap' }}>
                        <Form.Item {...field} name={[field.name, 0]} label="聊天流 ID">
                          <Input placeholder="chat_stream_id" />
                        </Form.Item>
                        <Form.Item {...field} name={[field.name, 1]} label="使用表达">
                          <Input placeholder="enable/disable" />
                        </Form.Item>
                        <Form.Item {...field} name={[field.name, 2]} label="学习表达">
                          <Input placeholder="enable/disable" />
                        </Form.Item>
                        <Form.Item {...field} name={[field.name, 3]} label="学习强度">
                          <InputNumber />
                        </Form.Item>
                      </Space>
                    </Card>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add(['', 'enable', 'enable', 1.0])} block icon={<PlusOutlined />}>
                      添加学习配置
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
            <Title level={5}>共享组</Title>
            <Form.List name={['expression', 'expression_groups']}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => (
                    <Card size="small" title={`共享组 ${index + 1}`} key={field.key} style={{ marginBottom: 16 }} extra={<MinusCircleOutlined onClick={() => remove(field.name)} />}>
                      <Form.List name={field.name}>
                        {(subFields, { add: subAdd, remove: subRemove }) => (
                          <>
                            {subFields.map(subField => (
                              <Space key={subField.key} align="baseline">
                                <Form.Item {...subField}>
                                  <Input placeholder="chat_id (e.g., qq:123:private or *)" />
                                </Form.Item>
                                <MinusCircleOutlined onClick={() => subRemove(subField.name)} />
                              </Space>
                            ))}
                            <Form.Item>
                              <Button type="dashed" onClick={() => subAdd()} block icon={<PlusOutlined />}>
                                添加 Chat ID
                              </Button>
                            </Form.Item>
                          </>
                        )}
                      </Form.List>
                    </Card>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add([])} block icon={<PlusOutlined />}>
                      添加共享组
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Panel>
          <Panel header="聊天设置" key="chat">
            <Form.Item name={['chat', 'talk_value']} label="发言意愿">
              <InputNumber />
            </Form.Item>
            <Form.Item name={['chat', 'mentioned_bot_reply']} label="提及必回复" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name={['chat', 'max_context_size']} label="上下文长度">
              <InputNumber />
            </Form.Item>
          </Panel>
          <Panel header="关系系统" key="relationship">
            <Form.Item name={['relationship', 'enable_relationship']} label="启用关系系统" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Panel>
          <Panel header="工具" key="tool">
            <Form.Item name={['tool', 'enable_tool']} label="启用回复工具" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Panel>
          <Panel header="情绪系统" key="mood">
            <Form.Item name={['mood', 'enable_mood']} label="启用情绪系统" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name={['mood', 'mood_update_threshold']} label="情绪更新阈值">
              <InputNumber />
            </Form.Item>
            <Form.Item name={['mood', 'emotion_style']} label="情感特征">
              <Input />
            </Form.Item>
          </Panel>
          <Panel header="表情包" key="emoji">
            <Form.Item name={['emoji', 'emoji_chance']} label="激活概率">
              <InputNumber min={0} max={1} step={0.1} />
            </Form.Item>
            <Form.Item name={['emoji', 'max_reg_num']} label="最大注册数量">
              <InputNumber />
            </Form.Item>
            <Form.Item name={['emoji', 'do_replace']} label="达到上限时替换" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name={['emoji', 'check_interval']} label="检查间隔(分钟)">
              <InputNumber />
            </Form.Item>
            <Form.Item name={['emoji', 'steal_emoji']} label="偷表情包" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name={['emoji', 'content_filtration']} label="启用内容过滤" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name={['emoji', 'filtration_prompt']} label="过滤要求">
              <Input />
            </Form.Item>
          </Panel>
          <Panel header="语音" key="voice">
            <Form.Item name={['voice', 'enable_asr']} label="启用语音识别" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Panel>
          <Panel header="消息接收" key="message_receive">
            <Form.List name={['message_receive', 'ban_words']}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item {...restField} name={[name]}>
                        <Input placeholder="屏蔽词" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      添加屏蔽词
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
            <Form.List name={['message_receive', 'ban_msgs_regex']}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item {...restField} name={[name]}>
                        <Input placeholder="正则表达式" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      添加屏蔽正则
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Panel>
          <Panel header="LPMM 知识库" key="lpmm_knowledge">
            <Form.Item name={['lpmm_knowledge', 'enable']} label="启用" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name={['lpmm_knowledge', 'rag_synonym_search_top_k']} label="同义词搜索 TopK">
              <InputNumber />
            </Form.Item>
            <Form.Item name={['lpmm_knowledge', 'rag_synonym_threshold']} label="同义词阈值">
              <InputNumber min={0} max={1} step={0.1} />
            </Form.Item>
            <Form.Item name={['lpmm_knowledge', 'info_extraction_workers']} label="实体提取线程数">
              <InputNumber />
            </Form.Item>
            <Form.Item name={['lpmm_knowledge', 'qa_relation_search_top_k']} label="关系搜索 TopK">
              <InputNumber />
            </Form.Item>
            <Form.Item name={['lpmm_knowledge', 'qa_relation_threshold']} label="关系阈值">
              <InputNumber min={0} max={1} step={0.1} />
            </Form.Item>
            <Form.Item name={['lpmm_knowledge', 'qa_paragraph_search_top_k']} label="段落搜索 TopK">
              <InputNumber />
            </Form.Item>
            <Form.Item name={['lpmm_knowledge', 'qa_paragraph_node_weight']} label="段落节点权重">
              <InputNumber step={0.01} />
            </Form.Item>
            <Form.Item name={['lpmm_knowledge', 'qa_ent_filter_top_k']} label="实体过滤 TopK">
              <InputNumber />
            </Form.Item>
            <Form.Item name={['lpmm_knowledge', 'qa_ppr_damping']} label="PPR 阻尼系数">
              <InputNumber min={0} max={1} step={0.1} />
            </Form.Item>
            <Form.Item name={['lpmm_knowledge', 'qa_res_top_k']} label="最终提供文段 TopK">
              <InputNumber />
            </Form.Item>
            <Form.Item name={['lpmm_knowledge', 'embedding_dimension']} label="嵌入向量维度">
              <InputNumber />
            </Form.Item>
          </Panel>
          <Panel header="关键词回复" key="keyword_reaction">
            <Title level={5}>关键词规则</Title>
            <Form.List name={['keyword_reaction', 'keyword_rules']}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(field => (
                    <Card size="small" title={`规则 ${field.name + 1}`} key={field.key} style={{ marginBottom: 16 }} extra={<MinusCircleOutlined onClick={() => remove(field.name)} />}>
                      <Form.Item {...field} name={[field.name, 'reaction']} label="回复内容">
                        <Input.TextArea />
                      </Form.Item>
                      <Form.List name={[field.name, 'keywords']}>
                        {(subFields, { add: subAdd, remove: subRemove }) => (
                          <>
                            <label>关键词:</label>
                            {subFields.map(subField => (
                              <Space key={subField.key} align="baseline">
                                <Form.Item {...subField}>
                                  <Input placeholder="关键词" />
                                </Form.Item>
                                <MinusCircleOutlined onClick={() => subRemove(subField.name)} />
                              </Space>
                            ))}
                            <Form.Item>
                              <Button type="dashed" onClick={() => subAdd()} block icon={<PlusOutlined />}>
                                添加关键词
                              </Button>
                            </Form.Item>
                          </>
                        )}
                      </Form.List>
                    </Card>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add({ keywords: [], reaction: '' })} block icon={<PlusOutlined />}>
                      添加关键词规则
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
            <Title level={5}>正则规则</Title>
            <Form.List name={['keyword_reaction', 'regex_rules']}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(field => (
                     <Card size="small" title={`规则 ${field.name + 1}`} key={field.key} style={{ marginBottom: 16 }} extra={<MinusCircleOutlined onClick={() => remove(field.name)} />}>
                      <Form.Item {...field} name={[field.name, 'reaction']} label="回复内容">
                        <Input.TextArea />
                      </Form.Item>
                      <Form.List name={[field.name, 'regex']}>
                        {(subFields, { add: subAdd, remove: subRemove }) => (
                          <>
                            <label>正则表达式:</label>
                            {subFields.map(subField => (
                              <Space key={subField.key} align="baseline">
                                <Form.Item {...subField}>
                                  <Input placeholder="正则表达式" />
                                </Form.Item>
                                <MinusCircleOutlined onClick={() => subRemove(subField.name)} />
                              </Space>
                            ))}
                            <Form.Item>
                              <Button type="dashed" onClick={() => subAdd()} block icon={<PlusOutlined />}>
                                添加正则表达式
                              </Button>
                            </Form.Item>
                          </>
                        )}
                      </Form.List>
                    </Card>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add({ regex: [], reaction: '' })} block icon={<PlusOutlined />}>
                      添加正则规则
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Panel>
          <Panel header="回复后处理" key="response_post_process">
            <Form.Item name={['response_post_process', 'enable_response_post_process']} label="启用" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Title level={5}>中文错别字生成器</Title>
            <Form.Item name={['chinese_typo', 'enable']} label="启用" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name={['chinese_typo', 'error_rate']} label="单字替换概率">
              <InputNumber min={0} max={1} step={0.01} />
            </Form.Item>
            <Form.Item name={['chinese_typo', 'min_freq']} label="最小字频阈值">
              <InputNumber />
            </Form.Item>
            <Form.Item name={['chinese_typo', 'tone_error_rate']} label="声调错误概率">
              <InputNumber min={0} max={1} step={0.1} />
            </Form.Item>
            <Form.Item name={['chinese_typo', 'word_replace_rate']} label="整词替换概率">
              <InputNumber min={0} max={1} step={0.001} />
            </Form.Item>
            <Title level={5}>回复分割器</Title>
            <Form.Item name={['response_splitter', 'enable']} label="启用" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name={['response_splitter', 'max_length']} label="最大长度">
              <InputNumber />
            </Form.Item>
            <Form.Item name={['response_splitter', 'max_sentence_num']} label="最大句子数">
              <InputNumber />
            </Form.Item>
            <Form.Item name={['response_splitter', 'enable_kaomoji_protection']} label="颜文字保护" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Panel>
          <Panel header="日志" key="log">
            <Form.Item name={['log', 'date_style']} label="日期格式">
              <Input />
            </Form.Item>
            <Form.Item name={['log', 'log_level_style']} label="日志级别样式">
              <Input />
            </Form.Item>
            <Form.Item name={['log', 'color_text']} label="日志文本颜色">
              <Input />
            </Form.Item>
            <Form.Item name={['log', 'log_level']} label="全局日志级别">
              <Input />
            </Form.Item>
            <Form.Item name={['log', 'console_log_level']} label="控制台日志级别">
              <Input />
            </Form.Item>
            <Form.Item name={['log', 'file_log_level']} label="文件日志级别">
              <Input />
            </Form.Item>
            <Form.List name={['log', 'suppress_libraries']}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item {...restField} name={[name]}>
                        <Input placeholder="要屏蔽的库" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      添加屏蔽库
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
            {/* Note: Handling dictionary 'library_log_levels' is complex for a simple form. Skipping for now. */}
          </Panel>
          <Panel header="调试" key="debug">
            <Form.Item name={['debug', 'show_prompt']} label="显示 Prompt" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Panel>
          <Panel header="Maim Message" key="maim_message">
            <Form.List name={['maim_message', 'auth_token']}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item {...restField} name={[name]}>
                        <Input placeholder="认证令牌" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      添加令牌
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
            <Form.Item name={['maim_message', 'use_custom']} label="使用自定义服务器" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name={['maim_message', 'host']} label="主机">
              <Input />
            </Form.Item>
            <Form.Item name={['maim_message', 'port']} label="端口">
              <InputNumber />
            </Form.Item>
            <Form.Item name={['maim_message', 'mode']} label="模式">
              <Input />
            </Form.Item>
            <Form.Item name={['maim_message', 'use_wss']} label="使用 WSS" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name={['maim_message', 'cert_file']} label="证书文件路径">
              <Input />
            </Form.Item>
            <Form.Item name={['maim_message', 'key_file']} label="密钥文件路径">
              <Input />
            </Form.Item>
          </Panel>
          <Panel header="统计" key="telemetry">
            <Form.Item name={['telemetry', 'enable']} label="启用" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Panel>
          <Panel header="实验性功能" key="experimental">
            <Form.Item name={['experimental', 'none']} label="暂无" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Panel>
        </Collapse>

        <Form.Item style={{ marginTop: 24 }}>
          <Button type="primary" htmlType="submit">
            保存 Bot 配置
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default BotConfig;