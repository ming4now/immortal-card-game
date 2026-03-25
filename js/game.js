// 修仙卡牌游戏核心逻辑
class ImmortalCardGame {
    constructor() {
        this.player = null;
        this.opponent = null;
        this.currentPlayer = null;
        this.turn = 1;
        this.gameLog = [];
        this.selectedCard = null;
        this.selectedCreature = null;
        this.gameOver = false;
        this.aiConfig = {
            player: { enabled: false, provider: 'minimax', model: 'MiniMax-M2.7', apiKey: '' },
            opponent: { enabled: true, provider: 'minimax', model: 'MiniMax-M2.7', apiKey: '' }
        };
        this.aiBrains = {
            player: null,
            opponent: null
        };
        this.isAIThinking = false;

        this.init();
    }

    init() {
        this.showAIConfig();
        this.setupModelListeners();
    }

    // 显示AI配置界面
    showAIConfig() {
        const modal = document.getElementById('ai-config-modal');
        modal.classList.add('show');

        // 根据游戏模式切换显示
        document.querySelectorAll('input[name="game-mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.onGameModeChange(e.target.value));
        });

        // AI启用切换
        document.getElementById('player-ai-enabled').addEventListener('change', (e) => {
            document.getElementById('player-ai-settings').style.display = e.target.checked ? 'block' : 'none';
        });

        document.getElementById('opponent-ai-enabled').addEventListener('change', (e) => {
            document.getElementById('opponent-ai-settings').style.display = e.target.checked ? 'block' : 'none';
        });
    }

    // 游戏模式切换
    onGameModeChange(mode) {
        const playerAI = document.getElementById('player-ai-enabled');
        const opponentAI = document.getElementById('opponent-ai-enabled');

        switch(mode) {
            case 'pvp':
                playerAI.checked = false;
                opponentAI.checked = false;
                document.getElementById('player-ai-settings').style.display = 'none';
                document.getElementById('opponent-ai-settings').style.display = 'none';
                break;
            case 'pve':
                playerAI.checked = false;
                opponentAI.checked = true;
                document.getElementById('player-ai-settings').style.display = 'none';
                document.getElementById('opponent-ai-settings').style.display = 'block';
                break;
            case 'eve':
                playerAI.checked = true;
                opponentAI.checked = true;
                document.getElementById('player-ai-settings').style.display = 'block';
                document.getElementById('opponent-ai-settings').style.display = 'block';
                break;
        }
    }

    // 设置模型选择监听器
    setupModelListeners() {
        const playerProvider = document.getElementById('player-ai-provider');
        const opponentProvider = document.getElementById('opponent-ai-provider');
        const timeoutSlider = document.getElementById('ai-timeout');

        if (playerProvider) {
            playerProvider.addEventListener('change', (e) => this.updateModelOptions('player', e.target.value));
        }
        if (opponentProvider) {
            opponentProvider.addEventListener('change', (e) => this.updateModelOptions('opponent', e.target.value));
        }

        // 超时滑动条
        if (timeoutSlider) {
            timeoutSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                const display = document.getElementById('timeout-value');
                if (display) display.textContent = value;
            });
        }
    }

    // 更新模型选项
    updateModelOptions(side, provider) {
        const modelSelect = document.getElementById(`${side}-ai-model`);
        if (!modelSelect || !AI_MODELS[provider]) return;

        const models = AI_MODELS[provider].models;
        modelSelect.innerHTML = models.map(m => `<option value="${m}"${m === AI_MODELS[provider].defaultModel ? ' selected' : ''}>${m}</option>`).join('');
    }

    // 保存AI配置
    saveAIConfig() {
        const timeout = parseInt(document.getElementById('ai-timeout').value) * 1000;

        this.aiConfig.player = {
            enabled: document.getElementById('player-ai-enabled').checked,
            provider: document.getElementById('player-ai-provider').value,
            model: document.getElementById('player-ai-model').value,
            apiKey: document.getElementById('player-ai-key').value.trim(),
            timeout: timeout
        };

        this.aiConfig.opponent = {
            enabled: document.getElementById('opponent-ai-enabled').checked,
            provider: document.getElementById('opponent-ai-provider').value,
            model: document.getElementById('opponent-ai-model').value,
            apiKey: document.getElementById('opponent-ai-key').value.trim(),
            timeout: timeout
        };

        // 如果没有API Key，自动切换到mock模式
        if (this.aiConfig.player.enabled && !this.aiConfig.player.apiKey) {
            this.aiConfig.player.provider = 'mock';
            this.aiConfig.player.model = 'mock';
            console.log('[配置] 玩家AI未提供API Key，使用本地模拟');
        }
        if (this.aiConfig.opponent.enabled && !this.aiConfig.opponent.apiKey) {
            this.aiConfig.opponent.provider = 'mock';
            this.aiConfig.opponent.model = 'mock';
            console.log('[配置] 敌方AI未提供API Key，使用本地模拟');
        }

        // 初始化AI大脑
        if (this.aiConfig.player.enabled) {
            this.aiBrains.player = new AIBrain(this.aiConfig.player);
        }
        if (this.aiConfig.opponent.enabled) {
            this.aiBrains.opponent = new AIBrain(this.aiConfig.opponent);
        }

        console.log('[配置] AI配置已保存:', this.aiConfig);

        // 关闭配置界面，显示英雄选择
        document.getElementById('ai-config-modal').classList.remove('show');
        this.showHeroSelect();
    }

    // 显示英雄选择
    showHeroSelect() {
        const modal = document.getElementById('hero-select-modal');
        const heroList = document.getElementById('hero-list');
        heroList.innerHTML = '';

        // 创建两列布局
        const container = document.createElement('div');
        container.className = 'hero-select-container';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = '1fr 1fr';
        container.style.gap = '20px';

        // 我方选择区域
        const playerSection = document.createElement('div');
        playerSection.className = 'hero-section';
        playerSection.innerHTML = '<h3>选择我方修士</h3>';
        const playerList = document.createElement('div');
        playerList.className = 'hero-list-player';

        Object.values(HEROES).forEach(hero => {
            const div = document.createElement('div');
            div.className = 'hero-option hero-option-player';
            div.innerHTML = `
                <div class="avatar">${hero.avatar}</div>
                <div class="name">${hero.name}</div>
                <div class="sect">${hero.sect}</div>
                <div class="skill">${hero.skill.name}: ${hero.skill.description}</div>
            `;
            div.onclick = () => this.selectHeroOption(hero.id, div, false);
            playerList.appendChild(div);
        });
        playerSection.appendChild(playerList);

        // 敌方选择区域
        const opponentSection = document.createElement('div');
        opponentSection.className = 'hero-section';
        opponentSection.innerHTML = '<h3>选择敌方修士</h3>';
        const opponentList = document.createElement('div');
        opponentList.className = 'hero-list-opponent';

        Object.values(HEROES).forEach(hero => {
            const div = document.createElement('div');
            div.className = 'hero-option hero-option-opponent';
            div.innerHTML = `
                <div class="avatar">${hero.avatar}</div>
                <div class="name">${hero.name}</div>
                <div class="sect">${hero.sect}</div>
                <div class="skill">${hero.skill.name}: ${hero.skill.description}</div>
            `;
            div.onclick = () => this.selectHeroOption(hero.id, div, true);
            opponentList.appendChild(div);
        });
        opponentSection.appendChild(opponentList);

        container.appendChild(playerSection);
        container.appendChild(opponentSection);
        heroList.appendChild(container);

        modal.classList.add('show');
    }

    selectedHeroId = null;
    selectedOpponentHeroId = null;

    selectHeroOption(heroId, element, isOpponent = false) {
        if (isOpponent) {
            this.selectedOpponentHeroId = heroId;
            document.querySelectorAll('.hero-option-opponent').forEach(el => el.classList.remove('selected'));
            element.classList.add('selected');
        } else {
            this.selectedHeroId = heroId;
            document.querySelectorAll('.hero-option-player').forEach(el => el.classList.remove('selected'));
            element.classList.add('selected');
        }
    }

    startWithHero() {
        if (!this.selectedHeroId) {
            alert('请先选择一个我方修士');
            return;
        }

        // 如果没有选择敌方英雄，则随机选择
        if (!this.selectedOpponentHeroId) {
            const opponentHeroIds = Object.keys(HEROES).filter(id => id !== this.selectedHeroId);
            this.selectedOpponentHeroId = opponentHeroIds[Math.floor(Math.random() * opponentHeroIds.length)];
        }

        document.getElementById('hero-select-modal').classList.remove('show');

        const heroData = HEROES[this.selectedHeroId];
        const opponentHeroData = HEROES[this.selectedOpponentHeroId];

        // 创建玩家
        this.player = new Player(heroData, true);

        // 创建AI对手
        this.opponent = new Player(opponentHeroData, false);

        // 初始化卡组
        this.player.initDeck();
        this.opponent.initDeck();

        // 初始抽牌
        this.player.draw(3);
        this.opponent.draw(3);

        // 玩家先手，双方初始灵力都是0，第一回合开始时会给先手方1点灵力
        this.currentPlayer = this.player;
        this.player.mana = 0;
        this.player.maxMana = 0;
        this.opponent.mana = 0;
        this.opponent.maxMana = 0;

        this.updateUI();
        this.log('游戏开始！' + this.player.hero.name + ' VS ' + this.opponent.hero.name);

        // 修复：AI对战模式下自动开始AI回合
        const isAIvsAI = this.aiConfig.player.enabled && this.aiConfig.opponent.enabled;
        const isPlayerAI = this.aiConfig.player.enabled;

        // 开始第一回合
        this.player.startTurn();
        this.updateUI();

        if (isAIvsAI || isPlayerAI) {
            this.log('AI正在思考...');
            setTimeout(() => this.aiTurn(), 1000);
        }
    }

    // 结束回合
    endTurn() {
        if (this.gameOver) return;

        // AI对战AI模式下，不检查是否是玩家回合
        const isAIvsAI = this.aiConfig.player.enabled && this.aiConfig.opponent.enabled;

        if (this.currentPlayer !== this.player && !isAIvsAI) {
            this.log('现在不是您的回合');
            return;
        }

        // 记录回合结束状态
        this.logStatus('回合结束');

        // 切换回合
        if (this.currentPlayer === this.player) {
            this.currentPlayer = this.opponent;
        } else {
            this.currentPlayer = this.player;
        }

        this.currentPlayer.startTurn();
        this.updateUI();

        // AI回合
        setTimeout(() => this.aiTurn(), 1000);
    }

    // AI回合 - 支持大模型API
    async aiTurn() {
        if (this.gameOver) return;

        const isPlayerAI = this.currentPlayer === this.player && this.aiConfig.player.enabled;
        const isOpponentAI = this.currentPlayer === this.opponent && this.aiConfig.opponent.enabled;

        if (!isPlayerAI && !isOpponentAI) return;

        const aiBrain = isPlayerAI ? this.aiBrains.player : this.aiBrains.opponent;
        const playerName = this.currentPlayer.hero.name;
        const useAPI = aiBrain && aiBrain.apiKey && aiBrain.provider !== 'mock';

        this.log(`${playerName} AI思考中...`);
        if (useAPI) {
            this.showAIThinking(true, `${playerName} 正在调用${aiBrain.provider}大模型...`);
        }

        try {
            // AI出牌阶段
            let playedCount = 0;
            let consecutiveFails = 0; // 连续失败计数
            while (this.currentPlayer.mana > 0 && this.currentPlayer.hand.length > 0 && playedCount < 10 && consecutiveFails < 3) {
                let decision;

                if (useAPI) {
                    // 调用大模型API
                    decision = await aiBrain.makeDecision(this.getGameState(), 'play_card');
                } else {
                    // 使用本地简化规则
                    decision = this.localPlayDecision();
                }

                if (!decision || decision.cardIndex < 0) break;

                const card = this.currentPlayer.hand[decision.cardIndex];
                if (!card || card.cost > this.currentPlayer.mana) break;

                // 尝试出牌，检查是否成功
                const success = this.playCard(card, this.currentPlayer);
                if (success) {
                    playedCount++;
                    consecutiveFails = 0; // 重置失败计数
                } else {
                    // 出牌失败（如法宝无法装备），增加失败计数
                    consecutiveFails++;
                    // 短暂延迟后继续尝试其他牌
                    await this.delay(200);
                    continue;
                }
                await this.delay(useAPI ? 800 : 500);
            }

            // AI攻击阶段
            await this.delay(useAPI ? 500 : 300);

            // 获取当前可攻击的随从（每次循环重新获取，因为状态会变化）
            let availableAttackers = this.currentPlayer.field.filter(c => !c.hasAttacked && !c.frozen && !c.wasFrozen);

            while (availableAttackers.length > 0) {
                if (this.gameOver) break;

                // 取第一个可攻击的随从
                const attacker = availableAttackers[0];
                let target;

                if (useAPI) {
                    // 大模型选择攻击目标
                    const decision = await aiBrain.makeDecision(this.getGameState(), 'attack');
                    if (decision && decision.type !== 'skip') {
                        const opponent = this.getOpponent(this.currentPlayer);
                        target = decision.target === 'hero' ? opponent : opponent.field[decision.target];
                    }
                } else {
                    // 本地规则：优先清理敌方场上的高威胁随从，再攻击英雄
                    const opponent = this.getOpponent(this.currentPlayer);
                    if (opponent.field.length > 0) {
                        // 找能击杀的随从，或者攻击力最高的
                        const killable = opponent.field.find(c => c.health <= attacker.attack);
                        if (killable) {
                            target = killable;
                        } else {
                            // 否则攻击攻击力最高的
                            target = opponent.field.sort((a, b) => b.attack - a.attack)[0];
                        }
                    } else {
                        // 场上没随从，直接攻击英雄
                        target = opponent;
                    }
                }

                if (target) {
                    await this.combat(attacker, target, this.currentPlayer, this.getOpponent(this.currentPlayer));
                    attacker.hasAttacked = true;
                    await this.delay(useAPI ? 1000 : 600);
                }

                // 重新获取可攻击的随从列表
                availableAttackers = this.currentPlayer.field.filter(c => !c.hasAttacked && !c.frozen && !c.wasFrozen);
            }

        } catch (error) {
            console.error('AI回合出错:', error);
            this.log('AI出错，使用备用策略');
        } finally {
            this.showAIThinking(false);

            // 切换回合 - 修复：使用 setTimeout 避免死循环，并确保正确的回合切换
            if (!this.gameOver) {
                setTimeout(() => {
                    // 切换到另一方
                    if (this.currentPlayer === this.player) {
                        this.currentPlayer = this.opponent;
                    } else {
                        this.currentPlayer = this.player;
                    }

                    // 开始新回合
                    this.currentPlayer.startTurn();
                    this.updateUI();

                    // 检查是否需要进行AI回合
                    const isCurrentPlayerAI = (this.currentPlayer === this.player && this.aiConfig.player.enabled) ||
                                               (this.currentPlayer === this.opponent && this.aiConfig.opponent.enabled);

                    if (isCurrentPlayerAI) {
                        setTimeout(() => this.aiTurn(), 1000);
                    } else {
                        this.log('您的回合');
                    }
                }, 500);
            }
        }
    }

    // 本地出牌决策（备用规则）
    localPlayDecision() {
        const player = this.currentPlayer;
        const opponent = this.getOpponent(player);

        // 获取所有可负担的卡牌
        const affordable = player.hand
            .map((card, idx) => ({ card, idx }))
            .filter(({ card }) => card.cost <= player.mana);

        if (affordable.length === 0) {
            return { type: 'play_card', cardIndex: -1 };
        }

        // 分类卡牌
        const creatures = affordable.filter(({ card }) =>
            card.type === 'cultivator' || card.type === 'pet' || card.type === 'puppet');
        const damageSpells = affordable.filter(({ card }) =>
            card.type === 'spell' && (card.name.includes('火球') || card.name.includes('雷击') || card.name.includes('剑')));
        // 检查法宝是否可装备（需要有未装备法宝的修士）
        const hasEquipableCreature = player.field.some(c => !c.treasure);
        const treasures = affordable.filter(({ card }) =>
            card.type === 'treasure' && hasEquipableCreature);
        // 其他卡牌（排除无法装备的法宝）
        const others = affordable.filter(({ card }) =>
            !creatures.some(c => c.card === card) &&
            !damageSpells.some(c => c.card === card) &&
            !treasures.some(c => c.card === card) &&
            !(card.type === 'treasure' && !hasEquipableCreature)); // 排除无法装备的法宝

        // 策略优先级：
        // 1. 如果敌方场上有随从且我们有伤害法术，优先使用伤害法术清场
        if (opponent.field.length > 0 && damageSpells.length > 0) {
            // 找能击杀敌方随从的法术
            const killSpell = damageSpells.find(({ card }) => {
                const damage = card.name.includes('火球') ? 3 : card.name.includes('雷击') ? 2 : 8;
                return opponent.field.some(c => c.health <= damage);
            });
            if (killSpell) {
                return { type: 'play_card', cardIndex: killSpell.idx };
            }
        }

        // 2. 优先出随从（建立场面）
        if (creatures.length > 0) {
            // 优先出费用最高的随从
            const bestCreature = creatures.sort((a, b) => b.card.cost - a.card.cost)[0];
            return { type: 'play_card', cardIndex: bestCreature.idx };
        }

        // 3. 使用其他卡牌（按费用排序）
        if (others.length > 0) {
            const bestOther = others.sort((a, b) => b.card.cost - a.card.cost)[0];
            return { type: 'play_card', cardIndex: bestOther.idx };
        }

        // 4. 使用法宝（需要可装备的目标）
        if (treasures.length > 0) {
            const bestTreasure = treasures.sort((a, b) => b.card.cost - a.card.cost)[0];
            return { type: 'play_card', cardIndex: bestTreasure.idx };
        }

        // 5. 最后考虑伤害法术
        if (damageSpells.length > 0) {
            const bestSpell = damageSpells.sort((a, b) => b.card.cost - a.card.cost)[0];
            return { type: 'play_card', cardIndex: bestSpell.idx };
        }

        return { type: 'play_card', cardIndex: -1 };
    }

    // 获取游戏状态
    getGameState() {
        return {
            player: this.currentPlayer,
            opponent: this.getOpponent(this.currentPlayer),
            turn: this.turn,
            gameOver: this.gameOver
        };
    }

    // 显示AI思考指示器
    showAIThinking(show, text = '') {
        let indicator = document.getElementById('ai-thinking-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'ai-thinking-indicator';
            indicator.className = 'ai-thinking';
            document.body.appendChild(indicator);
        }
        indicator.style.display = show ? 'block' : 'none';
        if (show && text) {
            indicator.textContent = text;
        }
    }

    // 延迟辅助函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 打出卡牌
    playCard(card, player) {
        if (player.mana < card.cost) {
            this.log('灵力不足');
            return false;
        }

        player.mana -= card.cost;
        player.removeFromHand(card);

        this.log(`${player.hero.name} 打出 ${card.name}`);

        // 根据卡牌类型执行效果
        switch(card.type) {
            case 'cultivator':
            case 'pet':
            case 'puppet':  // 傀儡卡也作为随从召唤
                player.summon(card);
                if (card.battlecry) {
                    const msg = card.onPlay?.(this, player);
                    if (msg) this.log(msg);
                }
                break;

            case 'spell':
            case 'pill':
                // 法术和丹药：即时效果，使用后进入墓地
                if (card.effect) {
                    const msg = card.effect(this, player);
                    if (msg) this.log(msg);
                }
                // 检查法术造成的死亡（雷击术等AOE法术）
                this.checkAllDeaths();
                // 进入墓地
                player.graveyard.push(card);
                break;

            case 'formation':
                // 阵法卡：放到阵法区域，有持续效果
                if (player.formations.length >= 3) {
                    this.log('阵法区域已满，无法布置新阵法');
                    player.graveyard.push(card);
                    return false;
                }
                // 初始化剩余回合数
                card.remainingTurns = card.duration || 3;
                player.formations.push(card);
                this.log(`☯️ ${player.hero.name} 布置 ${card.name}，持续${card.remainingTurns}回合`);
                // 触发阵法激活效果
                if (card.onActivate) {
                    const msg = card.onActivate(this, player, card);
                    if (msg) this.log(msg);
                }
                // 触发即时效果（如果有）
                if (card.effect) {
                    const msg = card.effect(this, player);
                    if (msg) this.log(msg);
                }
                break;

            case 'treasure':
                // 法宝卡：装备到法宝区域
                if (player.treasures.length >= 3) {
                    this.log('法宝区域已满，无法装备新法宝');
                    player.hand.push(card); // 返还手牌
                    return false;
                }

                // 选择装备目标（我方场上的修士，且未装备法宝）
                const validTargets = player.field.filter(c => !c.treasure);
                if (validTargets.length === 0) {
                    this.log('场上没有可装备法宝的修士');
                    player.hand.push(card); // 返还手牌
                    return false;
                }

                // 选择第一个可用的修士装备
                const target = validTargets[0];

                // 装备法宝
                card.equippedTo = target;
                card.durability = card.durability || 3;
                target.treasure = card;
                player.treasures.push(card);

                this.log(`💍 ${player.hero.name} 为 ${target.name} 装备 ${card.name}`);

                // 触发装备效果
                if (card.equipEffect) {
                    card.equipEffect(target);
                }

                // 如果有即时效果
                if (card.effect) {
                    const msg = card.effect(this, player);
                    if (msg) this.log(msg);
                }
                break;
        }

        // 记录打出卡牌后的状态
        this.logStatus('卡牌结算后');

        this.updateUI();
        return true;
    }

    // 战斗逻辑 - 炉石传说风格：双方同时造成伤害
    async combat(attacker, target, attackerPlayer, targetPlayer) {
        // 计算伤害
        let damage = attacker.attack || 0;
        let isCrit = false;

        // 境界压制
        if (attacker.realm && target.realm) {
            const realmDiff = attacker.realm - target.realm;
            if (realmDiff >= 5) {
                damage = Math.floor(damage * 1.5);
                isCrit = true;
                this.log('境界压制！伤害提升');
            } else if (realmDiff <= -5) {
                damage = Math.floor(damage * 0.7);
                this.log('境界差距，伤害降低');
            }
        }

        // 显示攻击特效
        this.showCombatEffect(attacker, target, attackerPlayer, targetPlayer, damage, isCrit);

        // 执行伤害 - 攻击者对目标造成伤害
        if (target && typeof target.takeDamage === 'function') {
            target.takeDamage(damage, attacker);
        } else if (target && target.health !== undefined) {
            target.health -= damage;
        }
        this.log(`${attacker.name || attacker.hero?.name} 对 ${target.name || target.hero?.name} 造成 ${damage} 点伤害`);

        // 反击 - 如果目标有攻击力且不是英雄，则反击攻击者（炉石风格：双方互伤）
        let counterDamage = 0;
        if (target.attack && !attacker.isHero) {
            counterDamage = target.attack;

            // 显示反击特效
            setTimeout(() => {
                const attackerEl = attacker.isHero ? this.getPlayerElement(attackerPlayer) : this.getCreatureElement(attacker, attackerPlayer);
                if (attackerEl) {
                    this.showDamage(attackerEl, counterDamage);
                }
            }, 300);

            // 反击造成伤害
            if (attacker && typeof attacker.takeDamage === 'function') {
                attacker.takeDamage(counterDamage, target);
            } else if (attacker && attacker.health !== undefined) {
                attacker.health -= counterDamage;
            }
            this.log(`${target.name} 反击造成 ${counterDamage} 点伤害`);
        }

        // 攻击特效
        if (attacker.onAttack) {
            const msg = attacker.onAttack(this, attacker, target);
            if (msg) this.log(msg);
        }

        // 法宝攻击特效
        if (attacker.treasure && attacker.treasure.onAttack) {
            const msg = attacker.treasure.onAttack(this, attacker, target, attacker.treasure);
            if (msg) this.log(msg);
            // 检查法宝耐久度
            if (attacker.treasure.durability <= 0) {
                if (attacker.treasure.onUnequip) {
                    attacker.treasure.onUnequip(attacker);
                }
                attackerPlayer.graveyard.push(attacker.treasure);
                attackerPlayer.treasures = attackerPlayer.treasures.filter(t => t !== attacker.treasure);
                this.log(`💍 ${attacker.treasure.name} 灵气耗尽，进入墓地`);
                attacker.treasure = null;
                this.renderEquipment();
            }
        }

        // 延迟后检查死亡（给特效时间）
        await this.delay(500);

        // 检查双方是否死亡
        this.checkDeath(attacker, attackerPlayer);
        this.checkDeath(target, targetPlayer);

        // 记录战斗后的状态
        this.logStatus('战斗结算后');
        this.updateUI();
    }

    // 显示战斗特效
    showCombatEffect(attacker, target, attackerPlayer, targetPlayer, damage, isCrit) {
        // 找到目标元素显示特效
        let targetEl;
        if (target.isHero) {
            targetEl = this.getPlayerElement(target);
        } else {
            const creatureEl = this.getCreatureElement(target, targetPlayer);
            if (creatureEl && damage > 0) {
                this.showDamage(creatureEl, damage, isCrit);
            }
        }

        if (targetEl && damage > 0) {
            this.showDamage(targetEl, damage, isCrit);
        }
    }

    // 检查死亡
    checkDeath(entity, owner) {
        if (entity.health <= 0 && !entity.dead) {
            entity.dead = true;
            this.log(`${entity.name || entity.hero?.name} 陨落`);

            // 死亡特效
            if (entity.deathrattle && entity.onDeath) {
                const msg = entity.onDeath(this, owner, entity);
                if (msg) this.log(msg);
            }

            // 处理法宝（如果装备有法宝）
            if (entity.treasure) {
                // 触发五子同心魔等死亡触发法宝
                if (entity.treasure.onDeath) {
                    const msg = entity.treasure.onDeath(this, owner, entity, entity.treasure);
                    if (msg) this.log(msg);
                }
                // 触发卸下效果
                if (entity.treasure.onUnequip) {
                    entity.treasure.onUnequip(entity);
                }
                // 法宝进入墓地
                owner.graveyard.push(entity.treasure);
                owner.treasures = owner.treasures.filter(t => t !== entity.treasure);
                this.log(`💍 ${entity.treasure.name} 随修士陨落进入墓地`);
                entity.treasure = null;
                this.renderEquipment();
            }

            // 从场上移除并放入墓地（仅随从）
            if (owner.field) {
                owner.field = owner.field.filter(c => c !== entity);
                // 非英雄单位死亡时进入墓地
                if (!entity.isHero) {
                    owner.graveyard.push(entity);
                }
            }

            // 检查游戏结束
            if (entity.isHero) {
                this.endGame(owner === this.player ? this.opponent : this.player);
            }
        }
    }

    // 检查所有玩家的场上随从是否有死亡的（用于法术AOE等）
    checkAllDeaths() {
        // 检查玩家场上
        if (this.player.field) {
            // 需要复制数组，因为 checkDeath 可能会修改 field 数组
            [...this.player.field].forEach(creature => {
                if (creature.health <= 0 && !creature.dead) {
                    this.checkDeath(creature, this.player);
                }
            });
        }
        // 检查敌方场上
        if (this.opponent.field) {
            [...this.opponent.field].forEach(creature => {
                if (creature.health <= 0 && !creature.dead) {
                    this.checkDeath(creature, this.opponent);
                }
            });
        }
    }

    // 选择攻击目标
    selectAttackTarget(attacker) {
        this.selectedCreature = attacker;
        this.log('请选择攻击目标');
    }

    // 点击敌方目标
    async clickTarget(target) {
        if (this.selectedCreature && this.currentPlayer === this.player) {
            if (this.selectedCreature.hasAttacked || this.selectedCreature.frozen || this.selectedCreature.wasFrozen) {
                this.log('该修士本回合已攻击或被冻结');
                return;
            }

            await this.combat(this.selectedCreature, target, this.player, this.opponent);
            this.selectedCreature.hasAttacked = true;
            this.selectedCreature = null;
            this.updateUI();
        }
    }

    // 结束游戏
    endGame(winner) {
        this.gameOver = true;
        this.log(`游戏结束！${winner.hero.name} 获胜！`);
        alert(`${winner.hero.name} 获得胜利！`);
        document.getElementById('end-turn-btn').disabled = true;
    }

    // 获取对手
    getOpponent(player) {
        return player === this.player ? this.opponent : this.player;
    }

    // 通过修士查找所属玩家
    getPlayerByCreature(creature) {
        if (this.player.field.includes(creature)) {
            return this.player;
        }
        if (this.opponent.field.includes(creature)) {
            return this.opponent;
        }
        return null;
    }

    // 选择目标（用于法术）
    selectTarget(type) {
        // 简化版：自动选择或弹窗选择
        // 实际游戏中应该高亮可选目标
        const opponent = this.getOpponent(this.currentPlayer);

        if (type === 'deal_damage') {
            // 优先打敌方英雄，有随从前排时随机
            if (opponent.field.length > 0) {
                return opponent.field[Math.floor(Math.random() * opponent.field.length)];
            }
            return opponent;
        }

        if (type === 'enemy_creature') {
            // 选择敌方场上的一个随从
            if (opponent.field.length > 0) {
                return opponent.field[Math.floor(Math.random() * opponent.field.length)];
            }
            return null;
        }

        return null;
    }

    // 日志
    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        this.gameLog.push(logMessage);

        const logContent = document.getElementById('log-content');
        if (!logContent) return;

        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = logMessage;
        logContent.appendChild(entry);

        // 延迟滚动确保DOM更新
        setTimeout(() => {
            logContent.scrollTop = logContent.scrollHeight;
        }, 10);

        console.log(message);
    }

    // 记录详细状态
    logStatus(phase = '') {
        if (!this.player || !this.opponent) return;

        const p = this.player;
        const o = this.opponent;
        const pField = p.field.map(c => `${c.name}(${c.attack}/${c.health})`).join(' ');
        const oField = o.field.map(c => `${c.name}(${c.attack}/${c.health})`).join(' ');

        // 紧凑格式：三行显示（阶段、我方、敌方）
        let line1 = `[${phase || '回合' + this.turn}]`;
        let line2 = `我方${p.hero.name}(${p.getRealmName()})❤️${p.health}${p.armor ? '+' + p.armor : ''}${p.poisoned ? '☠️' : ''} 💎${p.mana}/${p.maxMana} 🃏${p.hand.length}牌库${p.deck.length}墓${p.graveyard.length}场${p.field.length}${pField ? ':' + pField : ''}`;
        let line3 = `敌方${o.hero.name}(${o.getRealmName()})❤️${o.health}${o.armor ? '+' + o.armor : ''}${o.poisoned ? '☠️' : ''} 💎${o.mana}/${o.maxMana} 🃏${o.hand.length}牌库${o.deck.length}墓${o.graveyard.length}场${o.field.length}${oField ? ':' + oField : ''}`;

        const fullLog = line1 + '\n' + line2 + '\n' + line3;
        this.gameLog.push(fullLog);

        const logContent = document.getElementById('log-content');
        if (!logContent) return;

        const entry = document.createElement('div');
        entry.className = 'log-entry status-log';
        entry.style.color = '#888';
        entry.style.fontSize = '11px';
        entry.style.whiteSpace = 'pre-wrap';
        entry.style.lineHeight = '1.4';
        entry.textContent = fullLog;
        logContent.appendChild(entry);

        setTimeout(() => {
            logContent.scrollTop = logContent.scrollHeight;
        }, 10);
    }

    // 下载日志
    downloadLog() {
        const logText = this.gameLog.join('\n');
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `game-log-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 更新UI
    updateUI() {
        // 更新回合信息
        document.getElementById('turn-number').textContent = this.turn;
        document.getElementById('current-player').textContent = this.currentPlayer === this.player ? '我方回合' : '敌方回合';
        document.getElementById('end-turn-btn').disabled = this.currentPlayer !== this.player || this.gameOver;

        // 更新玩家信息（侧边面板）
        document.getElementById('player-health').textContent = this.player.health;
        document.getElementById('player-armor').textContent = this.player.armor;
        document.getElementById('player-realm-text').textContent = this.player.getRealmName();
        document.getElementById('player-sect').textContent = this.player.hero.sect;
        document.getElementById('current-mana').textContent = this.player.mana;
        document.getElementById('max-mana').textContent = this.player.maxMana;
        document.getElementById('player-hero-name').textContent = this.player.hero.name;
        document.getElementById('player-avatar').textContent = this.player.hero.avatar;
        document.getElementById('hero-skill').textContent = `${this.player.hero.skill.name}: ${this.player.hero.skill.description}`;
        document.getElementById('player-hand-count').textContent = this.player.hand.length;

        // 更新玩家牌组信息
        document.getElementById('deck-count').textContent = this.player.deck.length;
        document.getElementById('graveyard-count').textContent = this.player.graveyard.length;

        // 更新对手信息（侧边面板）
        document.getElementById('opponent-hero-name').textContent = this.opponent.hero.name;
        document.getElementById('opponent-avatar').textContent = this.opponent.hero.avatar;
        document.getElementById('opponent-sect').textContent = this.opponent.hero.sect;
        document.getElementById('opponent-health').textContent = this.opponent.health;
        document.getElementById('opponent-armor').textContent = this.opponent.armor;
        document.getElementById('opponent-realm').textContent = this.opponent.getRealmName();
        document.getElementById('opponent-hand-count').textContent = this.opponent.hand.length;

        // 更新对手牌组信息（上帝视角）
        const opponentDeckCount = document.getElementById('opponent-deck-count');
        const opponentGraveyardCount = document.getElementById('opponent-graveyard-count');
        if (opponentDeckCount) opponentDeckCount.textContent = this.opponent.deck.length;
        if (opponentGraveyardCount) opponentGraveyardCount.textContent = this.opponent.graveyard.length;

        // 渲染手牌
        this.renderHand();

        // 渲染场上
        this.renderField();

        // 渲染阵法区域
        this.renderFormations();

        // 渲染法宝区域
        this.renderEquipment();

        // AI对战模式下显示敌方手牌（上帝视角）
        this.renderOpponentHandGodView();
    }

    // 渲染手牌
    renderHand() {
        const handArea = document.getElementById('player-hand');
        if (!handArea) return;
        handArea.innerHTML = '';

        this.player.hand.forEach(card => {
            const cardDiv = this.createCardElement(card);
            cardDiv.onclick = () => {
                if (this.currentPlayer === this.player && !this.gameOver) {
                    this.playCard(card, this.player);
                }
            };
            handArea.appendChild(cardDiv);
        });
    }

    // 渲染敌方手牌（上帝视角 - AI对战模式）
    renderOpponentHandGodView() {
        const godViewContainer = document.getElementById('opponent-hand-god-view');
        const handCardsContainer = document.getElementById('opponent-hand-cards-god');

        if (!godViewContainer || !handCardsContainer) return;

        // 检查是否为AI对战模式
        const isAIvsAI = this.aiConfig.player.enabled && this.aiConfig.opponent.enabled;
        const isPVE = !this.aiConfig.player.enabled && this.aiConfig.opponent.enabled;

        if (isAIvsAI || isPVE) {
            // 显示上帝视角区域
            godViewContainer.style.display = 'block';
            handCardsContainer.innerHTML = '';

            // 渲染敌方手牌 - 使用与我方手牌一致的样式
            this.opponent.hand.forEach(card => {
                const cardDiv = this.createCardElement(card);
                handCardsContainer.appendChild(cardDiv);
            });
        } else {
            // PVP模式隐藏
            godViewContainer.style.display = 'none';
        }
    }

    // 渲染场上 - 新的格子布局
    renderField() {
        // 清空所有格子
        for (let i = 1; i <= 6; i++) {
            const playerSlot = document.getElementById(`player-monster-${i}`);
            const opponentSlot = document.getElementById(`opponent-monster-${i}`);
            if (playerSlot) playerSlot.innerHTML = '';
            if (opponentSlot) opponentSlot.innerHTML = '';
        }

        // 渲染玩家随从到格子
        this.player.field.forEach((creature, index) => {
            const slotNum = index + 1;
            const slot = document.getElementById(`player-monster-${slotNum}`);
            if (slot) {
                const div = this.createCreatureElement(creature);
                div.onclick = () => {
                    if (this.currentPlayer === this.player && !creature.hasAttacked && !creature.frozen && !creature.wasFrozen) {
                        this.selectAttackTarget(creature);
                    }
                };
                slot.appendChild(div);
            }
        });

        // 渲染敌方随从到格子
        this.opponent.field.forEach((creature, index) => {
            const slotNum = index + 1;
            const slot = document.getElementById(`opponent-monster-${slotNum}`);
            if (slot) {
                const div = this.createCreatureElement(creature);
                div.onclick = () => {
                    if (this.selectedCreature) {
                        this.clickTarget(creature);
                    }
                };
                slot.appendChild(div);
            }
        });
    }

    // 创建卡牌元素
    createCardElement(card) {
        const div = document.createElement('div');
        div.className = `card type-${card.type}`;
        if (this.player.mana >= card.cost) {
            div.classList.add('can-play');
        }

        div.innerHTML = `
            <div class="card-cost">${card.cost}</div>
            <div class="card-name">${card.name}</div>
            <div class="card-type">${this.getTypeName(card.type)}</div>
            <div class="card-image">${card.avatar}</div>
            <div class="card-desc">${card.description}</div>
            ${card.attack !== undefined ? `
                <div class="card-stats">
                    <span class="card-attack">⚔️${card.attack}</span>
                    <span class="card-health">❤️${card.health}</span>
                </div>
            ` : ''}
        `;
        return div;
    }

    // 创建场上修士元素
    createCreatureElement(creature) {
        const div = document.createElement('div');
        div.className = 'creature-card';
        if (!creature.hasAttacked && !creature.frozen && !creature.wasFrozen) {
            div.classList.add('can-attack');
        }
        if (creature.frozen) {
            div.style.opacity = '0.5';
        }
        if (creature.wasFrozen) {
            div.style.opacity = '0.7';
        }

        // 添加悬停放大效果
        div.style.transition = 'transform 0.2s';
        div.onmouseenter = () => {
            div.style.transform = 'scale(1.5)';
            div.style.zIndex = '100';
        };
        div.onmouseleave = () => {
            div.style.transform = 'scale(1)';
            div.style.zIndex = '';
        };

        div.innerHTML = `
            <div class="creature-name">${creature.name}</div>
            <div class="creature-avatar">${creature.avatar}</div>
            <div class="creature-stats">
                <span style="color:#e74c3c">⚔️${creature.attack}</span>
                <span style="color:#27ae60">❤️${creature.health}</span>
            </div>
            ${creature.frozen ? '<div style="color:#3498db;font-size:10px">❄️冻结</div>' : ''}
            ${creature.wasFrozen ? '<div style="color:#3498db;font-size:10px">❄️刚解冻</div>' : ''}
            ${creature.poisoned ? '<div style="color:#2ecc71;font-size:10px">☠️中毒</div>' : ''}
        `;
        return div;
    }

    // 获取类型名称
    getTypeName(type) {
        const names = {
            'cultivator': '修士',
            'spell': '法术',
            'treasure': '法宝',
            'pill': '丹药',
            'formation': '阵法',
            'pet': '灵宠',
            'puppet': '傀儡'
        };
        return names[type] || type;
    }

    // ========== 阵法系统 ==========

    // 渲染阵法区域 - 新的格子布局
    renderFormations() {
        // 清空所有阵法格子
        for (let i = 1; i <= 3; i++) {
            const playerSlot = document.getElementById(`player-formation-${i}`);
            const opponentSlot = document.getElementById(`opponent-formation-${i}`);
            if (playerSlot) playerSlot.innerHTML = '';
            if (opponentSlot) opponentSlot.innerHTML = '';
        }

        // 渲染玩家阵法到格子
        if (this.player.formations) {
            this.player.formations.forEach((formation, index) => {
                const slotNum = index + 1;
                const slot = document.getElementById(`player-formation-${slotNum}`);
                if (slot) {
                    const div = this.createFormationElement(formation);
                    slot.appendChild(div);
                }
            });
        }

        // 渲染敌方阵法到格子
        if (this.opponent.formations) {
            this.opponent.formations.forEach((formation, index) => {
                const slotNum = index + 1;
                const slot = document.getElementById(`opponent-formation-${slotNum}`);
                if (slot) {
                    const div = this.createFormationElement(formation);
                    slot.appendChild(div);
                }
            });
        }
    }

    // 创建阵法元素
    createFormationElement(formation) {
        const div = document.createElement('div');
        const turnsLeft = formation.remainingTurns !== undefined ? formation.remainingTurns : (formation.duration || 3);

        div.style.cssText = 'width:90%;height:90%;background:linear-gradient(135deg,#2980b9,#3498db);border:1px solid #3498db;border-radius:5px;padding:3px;text-align:center;font-size:9px;display:flex;flex-direction:column;justify-content:center;position:relative;cursor:pointer;';
        div.innerHTML = `
            <div style="font-size:8px;font-weight:bold;color:#fff;">${formation.name}</div>
            <div style="font-size:16px;">${formation.avatar}</div>
            <div style="position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.5);border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;">${turnsLeft}</div>
        `;

        // 悬停显示详情
        div.title = `${formation.name}\n持续: ${turnsLeft}/${formation.duration}回合\n${formation.description}`;

        return div;
    }

    // ========== 法宝系统 ==========

    // 渲染法宝区域 - 新的格子布局
    renderEquipment() {
        // 清空所有法宝格子
        for (let i = 1; i <= 3; i++) {
            const playerSlot = document.getElementById(`player-treasure-${i}`);
            const opponentSlot = document.getElementById(`opponent-treasure-${i}`);
            if (playerSlot) playerSlot.innerHTML = '';
            if (opponentSlot) opponentSlot.innerHTML = '';
        }

        // 渲染玩家法宝到格子
        if (this.player.treasures) {
            this.player.treasures.forEach((treasure, index) => {
                const slotNum = index + 1;
                const slot = document.getElementById(`player-treasure-${slotNum}`);
                if (slot) {
                    const div = this.createTreasureElement(treasure);
                    slot.appendChild(div);
                }
            });
        }

        // 渲染敌方法宝到格子
        if (this.opponent.treasures) {
            this.opponent.treasures.forEach((treasure, index) => {
                const slotNum = index + 1;
                const slot = document.getElementById(`opponent-treasure-${slotNum}`);
                if (slot) {
                    const div = this.createTreasureElement(treasure);
                    slot.appendChild(div);
                }
            });
        }
    }

    // 创建法宝元素
    createTreasureElement(treasure) {
        const div = document.createElement('div');
        const durability = treasure.durability || 0;
        const equippedName = treasure.equippedTo ? treasure.equippedTo.name : '未装备';

        div.style.cssText = 'width:90%;height:90%;background:linear-gradient(135deg,#d68910,#f39c12);border:1px solid #f39c12;border-radius:5px;padding:3px;text-align:center;font-size:9px;display:flex;flex-direction:column;justify-content:center;position:relative;cursor:pointer;';
        div.innerHTML = `
            <div style="font-size:8px;font-weight:bold;color:#fff;">${treasure.name}</div>
            <div style="font-size:14px;">${treasure.avatar}</div>
            <div style="font-size:7px;color:rgba(255,255,255,0.8);">${equippedName}</div>
            <div style="position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.5);border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;">${durability}</div>
        `;

        // 悬停显示详情
        div.title = `${treasure.name}\n耐久: ${durability}\n装备给: ${equippedName}\n${treasure.description}`;

        return div;
    }

    // ========== 特效系统 ==========

    // 显示浮动文字特效
    showFloatingText(text, x, y, type = 'positive') {
        const floatEl = document.createElement('div');
        floatEl.className = `floating-text ${type}`;
        floatEl.textContent = text;
        floatEl.style.left = x + 'px';
        floatEl.style.top = y + 'px';
        document.body.appendChild(floatEl);

        setTimeout(() => floatEl.remove(), 1500);
    }

    // 显示伤害数字
    showDamage(targetEl, damage, isCrit = false) {
        const rect = targetEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top;

        const text = isCrit ? `-${damage}★` : `-${damage}`;
        this.showFloatingText(text, x, y, 'damage');

        // 添加闪烁效果
        targetEl.classList.add('damage-flash');
        setTimeout(() => targetEl.classList.remove('damage-flash'), 500);
    }

    // 显示治疗数字
    showHeal(targetEl, amount) {
        const rect = targetEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top;

        this.showFloatingText(`+${amount}`, x, y, 'heal');

        targetEl.classList.add('heal-flash');
        setTimeout(() => targetEl.classList.remove('heal-flash'), 500);
    }

    // 显示境界提升
    showRealmUp(targetEl, realmName) {
        const rect = targetEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top;

        this.showFloatingText(realmName, x, y, 'realm');

        targetEl.classList.add('realm-up');
        setTimeout(() => targetEl.classList.remove('realm-up'), 1000);
    }

    // 显示灵力变化
    showManaChange(targetEl, amount) {
        const rect = targetEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + 30;

        const type = amount >= 0 ? 'mana' : 'negative';
        const text = amount >= 0 ? `+${amount}灵力` : `${amount}灵力`;
        this.showFloatingText(text, x, y, type);

        if (amount > 0) {
            targetEl.classList.add('mana-gain');
            setTimeout(() => targetEl.classList.remove('mana-gain'), 500);
        }
    }

    // 显示护甲变化
    showArmorChange(targetEl, amount) {
        const rect = targetEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + 20;

        this.showFloatingText(`护盾+${amount}`, x, y, 'armor');

        targetEl.classList.add('shield-gain');
        setTimeout(() => targetEl.classList.remove('shield-gain'), 600);
    }

    // 获取玩家对应的DOM元素
    getPlayerElement(player) {
        return document.getElementById(player.isPlayer ? 'player-hero' : 'opponent-hero');
    }

    // 获取场上修士对应的DOM元素
    getCreatureElement(creature, owner) {
        // 通过数据属性查找，而不是遍历DOM
        const isPlayer = owner.isPlayer;
        const field = isPlayer ? this.player.field : this.opponent.field;
        const index = field.indexOf(creature);

        if (index >= 0 && index < 6) {
            const slotId = isPlayer ? `player-monster-${index + 1}` : `opponent-monster-${index + 1}`;
            const slot = document.getElementById(slotId);
            if (slot) {
                return slot.querySelector('.creature-card');
            }
        }
        return null;
    }
}

// 玩家类
class Player {
    constructor(heroData, isPlayer) {
        this.hero = heroData;
        this.isPlayer = isPlayer;
        this.isHero = true;  // 标记为英雄
        this.health = heroData.health;
        this.maxHealth = heroData.health;
        this.armor = 0;
        this.realm = 1;  // 境界等级
        this.maxRealmBonus = 0;
        this.mana = 0;
        this.maxMana = 0;
        this.tempMana = 0;
        this.hand = [];
        this.deck = [];
        this.graveyard = [];
        this.field = [];
        this.hasUsedRevive = false;
        this.formations = [];  // 已激活的阵法（最多3个）
        this.treasures = [];   // 已装备的法宝（最多3个）
        this.equipment = [];   // 保留兼容
        this.poisoned = false;  // 英雄也可能中毒
        this.damageReduction = 0;  // 金刚阵等伤害减免
        this.damageToHeal = false;  // 逆转阴阳阵：伤害转化为治疗
    }

    // 获取英雄特色牌组策略
    getHeroDeckStrategy() {
        const heroId = this.hero.id;

        // 基础牌组构成（平衡型）
        const baseComposition = {
            cultivator: { min: 9, max: 12, target: 11 },
            pet:        { min: 4, max: 7, target: 5 },
            puppet:     { min: 3, max: 5, target: 4 },
            treasure:   { min: 6, max: 9, target: 7 },
            formation:  { min: 3, max: 5, target: 4 },
            spell:      { min: 4, max: 6, target: 5 },
            pill:       { min: 3, max: 5, target: 4 }
        };

        // 英雄特色牌组策略
        const strategies = {
            // 韩立 - 续航/持久战型：偏向防御、回复、高生命
            hanli: {
                composition: {
                    cultivator: { min: 8, max: 11, target: 9 },   // 较少修士
                    pet:        { min: 4, max: 6, target: 5 },     // 灵宠平衡
                    puppet:     { min: 2, max: 4, target: 3 },     // 较少傀儡
                    treasure:   { min: 7, max: 10, target: 8 },    // 较多法宝（防御向）
                    formation:  { min: 4, max: 6, target: 5 },     // 较多阵法（防御/回复）
                    spell:      { min: 3, max: 5, target: 4 },     // 较少法术
                    pill:       { min: 4, max: 6, target: 6 }      // 较多丹药（配合长春功续航）
                },
                // 优先选择高生命、防御向的卡牌
                preferredCards: {
                    cultivator: ['圭灵', '筑基长老', '李化元', '红拂', '内门弟子'],  // 高生命
                    treasure: ['蓝晶盾', '元磁神山', '玄天仙盾', '九曲灵参', '灵眼之泉'],  // 防御/辅助
                    formation: ['金刚阵', '九天玄罡阵', '回春阵', '聚灵阵'],  // 防御/回复
                    pill: ['回灵丹', '筑基丹', '爆灵丹']  // 回复/增益
                }
            },

            // 南宫婉 - 防御/复活型：偏向控制、保命、一次性强力效果
            nangongwan: {
                composition: {
                    cultivator: { min: 8, max: 11, target: 10 },   // 平衡修士
                    pet:        { min: 3, max: 5, target: 4 },     // 较少灵宠
                    puppet:     { min: 2, max: 4, target: 3 },     // 较少傀儡
                    treasure:   { min: 6, max: 9, target: 7 },     // 平衡法宝
                    formation:  { min: 4, max: 6, target: 5 },     // 较多阵法（控制）
                    spell:      { min: 5, max: 7, target: 6 },     // 较多法术（控场）
                    pill:       { min: 3, max: 5, target: 5 }      // 平衡丹药
                },
                preferredCards: {
                    cultivator: ['掩月宗弟子', '掩月宗长老', '内门弟子', '筑基长老'],  // 掩月宗相关
                    treasure: ['玄天仙盾', '蓝晶盾', '阴阳双刀', '虚天鼎'],  // 保命/控制
                    formation: ['迷踪幻阵', '颠倒五行阵', '金刚阵', '九天玄罡阵'],  // 控制/防御
                    spell: ['冰冻术', '护盾术', '雷击术']  // 控制法术
                }
            },

            // 大衍神君 - 召唤/傀儡流：大量傀儡、召唤相关
            dayan: {
                composition: {
                    cultivator: { min: 6, max: 9, target: 7 },     // 较少修士
                    pet:        { min: 3, max: 5, target: 4 },     // 较少灵宠
                    puppet:     { min: 8, max: 12, target: 10 },   // 大量傀儡！
                    treasure:   { min: 5, max: 8, target: 6 },     // 平衡法宝
                    formation:  { min: 3, max: 5, target: 4 },     // 平衡阵法
                    spell:      { min: 4, max: 6, target: 5 },     // 平衡法术
                    pill:       { min: 2, max: 4, target: 4 }      // 较少丹药
                },
                preferredCards: {
                    cultivator: ['大衍宗弟子', '剑修', '外门弟子'],  // 少量修士
                    puppet: ['傀儡士兵', '傀儡兽', '巨力傀儡', '影杀傀儡'],  // 全部傀儡
                    treasure: ['金蚨子母刃', '五子同心魔', '火鼎'],  // 召唤/分化
                    formation: ['大庚剑阵', '剑阵', '小五行剑阵']  // 剑阵配合
                }
            },

            // 银月 - 过牌/节奏型：快速过牌、低费灵活
            yinyue: {
                composition: {
                    cultivator: { min: 9, max: 12, target: 10 },   // 平衡修士
                    pet:        { min: 6, max: 9, target: 7 },     // 较多灵宠！
                    puppet:     { min: 2, max: 4, target: 3 },     // 较少傀儡
                    treasure:   { min: 5, max: 8, target: 6 },     // 平衡法宝
                    formation:  { min: 3, max: 5, target: 4 },     // 平衡阵法
                    spell:      { min: 4, max: 6, target: 5 },     // 平衡法术
                    pill:       { min: 3, max: 5, target: 5 }      // 平衡丹药（配合过牌）
                },
                preferredCards: {
                    cultivator: ['剑修', '雷系修士', '内门弟子', '厉飞雨'],  // 攻击型
                    pet: ['噬金虫', '啼魂兽', '豹麟兽', '六翼霜蚣', '血玉蜘蛛'],  // 全部灵宠
                    treasure: ['风雷翅', '掌天瓶', '金雷竹'],  // 快速/雷系
                    formation: ['风雷阵', '聚灵阵', '大庚剑阵']  // 风雷/资源
                }
            },

            // 紫灵 - 控制/削弱型：降低敌方攻击力、控制场面
            ziling: {
                composition: {
                    cultivator: { min: 8, max: 11, target: 9 },    // 平衡修士
                    pet:        { min: 4, max: 6, target: 5 },     // 平衡灵宠
                    puppet:     { min: 3, max: 5, target: 4 },     // 平衡傀儡
                    treasure:   { min: 6, max: 9, target: 7 },     // 平衡法宝
                    formation:  { min: 5, max: 7, target: 6 },     // 较多阵法（控制）！
                    spell:      { min: 5, max: 7, target: 6 },     // 较多法术（控制）！
                    pill:       { min: 2, max: 4, target: 3 }      // 较少丹药
                },
                preferredCards: {
                    cultivator: ['妙音门弟子', '内门弟子', '墨大夫'],  // 妙音门/控制
                    treasure: ['八灵尺', '虚天鼎', '阴阳双刀', '蓝晶盾'],  // 控制/防御
                    formation: ['迷踪幻阵', '颠倒五行阵', '九天玄罡阵', '金刚阵'],  // 控制/防御
                    spell: ['冰冻术', '雷击术', '火球术', '护盾术']  // 控制/伤害
                }
            },

            // 元瑶 - 复活/鬼道型：墓地利用、复活机制
            yuanyao: {
                composition: {
                    cultivator: { min: 9, max: 12, target: 10 },   // 较多修士（复活对象）
                    pet:        { min: 3, max: 5, target: 4 },     // 较少灵宠
                    puppet:     { min: 3, max: 5, target: 4 },     // 平衡傀儡
                    treasure:   { min: 6, max: 9, target: 7 },     // 平衡法宝
                    formation:  { min: 3, max: 5, target: 4 },     // 平衡阵法
                    spell:      { min: 5, max: 7, target: 6 },     // 较多法术（鬼道）
                    pill:       { min: 3, max: 5, target: 5 }      // 平衡丹药
                },
                preferredCards: {
                    cultivator: ['鬼灵门弟子', '魔道散修', '魔道筑基', '结丹老祖'],  // 鬼道/魔道
                    treasure: ['血魔剑', '五子同心魔', '虚天鼎', '玄天仙盾'],  // 邪道/保命
                    formation: ['逆转阴阳阵', '颠倒五行阵', '大庚剑阵'],  // 特殊/攻击
                    spell: ['血遁术', '雷击术', '火球术']  // 伤害/牺牲
                }
            }
        };

        // 返回对应英雄策略，没有则使用基础策略
        return strategies[heroId] || { composition: baseComposition, preferredCards: {} };
    }

    // 初始化卡组 - 根据英雄特性生成特色牌组
    initDeck() {
        const allCards = getAllCards();
        const targetSize = 40;

        // 根据英雄ID获取对应牌组策略
        const heroDeckStrategy = this.getHeroDeckStrategy();
        const composition = heroDeckStrategy.composition;

        // 费用曲线保持平衡 (40张牌)
        const curve = {
            low:  { cost: [1, 2],         target: 16, range: [14, 18] },
            mid:  { cost: [3, 4],         target: 14, range: [12, 16] },
            high: { cost: [5,6,7,8,9,10], target: 10, range: [8, 12] }
        };

        // 按类型分组
        const cardsByType = {};
        allCards.forEach(card => {
            if (!cardsByType[card.type]) cardsByType[card.type] = [];
            cardsByType[card.type].push(card);
        });

        // 按费用分组
        const cardsByCost = { low: [], mid: [], high: [] };
        allCards.forEach(card => {
            if (curve.low.cost.includes(card.cost)) cardsByCost.low.push(card);
            else if (curve.mid.cost.includes(card.cost)) cardsByCost.mid.push(card);
            else cardsByCost.high.push(card);
        });

        let selectedCards = [];
        let typeCounts = {};
        let curveCounts = { low: 0, mid: 0, high: 0 };

        // 获取英雄优先卡牌
        const preferredCards = heroDeckStrategy.preferredCards || {};

        // 获取英雄宗门
        const heroSect = this.hero.sect;
        const heroId = this.hero.id;

        // 宗门过滤函数：检查卡牌是否适合当前英雄
        const isCardValidForHero = (card) => {
            // 如果没有宗门标记，通用卡牌，所有人可用
            if (!card.sect) return true;
            // 如果卡牌有英雄专属标记，检查是否匹配
            if (card.heroOnly && card.heroOnly !== heroId) return false;
            // 如果卡牌有宗门标记，检查是否匹配英雄宗门
            if (card.sect && card.sect !== heroSect) return false;
            return true;
        };

        // 第一步：优先选择英雄特色卡牌
        Object.keys(preferredCards).forEach(type => {
            const preferredNames = preferredCards[type];
            const available = cardsByType[type] || [];

            // 按优先顺序选择卡牌
            preferredNames.forEach(name => {
                const card = available.find(c => c.name === name);
                if (card && !selectedCards.some(s => s.name === card.name) && isCardValidForHero(card)) {
                    if (selectedCards.length < targetSize) {
                        selectedCards.push({ ...card, id: Math.random().toString(36) });
                        typeCounts[type] = (typeCounts[type] || 0) + 1;

                        // 统计费用
                        const cost = card.cost;
                        if (curve.low.cost.includes(cost)) curveCounts.low++;
                        else if (curve.mid.cost.includes(cost)) curveCounts.mid++;
                        else curveCounts.high++;
                    }
                }
            });
        });

        // 第二步：按类型比例补充剩余卡牌
        // 按优先级排序：修士 > 法宝 > 阵法 > 灵宠 > 法术 > 傀儡 > 丹药
        const typePriority = ['cultivator', 'treasure', 'formation', 'pet', 'spell', 'puppet', 'pill'];

        typePriority.forEach(type => {
            const config = composition[type];
            const target = config.target;
            const available = cardsByType[type] || [];
            // 确保不超过可用的卡牌数量
            const maxAvailable = available.length;
            const targetCount = Math.min(target, maxAvailable, config.max);

            // 确保至少达到最小值（如果有足够卡牌）
            const minCount = Math.min(config.min, maxAvailable);

            let count = typeCounts[type] || 0;

            // 如果还未达到目标数量，继续补充
            for (let i = 0; i < available.length && count < targetCount && selectedCards.length < targetSize; i++) {
                const card = available[i];
                const isDuplicate = selectedCards.some(s => s.name === card.name);
                // 检查宗门匹配
                if (!isDuplicate && isCardValidForHero(card)) {
                    selectedCards.push({ ...card, id: Math.random().toString(36) });
                    typeCounts[type] = (typeCounts[type] || 0) + 1;
                    count++;

                    // 统计费用
                    const cost = card.cost;
                    if (curve.low.cost.includes(cost)) curveCounts.low++;
                    else if (curve.mid.cost.includes(cost)) curveCounts.mid++;
                    else curveCounts.high++;
                }
            }

            // 如果未达到最小值，尝试补充同类型的其他卡牌
            if (count < minCount) {
                for (let i = 0; i < available.length && count < minCount && selectedCards.length < targetSize; i++) {
                    const card = available[i];
                    const isDuplicate = selectedCards.some(s => s.name === card.name);
                    if (!isDuplicate) {
                        selectedCards.push({ ...card, id: Math.random().toString(36) });
                        typeCounts[type] = (typeCounts[type] || 0) + 1;
                        count++;

                        const cost = card.cost;
                        if (curve.low.cost.includes(cost)) curveCounts.low++;
                        else if (curve.mid.cost.includes(cost)) curveCounts.mid++;
                        else curveCounts.high++;
                    }
                }
            }
        });

        // 第三步：调整费用曲线
        const adjustCurve = (targetTier, currentCount, needed) => {
            if (currentCount >= needed[0] && currentCount <= needed[1]) return;

            if (currentCount < needed[0]) {
                // 需要增加该费用卡牌
                const toAdd = needed[0] - currentCount;
                const available = cardsByCost[targetTier].filter(c => !selectedCards.some(s => s.id === c.id));

                for (let i = 0; i < toAdd && i < available.length && selectedCards.length < targetSize; i++) {
                    selectedCards.push({ ...available[i], id: Math.random().toString(36) });
                    curveCounts[targetTier]++;
                    typeCounts[available[i].type] = (typeCounts[available[i].type] || 0) + 1;
                }
            }
        };

        adjustCurve('low', curveCounts.low, curve.low.range);
        adjustCurve('mid', curveCounts.mid, curve.mid.range);
        adjustCurve('high', curveCounts.high, curve.high.range);

        // 第三步：补足到30张
        while (selectedCards.length < targetSize) {
            const remaining = allCards.filter(c => !selectedCards.some(s => s.name === c.name));
            if (remaining.length === 0) break;

            const randomCard = remaining[Math.floor(Math.random() * remaining.length)];
            selectedCards.push({ ...randomCard, id: Math.random().toString(36) });
        }

        // 最终打乱顺序
        this.deck = selectedCards.sort(() => Math.random() - 0.5);

        // 日志输出牌组构成
        console.log(`[牌组生成] ${this.hero.name}的牌组构成:`, typeCounts);
        console.log(`[牌组生成] 费用曲线: 低费(${curveCounts.low}) 中费(${curveCounts.mid}) 高费(${curveCounts.high})`);
    }

    // 抽牌
    draw(count) {
        for (let i = 0; i < count; i++) {
            if (this.deck.length > 0) {
                const card = this.deck.pop();
                if (this.hand.length < 10) {
                    this.hand.push(card);
                } else {
                    this.graveyard.push(card);
                    game.log(`${this.hero.name} 手牌已满，${card.name} 被弃置`);
                }
            }
        }
    }

    // 从手牌移除
    removeFromHand(card) {
        this.hand = this.hand.filter(c => c !== card);
    }

    // 召唤修士
    summon(card) {
        const creature = {
            ...card,
            maxHealth: card.health,
            hasAttacked: false,
            frozen: false,
            poisoned: false,
            // 添加 takeDamage 方法
            takeDamage: function(damage, source) {
                // 法宝伤害减免
                if (this.treasure && this.treasure.onTakeDamage) {
                    const msg = this.treasure.onTakeDamage(game, this, damage, this.treasure);
                    if (msg) game.log(msg);
                    // 如果法宝耐久度归零，移除法宝
                    if (this.treasure.durability <= 0) {
                        if (this.treasure.onUnequip) {
                            this.treasure.onUnequip(this);
                        }
                        game.getPlayerByCreature(this).graveyard.push(this.treasure);
                        game.getPlayerByCreature(this).treasures = game.getPlayerByCreature(this).treasures.filter(t => t !== this.treasure);
                        this.treasure = null;
                        game.renderEquipment();
                    }
                }

                // 金刚阵等伤害减免
                if (this.damageReduction > 0) {
                    damage = Math.max(1, damage - this.damageReduction);
                }

                this.health -= damage;

                // 检查致命伤害（玄天仙盾）
                if (this.health <= 0 && this.treasure && this.treasure.onFatalDamage) {
                    const msg = this.treasure.onFatalDamage(game, this, this.treasure);
                    if (msg) {
                        game.log(msg);
                        if (this.health > 0) return; // 被救活了
                    }
                }

                // 检查死亡
                if (this.health <= 0) {
                    // 注意：法宝处理在 checkDeath 中进行，避免重复
                    // 只处理玄天仙盾等救命法宝
                    if (this.treasure && this.treasure.onFatalDamage) {
                        const msg = this.treasure.onFatalDamage(game, this, this.treasure);
                        if (msg) {
                            game.log(msg);
                            if (this.health > 0) return; // 被救活了
                        }
                    }
                }
            }
        };
        this.field.push(creature);
    }

    // 添加到手牌
    addToHand(card) {
        if (this.hand.length < 10) {
            this.hand.push({...card});
        }
    }

    // 开始回合
    startTurn() {
        game.turn++;

        // ========== 阵法过期处理（回合开始时检查）==========
        if (this.formations && this.formations.length > 0) {
            const expiredFormations = [];
            const remainingFormations = [];

            this.formations.forEach(formation => {
                // 减少剩余回合数
                if (formation.remainingTurns === undefined) {
                    formation.remainingTurns = formation.duration || 3;
                }
                formation.remainingTurns--;

                // 检查是否过期
                if (formation.remainingTurns <= 0) {
                    expiredFormations.push(formation);
                } else {
                    remainingFormations.push(formation);
                }
            });

            // 处理过期阵法
            expiredFormations.forEach(formation => {
                // 触发阵法消失效果
                if (formation.onExpire) {
                    const msg = formation.onExpire(game, this, formation);
                    if (msg) game.log(msg);
                }
                // 阵法进入墓地
                this.graveyard.push(formation);
                game.log(`☯️ ${formation.name} 阵法消散，进入墓地`);
            });

            // 更新阵法列表
            this.formations = remainingFormations;

            // 如果有阵法过期，刷新UI
            if (expiredFormations.length > 0 && game) {
                game.renderFormations();
            }
        }

        // 增加灵力上限（最多10）- 每回合+2点，加快节奏
        if (this.maxMana < 10) {
            this.maxMana = Math.min(this.maxMana + 2, 10);
        }
        this.mana = this.maxMana + this.tempMana;
        this.tempMana = 0;

        // 增加境界
        this.realm++;

        // 显示境界提升特效
        if (game) {
            const heroEl = game.getPlayerElement(this);
            if (heroEl) {
                const realmName = this.getRealmName();
                game.showRealmUp(heroEl, realmName);
            }
            // 显示灵力恢复
            if (this.mana > 0) {
                setTimeout(() => {
                    const heroEl = game.getPlayerElement(this);
                    if (heroEl) {
                        game.showManaChange(heroEl, this.mana);
                    }
                }, 500);
            }
        }

        // 重置攻击状态 和 处理中毒/冰冻
        this.field.forEach(c => {
            c.hasAttacked = false;
            // 冰冻效果：如果上回合被冰冻，这回合解冻
            if (c.frozen) {
                c.wasFrozen = true;  // 标记这回合是冰冻状态
                c.frozen = false;     // 解冻，但本回合还不能攻击
            } else if (c.wasFrozen) {
                c.wasFrozen = false;  // 完全恢复正常
            }
            // 中毒伤害
            if (c.poisoned) {
                c.health--;
                game.log(`${c.name} 中毒-1生命`);
            }
        });

        // 英雄也可能中毒
        if (this.poisoned) {
            this.takeDamage(1);
            game.log(`${this.hero.name} 中毒-1生命`);
        }

        // 抽牌
        this.draw(1);

        // 英雄技能
        if (this.hero.skill.effect) {
            const msg = this.hero.skill.effect(this, game);
            if (msg) game.log(msg);
        }

        // 银月特殊技能：消耗2灵力额外抽牌（AI自动使用）
        if (this.hero.id === 'yinyue' && this.mana >= 2 && this.hand.length < 10) {
            this.mana -= 2;
            this.draw(1);
            game.log(`${this.hero.name} 消耗2灵力，额外抽牌`);
        }

        // 记录回合开始状态
        if (game) game.logStatus('回合开始');

        // 阵法效果（剩余阵法触发回合开始效果）
        this.formations.forEach(f => {
            if (f.onTurnStart) {
                const msg = f.onTurnStart(game, this, f);
                if (msg) game.log(msg);
            }
        });

        // ========== 法宝回合开始效果 ==========
        this.treasures.forEach(t => {
            if (t.onTurnStart && t.equippedTo) {
                const msg = t.onTurnStart(game, this, t.equippedTo, t);
                if (msg) game.log(msg);
                // 检查耐久度
                if (t.durability <= 0) {
                    if (t.onUnequip) {
                        t.onUnequip(t.equippedTo);
                    }
                    t.equippedTo.treasure = null;
                    this.graveyard.push(t);
                    this.treasures = this.treasures.filter(treasure => treasure !== t);
                    game.log(`💍 ${t.name} 灵气耗尽，进入墓地`);
                    game.renderEquipment();
                }
            }
        });
    }

    // 受到伤害
    takeDamage(damage, source = null) {
        // 逆转阴阳阵：伤害转化为治疗
        if (this.damageToHeal) {
            this.heal(damage);
            game?.log(`${this.hero.name} 逆转阴阳，${damage}点伤害转化为治疗`);
            return;
        }

        // 金刚阵：伤害减免
        if (this.damageReduction > 0) {
            const reduced = Math.min(this.damageReduction, damage - 1); // 最少造成1点伤害
            damage -= reduced;
            if (reduced > 0) {
                game?.log(`金刚阵减免${reduced}点伤害`);
            }
        }

        const oldHealth = this.health;

        // 先扣护甲
        if (this.armor > 0) {
            const armorAbsorb = Math.min(this.armor, damage);
            this.armor -= armorAbsorb;
            damage -= armorAbsorb;
        }

        this.health -= damage;

        // 显示伤害特效
        if (game && damage > 0) {
            const heroEl = game.getPlayerElement(this);
            if (heroEl) {
                game.showDamage(heroEl, damage);
            }
        }

        // 检查复活技能
        if (this.health <= 0 && this.hero.skill.effect) {
            const msg = this.hero.skill.effect(this);
            if (msg && this.health > 0) {
                game.log(msg);
                // 显示复活特效
                const heroEl = game.getPlayerElement(this);
                if (heroEl) {
                    game.showHeal(heroEl, this.health);
                }
                return;
            }
        }
    }

    // 恢复生命
    heal(amount) {
        const oldHealth = this.health;
        this.health = Math.min(this.health + amount, this.maxHealth);
        const actualHeal = this.health - oldHealth;

        // 显示治疗特效
        if (game && actualHeal > 0) {
            const heroEl = game.getPlayerElement(this);
            if (heroEl) {
                game.showHeal(heroEl, actualHeal);
            }
        }
    }

    // 获得护甲（添加上限）
    gainArmor(amount) {
        const MAX_ARMOR = 10; // 护盾上限
        const actualGain = Math.min(amount, MAX_ARMOR - this.armor);
        if (actualGain <= 0) {
            game?.log(`${this.hero.name} 护盾已达上限(${MAX_ARMOR})`);
            return;
        }
        this.armor += actualGain;

        // 显示护盾特效
        if (game && actualGain > 0) {
            const heroEl = game.getPlayerElement(this);
            if (heroEl) {
                game.showArmorChange(heroEl, actualGain);
            }
        }
    }

    // 获得灵力
    gainMana(amount) {
        this.mana += amount;

        // 显示灵力特效
        if (game && amount > 0) {
            const heroEl = game.getPlayerElement(this);
            if (heroEl) {
                game.showManaChange(heroEl, amount);
            }
        }
    }

    // 获取境界名称
    getRealmName() {
        let realmLevel = this.realm;
        for (const realm of REALMS) {
            if (realmLevel <= realm.levels) {
                return `${realm.name}${realmLevel}层`;
            }
            realmLevel -= realm.levels;
        }
        return `真仙${realmLevel}层`;
    }
}

// 全局游戏实例
let game;

// 启动游戏
window.onload = () => {
    game = new ImmortalCardGame();
};
