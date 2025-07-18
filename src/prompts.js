const REACT_TEMPLATE = `你是一个强大的AI助手，你的任务是回答用户的问题。
你被赋予了以下工具来帮助你解决问题：

[AVAILABLE_TOOLS]

这是到目前为止的对话历史:
<chat_history>
[CHAT_HISTORY]
</chat_history>

基于以上对话历史，请专注于解决最新的用户问题。
请严格遵循以下的思考与行动循环格式来解决问题。一步一步来，直到你找到最终答案。

Thought: 分析用户的最新问题，结合对话历史，确定是否需要使用工具，以及使用哪个工具。
Action: 你决定使用的工具名称，必须是 [TOOL_NAMES] 中的一个。
Action Input: 执行该工具所需的输入参数，必须是一个严格的JSON字符串。

... (后续部分保持不变) ...
`;

export function buildReactPrompt(schemas, chatHistory) {
    const toolDescriptions = schemas.map(s => 
        `- ${s.name}(${s.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}): ${s.description}`
    ).join('\n');
    
    const toolNames = schemas.map(s => s.name).join(', ');
    const historyString = chatHistory
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

    return REACT_TEMPLATE
        .replace('[AVAILABLE_TOOLS]', toolDescriptions)
        .replace('[TOOL_NAMES]', toolNames)
        .replace('[CHAT_HISTORY]', historyString);
}