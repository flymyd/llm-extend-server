// server.js

import 'dotenv/config';
import express from 'express';
import { AgentExecutor } from './src/agentExecutor.js';
import { createOpenAIStreamChunk, createFinalStreamChunk, STREAM_DONE_CHUNK } from './src/streamUtils.js';

// --- 配置 ---
const app = express();
app.use(express.json());

const PORT = process.env.LLM_EXTEND_SERVE_PORT || 12566;
const REMOTE_LLM_ENDPOINT = process.env.LLM_EXTEND_REMOTE_ENDPOINT || "http://xxx.com/v1";
const API_KEY = process.env.LLM_EXTEND_REMOTE_API_KEY || "sk-114514";
const REMOTE_LLM_ID = process.env.LLM_EXTEND_REMOTE_LLM_ID || "Qwen3-235B-A22B-AWQ";
console.log(PORT, REMOTE_LLM_ENDPOINT, API_KEY, REMOTE_LLM_ID);

if (!API_KEY) {
    throw new Error("请设置环境变量 LLM_EXTEND_ORIGIN_API_KEY");
}

// 实例化 Agent 执行器
const agentExecutor = new AgentExecutor(API_KEY, REMOTE_LLM_ENDPOINT);

app.get('/v1/models', (req, res) => {
    console.log("[Request] Received request for /v1/models");

    // 我们可以返回一个我们“支持”的模型列表。
    // 关键在于，这些模型ID在后续的 /v1/chat/completions 请求中都会被我们的代理处理。
    // 我们可以将所有请求都指向我们真正的后端模型。
    const modelsList = [
        {
            // 这是你真正的后端模型，建议放在第一个
            id: REMOTE_LLM_ID,
            object: "model",
            created: Math.floor(Date.now() / 1000),
            owned_by: "mcp-proxy-server",
        },
        {
            // 这是一个“别名”或“兼容名”，为了让更多客户端默认就能工作
            // 客户端请求用这个ID，我们的服务器内部会把它当作默认模型处理
            id: "gpt-3.5-turbo",
            object: "model",
            created: Math.floor(Date.now() / 1000),
            owned_by: "mcp-proxy-server",
        },
        {
            // 你可以根据需要添加更多别名
            id: "gpt-4",
            object: "model",
            created: Math.floor(Date.now() / 1000),
            owned_by: "mcp-proxy-server",
        }
    ];

    res.json({
        object: "list",
        data: modelsList,
    });
});

// --- API 端点 ---
app.post('/v1/chat/completions', async (req, res) => {
    const { model, messages, stream } = req.body;

    if (!stream) {
        // 非流式处理
        try {
            const finalAnswer = await agentExecutor.run({ model, messages });
            res.json({
                choices: [{ message: { role: 'assistant', content: finalAnswer } }],
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Agent execution failed." });
        }
        return;
    }
    
    // 流式处理
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
        // Agent 内部是非流式的，它会完整运行直到得到最终答案
        const finalAnswer = await agentExecutor.run({ model, messages });
        
        // 得到最终答案后，我们将其模拟成流式输出返回给客户端
        // 这可以让客户端无缝集成，即使我们内部是批处理
        
        // 简单的分块发送
        const words = finalAnswer.split(/\s+/);
        for (const word of words) {
            const chunk = createOpenAIStreamChunk(model, word + ' ');
            res.write(chunk);
            // 模拟打字效果
            await new Promise(resolve => setTimeout(resolve, 50));
        }

    } catch (error) {
        console.error("[Server Error]", error);
        const errorChunk = createOpenAIStreamChunk(model, `Error: Agent failed to execute. ${error.message}`, 'stop');
        res.write(errorChunk);
    } finally {
        // 发送结束信号
        res.write(STREAM_DONE_CHUNK);
        res.end();
    }
});

app.listen(PORT, () => {
    console.log(`🚀 MCP Proxy Server is running on http://localhost:${PORT}`);
});
