# MCP代理服务器

MCP代理服务器是一个为 [chatluna-character](https://github.com/ChatLunaLab/chatluna-character) 项目设计的增强工具，提供了MCP（Model Context Protocol）功能的扩展实现。

## 🌟 项目简介

本项目通过代理OpenAI API的方式，为chatluna-character项目添加了强大的工具调用能力。它能够在对话过程中智能地调用外部工具（如天气查询、计算器等），并将结果整合到回复中，从而提供更加智能和实用的对话体验。

## ✨ 核心特性

- **🔧 智能工具调用**：支持在对话中自动调用外部工具
- **🌐 代理转发**：兼容OpenAI API格式，可作为代理服务器使用
- **⚡ 流式响应**：支持流式和非流式两种响应模式
- **🎭 模型别名**：支持为模型设置多个别名，提高兼容性
- **🔒 配置灵活**：通过环境变量进行配置，部署简单

## 🚀 快速开始

### 环境要求

- Node.js >= 22
- npm 或 yarn

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/flymyd/mcp-extend-server.git
   cd mcp-extend-server
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   ```
   
   编辑 `.env` 文件，配置你的API密钥和端点：
   ```bash
   # 服务器端口（默认：12566）
   LLM_EXTEND_SERVE_PORT=12566
   
   # 远程LLM API端点
   LLM_EXTEND_REMOTE_ENDPOINT=http://your-llm-api.com/v1
   
   # 远程LLM API密钥
   LLM_EXTEND_REMOTE_API_KEY=sk-your-api-key-here
   
   # 远程LLM模型ID
   LLM_EXTEND_REMOTE_LLM_ID=your-model-name
   ```

4. **启动服务**
   ```bash
   node server.js
   ```

   服务启动后，将在 `http://localhost:12566` 上运行。

## 📋 API端点

### 1. 获取模型列表
```
GET /v1/models
```

返回当前支持的模型列表，包括主模型和兼容别名。

### 2. 聊天补全
```
POST /v1/chat/completions
```

**请求格式**：
```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "user", "content": "北京今天的天气怎么样？"}
  ],
  "stream": false
}
```

**响应格式**：
- 非流式：返回完整的回复内容
- 流式：逐字返回回复内容，模拟打字效果

## 🔧 内置工具

当前项目内置了以下工具，可根据需要扩展：

### 1. 天气查询工具
- **名称**：`get_current_weather`
- **功能**：获取指定城市的实时天气信息
- **参数**：
  - `city` (string): 城市名称，例如"北京"

### 2. 计算器工具
- **名称**：`calculator`
- **功能**：执行基本数学运算
- **参数**：
  - `expression` (string): 数学表达式，例如"5*8+2"

## 🛠️ 扩展开发

### 添加新工具

1. 在 `src/tool.js` 中添加新的工具函数和schema
2. 工具函数需要返回字符串格式的结果
3. 在 `availableTools` 对象中注册新工具

示例：
```javascript
function myNewTool(param1, param2) {
    // 工具逻辑
    return JSON.stringify({ result: "操作成功" });
}

const availableTools = {
    // ... 现有工具
    my_new_tool: {
        func: myNewTool,
        schema: {
            name: "my_new_tool",
            description: "工具描述",
            parameters: [
                { name: "param1", type: "string", description: "参数1描述" },
                { name: "param2", type: "number", description: "参数2描述" }
            ]
        }
    }
};
```

### 自定义提示词

在 `src/prompts.js` 中可以修改工具使用的提示词模板，调整AI助手的行为。

## 🔄 与chatluna-character集成

1. 在chatluna-character的配置中，将API端点指向本服务：
   ```
   http://localhost:12566/v1
   ```

2. 使用任一支持的模型ID：
   - 主模型ID（在.env中配置）
   - `gpt-3.5-turbo`（兼容别名）
   - `gpt-4`（兼容别名）

3. 在角色配置中启用工具使用功能

## 🔍 调试与日志

服务运行时会输出详细的调试信息，包括：
- 每次对话的完整消息历史
- 工具调用过程
- AI模型的原始输出
- 解析和执行结果

## ⚠️ 安全提示

- **eval函数警告**：当前计算器工具使用了`eval`，在生产环境中应替换为安全的数学表达式解析库
- **API密钥保护**：不要将.env文件提交到版本控制
- **输入验证**：为工具函数添加适当的输入验证和错误处理

## 🤝 贡献指南

欢迎提交Issue和Pull Request来帮助改进项目！

## 📄 许可证

ISC License

## 🆘 支持与帮助

如有问题，请通过以下方式获取帮助：
1. 查看项目Issues
2. 提交新的Issue描述问题
3. 查看运行日志进行调试

---

*本项目专为增强chatluna-character功能而设计，让AI对话更加智能和实用！*