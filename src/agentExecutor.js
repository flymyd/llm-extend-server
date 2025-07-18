import OpenAI from 'openai';
import { getTool, getAllToolSchemas } from './tool.js';
import { buildToolUseInstructions } from './prompts.js';

const MAX_LOOPS = 7;

export class AgentExecutor {
    constructor(apiKey, baseURL) {
        this.openai = new OpenAI({ apiKey, baseURL });
    }

    _parseOutput(text) {
        if (!text.includes("<tool_code>")) {
            return { finalAnswer: text };
        }
        
        const toolCodeMatch = text.match(/<tool_code>([\s\S]*?)<\/tool_code>/);
        if (!toolCodeMatch) {
            return { finalAnswer: text }; // No tool code found, treat as final answer
        }

        const toolCodeBlock = toolCodeMatch[1];

        const actionMatch = toolCodeBlock.match(/Action:\s*(\w+)/);
        const actionInputMatch = toolCodeBlock.match(/Action Input:\s*(\{.*\})/s);

        if (actionMatch && actionInputMatch) {
            return {
                action: actionMatch[1].trim(),
                actionInput: actionInputMatch[1].trim(),
            };
        }
        return { error: "无法解析模型输出，<tool_code> 格式不符合预期。" };
    }

    async run({ model, messages }) {
        console.log("[Agent] Starting new execution with full message history:");
        console.dir(messages, { depth: null });
        
        // 1. 构建工具使用指南
        const toolSchemas = getAllToolSchemas();
        const toolInstructions = buildToolUseInstructions(toolSchemas);

        // 2. 将指南附加到 System Prompt
        const processedMessages = [...messages];
        const systemMessageIndex = processedMessages.findIndex(m => m.role === 'system');
        
        if (systemMessageIndex !== -1) {
            processedMessages[systemMessageIndex].content += `\n\n${toolInstructions}`;
        } else {
            // 如果没有 system message, 就插入一个
            processedMessages.unshift({ role: "system", content: toolInstructions });
        }
        
        // Agent 的工作记忆就是处理过的消息历史
        const agentHistory = processedMessages;

        for (let i = 0; i < MAX_LOOPS; i++) {
            console.log(`\n[Agent] Loop ${i + 1}`);
            console.log("[Agent] Current history being sent to LLM:");
            console.dir(agentHistory, { depth: null });

            const response = await this.openai.chat.completions.create({
                model,
                messages: agentHistory,
                temperature: 0,
                stop: ["\nObservation:", "</tool_code>"],
            });

            const outputText = response.choices[0].message.content;
            console.log("[Agent] LLM Raw Output:\n", outputText);
            
            // 需要在解析前，如果模型输出了停止符，把结尾补全，以便XML解析正确
            const fullOutput = outputText.includes("Action:") ? outputText + "</tool_code>" : outputText;
            console.log("[Agent] Full constructed output for parsing:\n", fullOutput);

            const parsed = this._parseOutput(fullOutput);
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
            agentHistory.push({ role: "assistant", content: fullOutput });
            agentHistory.push({ role: "user", content: `Observation: ${observation}` });
        }

        // 如果达到最大循环次数仍未解决问题，返回一个错误信息
        console.log("[Agent] Reached maximum loops without a final answer.");
        return "对不起，我在解决这个问题的过程中遇到了困难，已经达到了最大思考步数。";
    }
}
