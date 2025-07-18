export function createOpenAIStreamChunk(model, content, finishReason = null) {
    const chunk = {
        id: `chatcmpl-${Date.now()}`,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model: model,
        choices: [
            {
                index: 0,
                delta: { content: content || "" }, // 确保 content 存在
                finish_reason: finishReason,
            },
        ],
    };
    return `data: ${JSON.stringify(chunk)}\n\n`;
}

export function createFinalStreamChunk(model) {
    return createOpenAIStreamChunk(model, null, 'stop');
}

export const STREAM_DONE_CHUNK = "data: [DONE]\n\n";
