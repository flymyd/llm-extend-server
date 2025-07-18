import OpenAI from 'openai';
import { getTool, getAllToolSchemas } from './tool.js';
import { buildReactPrompt } from './prompts.js';

const MAX_LOOPS = 7;

export class AgentExecutor {
    constructor(apiKey, baseURL) {
        this.openai = new OpenAI({ apiKey, baseURL });
    }

    _parseOutput(text) {
        if (text.includes("Final Answer:")) {
            return { finalAnswer: text.split("Final Answer:")[1].trim() };
        }
        
        const actionMatch = text.match(/Action:\s*(\w+)/);
        const actionInputMatch = text.match(/Action Input:\s*(\{.*\})/s);

        if (actionMatch && actionInputMatch) {
            return {
                action: actionMatch[1].trim(),
                actionInput: actionInputMatch[1].trim(),
            };
        }
        return { error: "无法解析模型输出，格式不符合预期。" };
    }

    async run({ model, messages }) {
        const MAX_LOOPS = 7; 

        console.log("[Agent] Starting new execution with full message history:");
        console.dir(messages, { depth: null });
        const latestMessage = messages[messages.length - 1];
        if (!latestMessage || latestMessage.role !== 'user') {
            console.log("[Agent] Last message is not from user. Aborting.");
            return "我需要一个明确的用户问题才能开始工作。";
        }
        const userQuestion = latestMessage.content;
        const toolSchemas = getAllToolSchemas();
        const chatHistory = messages.slice(0, -1);
        const systemPrompt = buildReactPrompt(toolSchemas, chatHistory);
        
        // 3. 构造 Agent 的初始工作记忆
        const agentHistory = [
            { role: "system", content: systemPrompt },
            // 将最新的用户问题作为 Agent 的第一个任务，并用 "Question:" 标签明确标识
            { role: "user", content: `Question: ${userQuestion}` },
        ];

        for (let i = 0; i < MAX_LOOPS; i++) {
            console.log(`\n[Agent] Loop ${i + 1}`);
            const response = await this.openai.chat.completions.create({
                model,
                messages: agentHistory,
                temperature: 0,
                stop: ["\nObservation:"],
            });

            const outputText = response.choices[0].message.content;
            console.log("[Agent] LLM Output:\n", outputText);
            const parsed = this._parseOutput(outputText);
            if (parsed.finalAnswer) {
                console.log("[Agent] Found Final Answer:", parsed.finalAnswer);
                return parsed.finalAnswer;
            }
            if (parsed.error || !parsed.action) {
                console.log("[Agent] Parsing failed or no action provided. Returning last output.");
                return outputText;
            }
            console.log(`[Agent] Executing Action: ${parsed.action} with Input: ${parsed.actionInput}`);
            let observation;
            const tool = getTool(parsed.action);
            if (tool) {
                try {
   
                    const args = JSON.parse(parsed.actionInput);
                    // 执行工具函数
                    const toolResult = tool.func(...Object.values(args));
                    observation = toolResult; // ✨ 赋值，而不是重新声明
                } catch (e) {
                    observation = `Error parsing Action Input JSON or executing tool: ${e.message}`; // ✨ 赋值
                }
            } else {
                observation = `Error: Tool '${parsed.action}' not found. Please choose from the available tools.`; // ✨ 赋值
            }

            console.log("[Agent] Observation:", observation);
            
            // 7. 更新 Agent 的工作记忆，准备下一次循环
            agentHistory.push({ role: "assistant", content: outputText });
            agentHistory.push({ role: "user", content: `Observation: ${observation}` });
        }

        // 如果达到最大循环次数仍未解决问题，返回一个错误信息
        console.log("[Agent] Reached maximum loops without a final answer.");
        return "对不起，我在解决这个问题的过程中遇到了困难，已经达到了最大思考步数。";
    }
}
