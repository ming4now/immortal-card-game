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
        
        Object.values(HEROES).forEach(hero => {
            const div = document.createElement('div');
            div.className = 'hero-option';
            div.innerHTML = `
                <div class="avatar">${hero.avatar}</div>
                <div class="name">${hero.name}</div>
                <div class="sect">${hero.sect}</div>
                <div class="skill">${hero.skill.name}: ${hero.skill.description}</div>
            `;
            div.onclick = () => this.selectHeroOption(hero.id, div);
            heroList.appendChild(div);
        });
        
        modal.classList.add('show');
    }
    
    selectedHeroId = null;
    
    selectHeroOption(heroId, element) {
        this.selectedHeroId = heroId;
        document.querySelectorAll('.hero-option').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
    }
    
    startWithHero() {
        if (!this.selectedHeroId) {
            alert('请先选择一个修士');
            return;
        }
        
        document.getElementById('hero-select-modal').classList.remove('show');
        
        const heroData = HEROES[this.selectedHeroId];
        
        // 创建玩家
        this.player = new Player(heroData, true);
        
        // 创建AI对手（随机英雄）
        const opponentHeroIds = Object.keys(HEROES).filter(id => id !== this.selectedHeroId);
        const randomOpponentId = opponentHeroIds[Math.floor(Math.random() * opponentHeroIds.length)];
        this.opponent = new Player(HEROES[randomOpponentId], false);
        
        // 初始化卡组
        this.player.initDeck();
        this.opponent.initDeck();
        
        // 初始抽牌
        this.player.draw(3);
        this.opponent.draw(3);
        
        // 玩家先手
        this.currentPlayer = this.player;
        this.player.mana = 1;
        this.player.maxMana = 1;
        
        this.updateUI();
        this.log('游戏开始！' + this.player.hero.name + ' VS ' + this.opponent.hero.name);
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
            while (this.currentPlayer.mana > 0 && this.currentPlayer.hand.length > 0 && playedCount < 10) {
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
                
                this.playCard(card, this.currentPlayer);
                playedCount++;
                await this.delay(useAPI ? 800 : 500);
            }
            
            // AI攻击阶段
            await this.delay(useAPI ? 500 : 300);
            const attackers = this.currentPlayer.field.filter(c => !c.hasAttacked && !c.frozen);
            
            for (const attacker of attackers) {
                if (this.gameOver) break;
                
                let target;
                if (useAPI) {
                    // 大模型选择攻击目标
                    const decision = await aiBrain.makeDecision(this.getGameState(), 'attack');
                    if (decision && decision.type !== 'skip') {
                        const opponent = this.getOpponent(this.currentPlayer);
                        target = decision.target === 'hero' ? opponent : opponent.field[decision.target];
                    }
                } else {
                    // 本地规则：优先攻击高攻击敌人
                    const opponent = this.getOpponent(this.currentPlayer);
                    if (opponent.field.length > 0) {
                        target = opponent.field.sort((a, b) => b.attack - a.attack)[0];
                    } else {
                        target = opponent;
                    }
                }
                
                if (target) {
                    this.combat(attacker, target, this.currentPlayer, this.getOpponent(this.currentPlayer));
                    attacker.hasAttacked = true;
                    await this.delay(useAPI ? 1000 : 600);
                }
            }
            
        } catch (error) {
            console.error('AI回合出错:', error);
            this.log('AI出错，使用备用策略');
        } finally {
            this.showAIThinking(false);
            
            // 切换回合
            if (!this.gameOver) {
                if (this.currentPlayer === this.player) {
                    this.currentPlayer = this.opponent;
                    this.opponent.startTurn();
                    this.updateUI();
                    if (this.aiConfig.opponent.enabled) {
                        setTimeout(() => this.aiTurn(), 1000);
                    }
                } else {
                    this.currentPlayer = this.player;
                    this.player.startTurn();
                    this.updateUI();
                    this.log('您的回合');
                    if (this.aiConfig.player.enabled) {
                        setTimeout(() => this.aiTurn(), 1000);
                    }
                }
            }
        }
    }
    
    // 本地出牌决策（备用规则）
    localPlayDecision() {
        const player = this.currentPlayer;
        // 优先打出费用最高的可负担卡牌
        const affordable = player.hand
            .map((card, idx) => ({ card, idx }))
            .filter(({ card }) => card.cost <= player.mana)
            .sort((a, b) => b.card.cost - a.card.cost);
        
        if (affordable.length > 0) {
            return { type: 'play_card', cardIndex: affordable[0].idx };
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
            this.log('灵石不足');
            return false;
        }
        
        player.mana -= card.cost;
        player.removeFromHand(card);
        
        this.log(`${player.hero.name} 打出 ${card.name}`);
        
        // 根据卡牌类型执行效果
        switch(card.type) {
            case 'cultivator':
            case 'pet':
                player.summon(card);
                if (card.battlecry) {
                    const msg = card.onPlay?.(this, player);
                    if (msg) this.log(msg);
                }
                break;
                
            case 'spell':
            case 'pill':
            case 'formation':
            case 'treasure':
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
    
    // 战斗逻辑
    combat(attacker, target, attackerPlayer, targetPlayer) {
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

        // 找到目标元素显示特效
        let targetEl;
        if (target.isHero) {
            targetEl = this.getPlayerElement(target);
        } else {
            // 延迟一下确保DOM已更新
            setTimeout(() => {
                const creatureEl = this.getCreatureElement(target, targetPlayer);
                if (creatureEl && damage > 0) {
                    this.showDamage(creatureEl, damage, isCrit);
                }
            }, 100);
        }

        if (targetEl && damage > 0) {
            this.showDamage(targetEl, damage, isCrit);
        }

        // 执行伤害（安全检查）
        if (target && typeof target.takeDamage === 'function') {
            target.takeDamage(damage, attacker);
        } else {
            console.error('目标无法受伤:', target);
            // 如果目标没有takeDamage方法，直接扣血
            if (target && target.health !== undefined) {
                target.health -= damage;
            }
        }
        this.log(`${attacker.name || attacker.hero?.name} 对 ${target.name || target.hero?.name} 造成 ${damage} 点伤害`);

        // 反击（如果是随从攻击随从）
        if (target.attack && !attacker.isHero) {
            const counterDamage = target.attack;

            // 显示反击特效
            setTimeout(() => {
                const attackerEl = attacker.isHero ? this.getPlayerElement(attackerPlayer) : this.getCreatureElement(attacker, attackerPlayer);
                if (attackerEl) {
                    this.showDamage(attackerEl, counterDamage);
                }
            }, 300);

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

        // 检查死亡
        setTimeout(() => {
            this.checkDeath(attacker, attackerPlayer);
            this.checkDeath(target, targetPlayer);
            
            // 记录战斗后的状态
            this.logStatus('战斗结算后');
            
            this.updateUI();
        }, 500);
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
            
            // 从场上移除
            if (owner.field) {
                owner.field = owner.field.filter(c => c !== entity);
            }
            
            // 检查游戏结束
            if (entity.isHero) {
                this.endGame(owner === this.player ? this.opponent : this.player);
            }
        }
    }
    
    // 选择攻击目标
    selectAttackTarget(attacker) {
        this.selectedCreature = attacker;
        this.log('请选择攻击目标');
    }
    
    // 点击敌方目标
    clickTarget(target) {
        if (this.selectedCreature && this.currentPlayer === this.player) {
            if (this.selectedCreature.hasAttacked || this.selectedCreature.frozen) {
                this.log('该修士本回合已攻击或被冻结');
                return;
            }
            
            this.combat(this.selectedCreature, target, this.player, this.opponent);
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
    
    // 选择目标（用于法术）
    selectTarget(type) {
        // 简化版：自动选择或弹窗选择
        // 实际游戏中应该高亮可选目标
        if (type === 'deal_damage') {
            // 优先打敌方英雄，有随从前排时随机
            const opponent = this.getOpponent(this.currentPlayer);
            if (opponent.field.length > 0) {
                return opponent.field[Math.floor(Math.random() * opponent.field.length)];
            }
            return opponent;
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
        
        let status = "--- " + (phase || `回合${this.turn}`) + " --- ";
        if (phase) {
            status += `【${phase}】\n`;
        }
        status += `回合 ${this.turn} - ${this.currentPlayer === this.player ? '我方' : '敌方'}回合\n`;
        status += '-'.repeat(50) + '\n';
        
        // 我方状态
        status += `【我方】${this.player.hero.name} (${this.player.getRealmName()})\n`;
        status += `  寿元: ${this.player.health}/${this.player.maxHealth}`;
        if (this.player.armor > 0) status += ` (+${this.player.armor}护盾)`;
        status += '\n';
        status += `  灵石: ${this.player.mana}/${this.player.maxMana}\n`;
        status += `  手牌: ${this.player.hand.length}张  场上: ${this.player.field.length}人\n`;
        if (this.player.field.length > 0) {
            status += `  场上修士: ` + this.player.field.map(c => `${c.name}(${c.attack}/${c.health})`).join(', ') + '\n';
        }
        
        status += '-'.repeat(50) + '\n';
        
        // 敌方状态
        status += `【敌方】${this.opponent.hero.name} (${this.opponent.getRealmName()})\n`;
        status += `  寿元: ${this.opponent.health}/${this.opponent.maxHealth}`;
        if (this.opponent.armor > 0) status += ` (+${this.opponent.armor}护盾)`;
        status += '\n';
        status += `  手牌: ${this.opponent.hand.length}张  场上: ${this.opponent.field.length}人\n`;
        if (this.opponent.field.length > 0) {
            status += `  场上修士: ` + this.opponent.field.map(c => `${c.name}(${c.attack}/${c.health})`).join(', ') + '\n';
        }
        
        status += '='.repeat(50);
        
        this.gameLog.push(status);
        
        const logContent = document.getElementById('log-content');
        if (!logContent) return;
        
        const entry = document.createElement('div');
        entry.className = 'log-entry status-log';
        entry.style.color = '#888';
        entry.style.fontSize = '11px';
        entry.style.whiteSpace = 'pre-wrap';
        entry.textContent = status;
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
        // 更新玩家信息
        document.getElementById('player-health').textContent = this.player.health;
        document.getElementById('player-realm-text').textContent = this.player.getRealmName();
        document.getElementById('player-sect').textContent = this.player.hero.sect;
        document.getElementById('current-mana').textContent = this.player.mana;
        document.getElementById('max-mana').textContent = this.player.maxMana;
        document.getElementById('player-hero-name').textContent = this.player.hero.name;
        document.getElementById('player-avatar').textContent = this.player.hero.avatar;
        document.getElementById('hero-skill').textContent = `${this.player.hero.skill.name}: ${this.player.hero.skill.description}`;
        
        // 更新对手信息
        document.getElementById('opponent-health').textContent = this.opponent.health;
        document.getElementById('opponent-realm').textContent = this.opponent.getRealmName();
        document.getElementById('opponent-hand-count').textContent = this.opponent.hand.length;
        
        // 更新回合信息
        document.getElementById('turn-number').textContent = this.turn;
        document.getElementById('current-player').textContent = this.currentPlayer === this.player ? '我方回合' : '敌方回合';
        document.getElementById('end-turn-btn').disabled = this.currentPlayer !== this.player || this.gameOver;
        
        // 更新卡组
        document.getElementById('deck-count').textContent = this.player.deck.length;
        document.getElementById('graveyard-count').textContent = this.player.graveyard.length;
        
        // 渲染手牌
        this.renderHand();
        
        // 渲染场上
        this.renderField();
    }
    
    // 渲染手牌
    renderHand() {
        const handArea = document.getElementById('player-hand');
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
    
    // 渲染场上
    renderField() {
        // 玩家场上
        const playerField = document.getElementById('player-creatures');
        playerField.innerHTML = '';
        this.player.field.forEach(creature => {
            const div = this.createCreatureElement(creature);
            div.onclick = () => {
                if (this.currentPlayer === this.player && !creature.hasAttacked && !creature.frozen) {
                    this.selectAttackTarget(creature);
                }
            };
            playerField.appendChild(div);
        });
        
        // 对手场上
        const opponentField = document.getElementById('opponent-creatures');
        opponentField.innerHTML = '';
        this.opponent.field.forEach(creature => {
            const div = this.createCreatureElement(creature);
            div.onclick = () => {
                if (this.selectedCreature) {
                    this.clickTarget(creature);
                }
            };
            opponentField.appendChild(div);
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
        if (!creature.hasAttacked && !creature.frozen) {
            div.classList.add('can-attack');
        }
        if (creature.frozen) {
            div.style.opacity = '0.5';
        }
        
        div.innerHTML = `
            <div class="creature-name">${creature.name}</div>
            <div class="creature-avatar">${creature.avatar}</div>
            <div class="creature-stats">
                <span style="color:#e74c3c">⚔️${creature.attack}</span>
                <span style="color:#27ae60">❤️${creature.health}</span>
            </div>
            ${creature.frozen ? '<div style="color:#3498db;font-size:10px">❄️冻结</div>' : ''}
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
            'pet': '灵宠'
        };
        return names[type] || type;
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

    // 显示灵石变化
    showManaChange(targetEl, amount) {
        const rect = targetEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + 30;
        
        const type = amount >= 0 ? 'mana' : 'negative';
        const text = amount >= 0 ? `+${amount}灵石` : `${amount}灵石`;
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
        const container = document.getElementById(owner.isPlayer ? 'player-creatures' : 'opponent-creatures');
        const creatures = container.querySelectorAll('.creature-card');
        // 通过名称匹配（简化处理）
        for (let el of creatures) {
            if (el.querySelector('.creature-name').textContent === creature.name) {
                return el;
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
        this.formations = [];
    }
    
    // 初始化卡组
    initDeck() {
        const allCards = getAllCards();
        // 随机选择30张卡牌组成卡组
        const shuffled = [...allCards].sort(() => Math.random() - 0.5);
        this.deck = shuffled.slice(0, 30).map(card => ({...card, id: Math.random().toString(36)}));
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
                this.health -= damage;
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
        
        // 增加灵石上限（最多10）
        if (this.maxMana < 10) {
            this.maxMana++;
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
            // 显示灵石恢复
            if (this.mana > 0) {
                setTimeout(() => {
                    const heroEl = game.getPlayerElement(this);
                    if (heroEl) {
                        game.showManaChange(heroEl, this.mana);
                    }
                }, 500);
            }
        }
        
        // 重置攻击状态
        this.field.forEach(c => {
            c.hasAttacked = false;
            if (c.frozen) c.frozen = false;
            if (c.poisoned) {
                c.health--;
                game.log(`${c.name} 中毒-1生命`);
            }
        });
        
        // 抽牌
        this.draw(1);
        
        // 英雄技能
        if (this.hero.skill.effect) {
            const msg = this.hero.skill.effect(this);
            if (msg) game.log(msg);
        }
        
        // 记录回合开始状态
        if (game) game.logStatus('回合开始');
        
        // 阵法效果
        this.formations.forEach(f => {
            if (f.onTurnStart) {
                const msg = f.onTurnStart(game, this);
                if (msg) game.log(msg);
            }
        });
    }
    
    // 受到伤害
    takeDamage(damage, source = null) {
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
    
    // 获得护甲
    gainArmor(amount) {
        this.armor += amount;
        
        // 显示护盾特效
        if (game && amount > 0) {
            const heroEl = game.getPlayerElement(this);
            if (heroEl) {
                game.showArmorChange(heroEl, amount);
            }
        }
    }
    
    // 获得灵石
    gainMana(amount) {
        this.mana += amount;
        
        // 显示灵石特效
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
