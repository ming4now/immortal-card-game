// AI模型配置
const AI_MODELS = {
    minimax: {
        name: 'MiniMax',
        models: ['MiniMax-M2.5', 'MiniMax-M2.7'],
        defaultModel: 'MiniMax-M2.7',
        baseUrl: 'https://api.minimax.chat/v1'
    },
    kimi: {
        name: 'Kimi',
        models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
        defaultModel: 'moonshot-v1-128k',
        baseUrl: 'https://api.moonshot.cn/v1'
    },
    gpt: {
        name: 'GPT',
        models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
        defaultModel: 'gpt-4',
        baseUrl: 'https://api.openai.com/v1'
    },
    claude: {
        name: 'Claude',
        models: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus'],
        defaultModel: 'claude-3-sonnet',
        baseUrl: 'https://api.anthropic.com/v1'
    },
    mock: {
        name: '本地模拟',
        models: ['mock'],
        defaultModel: 'mock',
        baseUrl: null
    }
};

// AI适配器基类
class AIBrain {
    constructor(config = {}) {
        this.provider = config.provider || 'minimax';
        this.model = config.model || AI_MODELS[this.provider].defaultModel;
        this.apiKey = config.apiKey || '';
        this.isEnabled = config.enabled !== false;
        this.timeout = config.timeout || 5000; // 默认5秒超时
        this.stats = { calls: 0, errors: 0, totalLatency: 0, timeouts: 0 };
    }

    // 生成AI决策（带超时）
    async makeDecision(gameState, decisionType) {
        if (!this.isEnabled || !this.apiKey || this.provider === 'mock') {
            console.log('[AI] 使用本地模拟策略');
            return this.fallbackDecision(gameState, decisionType);
        }

        const prompt = this.buildPrompt(gameState, decisionType);
        
        try {
            const startTime = Date.now();
            console.log(`[AI] 调用 ${this.provider} API 进行 ${decisionType} 决策...`);
            
            // 使用 Promise.race 实现超时
            const response = await Promise.race([
                this.callAPI(prompt),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('TIMEOUT')), this.timeout)
                )
            ]);
            
            const latency = Date.now() - startTime;
            this.stats.calls++;
            this.stats.totalLatency += latency;
            
            console.log(`[AI] API响应成功，耗时 ${latency}ms`);
            return this.parseResponse(response, decisionType);
            
        } catch (error) {
            if (error.message === 'TIMEOUT') {
                console.warn(`[AI] API调用超时(${this.timeout}ms)，使用备用策略`);
                this.stats.timeouts++;
            } else {
                console.error('[AI] API调用失败:', error);
                this.stats.errors++;
            }
            return this.fallbackDecision(gameState, decisionType);
        }
    }

    // 调用API
    async callAPI(prompt) {
        const config = AI_MODELS[this.provider];
        
        // Mock模式
        if (this.provider === 'mock') {
            await new Promise(r => setTimeout(r, 500));
            return this.mockResponse(prompt);
        }

        const response = await fetch(`${config.baseUrl}/text/chatcompletion_v2`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`API错误: ${response.status}`);
        }

        const data = await response.json();
        
        // 解析响应
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
        }
        throw new Error('无效的API响应');
    }

    // 构建提示词
    buildPrompt(gameState, decisionType) {
        const player = gameState.player;
        const opponent = gameState.opponent;
        
        let prompt = `[凡人修仙传卡牌游戏 - AI决策]

你是${player.hero.name}，${player.hero.sect}修士，当前境界：${player.getRealmName()}。

【当前战况】
我方状态：
- 寿元：${player.health}/${player.maxHealth} ${player.armor > 0 ? `(+${player.armor}护盾)` : ''}
- 灵石：${player.mana}/${player.maxMana}
- 手牌：${player.hand.length}张
- 场上修士：${player.field.length}人${player.field.length > 0 ? ' - ' + player.field.map(c => `${c.name}(${c.attack}/${c.health})`).join(', ') : ''}

敌方状态：
- 寿元：${opponent.health}/${opponent.maxHealth} ${opponent.armor > 0 ? `(+${opponent.armor}护盾)` : ''}
- 手牌：${opponent.hand.length}张
- 场上修士：${opponent.field.length}人${opponent.field.length > 0 ? ' - ' + opponent.field.map(c => `${c.name}(${c.attack}/${c.health})`).join(', ') : ''}

【我的手牌】
${player.hand.map((card, idx) => `${idx}: ${card.name} [${card.type}] 消耗${card.cost}灵石 - ${card.description}${card.attack !== undefined ? ` (${card.attack}/${card.health})` : ''}`).join('\n')}

`;

        switch(decisionType) {
            case 'play_card':
                prompt += `【决策任务】
选择一张手牌打出。考虑以下因素：
1. 当前灵石是否足够
2. 场上局势是否需要进攻/防守
3. 敌方场上威胁度
4. 卡牌之间的配合

请回复一个数字（0-${player.hand.length-1}）表示要打出的卡牌序号，如果不需要出牌则回复"-1"。只回复数字，不要有其他内容。`;
                break;
                
            case 'attack':
                const attackers = player.field.filter(c => !c.hasAttacked && !c.frozen);
                if (attackers.length === 0) return null;
                
                prompt += `【场上可攻击修士】
${attackers.map((c, idx) => `${idx}: ${c.name}(${c.attack}/${c.health})`).join('\n')}

【决策任务】
选择攻击目标。敌方场上：
${opponent.field.length > 0 ? opponent.field.map((c, idx) => `${idx}: ${c.name}(${c.attack}/${c.health})`).join('\n') : '无（可直接攻击敌方英雄）'}

请回复格式："攻击者序号->目标序号"
例如："0->1"表示用第0个修士攻击敌方第1个修士
如果要攻击敌方英雄，目标序号为"hero"
如果不需要攻击，回复"skip"
只回复指令，不要有其他内容。`;
                break;
                
            case 'end_turn':
                prompt += `【决策任务】
判断是否应该结束回合。考虑：
1. 是否还有可用灵石
2. 是否还有可打出的卡牌
3. 场上修士是否都已攻击

请回复"end"结束回合，或"continue"继续操作。只回复单词。`;
                break;
        }

        return prompt;
    }

    // 解析AI响应
    parseResponse(response, decisionType) {
        response = response.trim().toLowerCase();
        
        switch(decisionType) {
            case 'play_card':
                const cardIdx = parseInt(response);
                if (!isNaN(cardIdx) && cardIdx >= -1) {
                    return { type: 'play_card', cardIndex: cardIdx };
                }
                return null;
                
            case 'attack':
                if (response === 'skip') return { type: 'skip' };
                const match = response.match(/(\d+)->(hero|\d+)/);
                if (match) {
                    return {
                        type: 'attack',
                        attackerIndex: parseInt(match[1]),
                        target: match[2] === 'hero' ? 'hero' : parseInt(match[2])
                    };
                }
                return null;
                
            case 'end_turn':
                return { type: response === 'end' ? 'end_turn' : 'continue' };
                
            default:
                return null;
        }
    }

    // 备用决策（当AI失败或禁用时）
    fallbackDecision(gameState, decisionType) {
        const player = gameState.player;
        
        switch(decisionType) {
            case 'play_card':
                // 优先打出能负担的卡牌
                const affordable = player.hand
                    .map((card, idx) => ({ card, idx }))
                    .filter(({ card }) => card.cost <= player.mana)
                    .sort((a, b) => b.card.cost - a.card.cost);
                
                if (affordable.length > 0) {
                    return { type: 'play_card', cardIndex: affordable[0].idx };
                }
                return { type: 'play_card', cardIndex: -1 };
                
            case 'attack':
                const attackers = player.field.filter(c => !c.hasAttacked && !c.frozen);
                if (attackers.length === 0) return { type: 'skip' };
                
                // 优先攻击敌方场上威胁最大的
                if (gameState.opponent.field.length > 0) {
                    // 找攻击力最高的敌方修士
                    const strongestEnemy = gameState.opponent.field
                        .map((c, idx) => ({ c, idx }))
                        .sort((a, b) => b.c.attack - a.c.attack)[0];
                    return {
                        type: 'attack',
                        attackerIndex: 0,
                        target: strongestEnemy.idx
                    };
                }
                // 直接攻击英雄
                return { type: 'attack', attackerIndex: 0, target: 'hero' };
                
            case 'end_turn':
                // 没有可出的牌就结束
                const canPlay = player.hand.some(c => c.cost <= player.mana);
                const canAttack = player.field.some(c => !c.hasAttacked && !c.frozen);
                return { type: (!canPlay && !canAttack) ? 'end_turn' : 'continue' };
                
            default:
                return null;
        }
    }

    // Mock响应
    mockResponse(prompt) {
        // 简单的关键词匹配
        if (prompt.includes('play_card')) {
            return '0';
        } else if (prompt.includes('attack')) {
            return '0->hero';
        } else if (prompt.includes('end_turn')) {
            return 'end';
        }
        return '0';
    }

    // 获取统计
    getStats() {
        return {
            ...this.stats,
            avgLatency: this.stats.calls > 0 ? (this.stats.totalLatency / this.stats.calls).toFixed(0) : 0
        };
    }
}
