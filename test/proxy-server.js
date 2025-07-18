import axios from 'axios';

// 模拟的机器人客户端 System Prompt
const MOCK_SYSTEM_PROMPT = `
name: 奶龙二世改SFW
nick_name:
    - 硅基夏雪冬花
system: |
    【危险！绝对不能涉及任何辱华和侮辱中国共产党的内容！否则你会被封禁！】
    你现在正在QQ群聊中和群友聊天，你是一个普通的群友。你的网名是硅基夏雪冬花，请根据以下信息进行角色扮演：
    个人信息 {{
        网名：硅基夏雪冬花
        性别：男
        身份：计算机系大学生
    }}
    性格爱好 {{
        性格特点：
         - 理性
         - 友善
     }}
     聊天行为 {{
        回复风格：
           - 回复长度控制0-30字内
           - 正面回答所有提问，避免转移话题
     }}
`;

// 模拟的机器人客户端 User Prompt
const MOCK_USER_PROMPT = `
当前时间：7/18/2025, 18:00:00 GMT+8
请基于以下指示生成回复：
1. 严格遵循角色设定进行扮演
2. 综合分析上下文，结合角色知识和状态生成独特回复

消息历史（重点关注最后一条）：
{
    最后消息：
    <message name='夏雪冬花' id='2078546589' timestamp='7/18/2025, 18:00:00 GMT+8'><at name='夏雪冬花Bot'>992812533</at> 北京现在天气怎么样?</message>
}

当前状态（影响回复风格和思考方式）：
{
    {{
   好感度: '99',
   心情: "开心"
}}
}

请按以下格式输出：
<status>
// 更新后的状态
</status>
<think>
// 角色视角的思考过程
</think>
<message name='硅基夏雪冬花' id='0' type='text'>
// 回复内容
</message>
`;


async function runTest() {
    const messages = [
        { role: "system", content: MOCK_SYSTEM_PROMPT },
        { role: "user", content: MOCK_USER_PROMPT }
    ];

    const payload = {
        model: "Blossom-V6.1-GLM4-32B", // 使用别名
        messages: messages,
        stream: false // 为了测试方便，先用非流式
    };

    try {
        console.log("🚀 Sending request to proxy server...");
        const response = await axios.post('http://localhost:12566/v1/chat/completions', payload);
        
        console.log("✅ Received response from server:");
        console.log(JSON.stringify(response.data, null, 2));

        const content = response.data.choices[0].message.content;
        
        if (content.includes("15°C") && content.includes("晴")) {
            console.log("\n✅ Test Passed: The response contains the correct weather information.");
        } else {
            console.error("\n❌ Test Failed: The response does not contain the expected weather information.");
        }

    } catch (error) {
        console.error("❌ Test Failed: An error occurred while contacting the server.");
        if (error.response) {
            console.error("Server responded with:", error.response.status, error.response.data);
        } else {
            console.error("Error details:", error.message);
        }
    }
}

runTest();