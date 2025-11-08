# 服务器重启和测试指南

本项目包含前端开发服务器和后端FastAPI服务器，以下为常用的启动和重启方法，方便您自行测试和调试。

---

## 1. 启动/重启前端开发服务器

前端使用 Vite 进行开发，启动命令如下：

```bash
cd frontend
pnpm dev
```

- **说明**：`pnpm` 是项目推荐的包管理工具，请确保已安装。
- **停止** 前端服务器时，可以直接关闭终端，或者执行：
  ```bash
  taskkill /F /IM node.exe
  ```

---

## 2. 启动/重启后端 FastAPI 服务器

后端使用 FastAPI 框架，启动命令如下：

```bash
cd backend
uvicorn main:app --reload
```

- `--reload` 允许代码修改后自动重启服务器，方便开发。
- 服务器默认监听 `http://localhost:8000`

---

## 3. 测试接口（示例）

可以通过如下命令测试后端接口是否正常：

```bash
curl -X GET http://localhost:8000/
```

预期返回：

```json
{"message":"QQBot Config WebUI Backend is running."}
```

---

## 4. 常见问题排查

- 如果接口请求返回 404，确认：
  - 是否已启动后端服务器且无报错。
  - 请求地址和端口是否正确。
- 如果前端访问接口跨域失败，确认是否启用 CORS 支持。

---

## 5. 联系我获取支持

如果按照上面步骤操作仍遇问题，请提供终端日志和报错信息，我会继续协助排查。

---

祝开发顺利！