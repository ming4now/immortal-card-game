// 凡人修仙传英雄设计
const HEROES = {
    // 主角 - 韩立
    hanli: {
        id: 'hanli',
        name: '韩立',
        avatar: '韩',
        sect: '黄枫谷',
        spiritRoot: '木',
        health: 30,
        skill: {
            name: '长春功',
            description: '每回合开始时恢复1点生命',
            effect: (hero) => {
                hero.heal(1);
                return '韩立运转长春功，恢复1点生命';
            }
        },
        specialCards: ['qingyuan_sword', 'golden_cup', 'blood_sword']
    },
    
    // 女主 - 南宫婉
    nangongwan: {
        id: 'nangongwan',
        name: '南宫婉',
        avatar: '婉',
        sect: '掩月宗',
        spiritRoot: '水',
        health: 28,
        skill: {
            name: '轮回诀',
            description: '生命值首次降到0时，恢复10点生命（每场战斗一次）',
            effect: (hero) => {
                // 只有在生命值<=0且未使用过复活时才触发
                if (hero.health <= 0 && !hero.hasUsedRevive) {
                    hero.hasUsedRevive = true; hero.health = 10;
                    hero.health = 10; // 直接设置为10点生命
                    return '南宫婉施展轮回诀，重获新生！生命恢复至10点';
                }
                return null;
            }
        },
        specialCards: ['mask_of_moon', 'water_dance']
    },
    
    // 大衍神君
    dayan: {
        id: 'dayan',
        name: '大衍神君',
        avatar: '衍',
        sect: '大衍宗',
        spiritRoot: '金',
        health: 25,
        skill: {
            name: '大衍决',
            description: '召唤的傀儡获得+1/+1',
            effect: (hero, creature) => {
                if (creature && creature.isPuppet) {
                    creature.attack += 1;
                    creature.health += 1;
                    return '大衍决加持，傀儡获得强化';
                }
                return null;
            }
        },
        specialCards: ['puppet_soldier', 'puppet_beast', 'puppet_formation']
    },
    
    // 银月
    yinyue: {
        id: 'yinyue',
        name: '银月',
        avatar: '月',
        sect: '妖族',
        spiritRoot: '变异',
        health: 26,
        skill: {
            name: '妖狐化身',
            description: '每回合自动消耗2灵石额外抽一张牌（灵石不足或手牌满时跳过）',
            effect: (hero) => {
                // 实际逻辑在Player.startTurn中处理
                return null;
            }
        },
        specialCards: ['fox_fire', 'illusion_moon', 'soul_devour']
    },
    
    // 紫灵
    ziling: {
        id: 'ziling',
        name: '紫灵',
        avatar: '紫',
        sect: '妙音门',
        spiritRoot: '水',
        health: 27,
        skill: {
            name: '妙音幻术',
            description: '每回合开始时，敌方场上修士攻击力-1（已减过的不再重复）',
            effect: (hero, game) => {
                if (!game) return null;
                const opponent = game.getOpponent(hero);
                // 记录本回合已经施加过 debuff 的随从
                if (!hero._zilingDebuffTargets) hero._zilingDebuffTargets = new Set();
                
                let debuffedCount = 0;
                opponent.field.forEach(creature => {
                    // 如果本回合还没给这个随从减过攻击力
                    if (!hero._zilingDebuffTargets.has(creature.id)) {
                        creature.attack = Math.max(0, creature.attack - 1);
                        hero._zilingDebuffTargets.add(creature.id);
                        debuffedCount++;
                    }
                });
                
                if (debuffedCount > 0) {
                    return `紫灵施展幻术，${debuffedCount}个敌方修士攻击力下降`;
                }
                return null;
            }
        },
        specialCards: ['sound_blade', 'charm_dance']
    },
    
    // 元瑶
    yuanyao: {
        id: 'yuanyao',
        name: '元瑶',
        avatar: '瑶',
        sect: '鬼道',
        spiritRoot: '阴',
        health: 28,
        skill: {
            name: '还魂术',
            description: '可以复活墓地中的一张修士卡（消耗5灵石）',
            effect: (hero) => {
                return '元瑶可消耗5灵石复活修士';
            }
        },
        specialCards: ['soul_recover', 'ghost_flame', 'yin_yang_ring']
    }
};

// 宗门系统
const SECTS = {
    huangfeng: {
        name: '黄枫谷',
        type: '正道',
        bonus: '木属性卡牌灵石消耗-1'
    },
    yanyue: {
        name: '掩月宗',
        type: '正道',
        bonus: '水属性法术伤害+1'
    },
    hehuan: {
        name: '合欢宗',
        type: '魔道',
        bonus: '控制法术持续时间+1'
    },
    guhun: {
        name: '鬼灵门',
        type: '魔道',
        bonus: '墓地卡牌效果增强'
    },
    dayan: {
        name: '大衍宗',
        type: '中立',
        bonus: '傀儡类卡牌获得+1/+1'
    },
    yaozu: {
        name: '妖族',
        type: '妖族',
        bonus: '灵宠卡牌召唤费用-1'
    }
};
