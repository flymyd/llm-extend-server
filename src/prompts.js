const TOOL_PROMPT_TEMPLATE = `
---
**工具使用指南**

你拥有一系列工具，可以用来获取实时信息或执行计算。
仅当用户的请求需要你能力范围之外的信息（例如，实时天气）或需要精确计算时，你才可以使用这些工具。

要调用工具，你必须暂停常规回复，并输出一个具有以下结构的特殊XML块。**在这一轮对话中，除了这个XML块，不要输出任何其他内容。**

<tool_code>
Thought: 你关于为何需要使用工具以及选择哪个工具的思考过程。
Action: 要执行的工具名称。必须是以下之一: **[TOOL_NAMES]**。
Action Input: 一个包含工具所需参数的、格式正确的JSON对象字符串。
</tool_code>

**可用工具:**
[AVAILABLE_TOOLS]

在你提供 \`<tool_code>\` 块后，系统将运行该工具，并在下一轮对话中以“Observation”的形式将结果反馈给你。然后，你应该使用这些新信息，以你的人格角色，并按照标准的 \`<status>\`, \`<think>\`, \`<message>\` 格式来构建最终的回复。

如果用户的消息只是闲聊，不需要外部数据（例如，“你好”、“你是谁”），**请不要使用任何工具**。请直接以你被指定的角色进行回复。
---
`;

export function buildToolUseInstructions(schemas) {
    const toolDescriptions = schemas.map(s => 
        `- **${s.name}**: ${s.description} 参数: \`${JSON.stringify(s.parameters)}\``
    ).join('\n');
    
    const toolNames = schemas.map(s => s.name).join(', ');

    return TOOL_PROMPT_TEMPLATE
        .replace('[AVAILABLE_TOOLS]', toolDescriptions)
        .replace('[TOOL_NAMES]', toolNames);
}