// 修仙境界系统
const REALMS = [
    { name: '练气', levels: 13, color: '#95a5a6' },      // 1-13
    { name: '筑基', levels: 13, color: '#27ae60' },      // 14-26
    { name: '结丹', levels: 13, color: '#3498db' },      // 27-39
    { name: '元婴', levels: 13, color: '#9b59b6' },      // 40-52
    { name: '化神', levels: 13, color: '#e74c3c' },      // 53-65
    { name: '炼虚', levels: 13, color: '#f39c12' },      // 66-78
    { name: '合体', levels: 13, color: '#1abc9c' },      // 79-91
    { name: '大乘', levels: 13, color: '#e91e63' },      // 92-104
    { name: '真仙', levels: 13, color: '#ffd700' }       // 105+
];

// 卡牌数据库
const CARD_DATABASE = {
    // ========== 修士卡 ==========
    cultivators: [
        // 练气期 - 基础随从
        {
            id: 'disciple_huangfeng',
            name: '黄枫谷弟子',
            type: 'cultivator',
            realm: 1,
            cost: 1,
            attack: 1,
            health: 2,
            spiritRoot: '木',
            description: '初入修仙路的弟子',
            avatar: '👤',
            sect: '黄枫谷'
        },
        {
            id: 'disciple_moyao',
            name: '魔道散修',
            type: 'cultivator',
            realm: 1,
            cost: 1,
            attack: 2,
            health: 1,
            spiritRoot: '火',
            description: '残忍嗜血的魔道修士',
            avatar: '👹',
            sect: '魔道'
        },
        {
            id: 'outer_disciple',
            name: '外门弟子',
            type: 'cultivator',
            realm: 2,
            cost: 2,
            attack: 2,
            health: 3,
            spiritRoot: '金',
            description: '宗门外门弟子',
            avatar: '⚔️'
        },
        {
            id: 'inner_disciple',
            name: '内门弟子',
            type: 'cultivator',
            realm: 3,
            cost: 3,
            attack: 3,
            health: 3,
            spiritRoot: '水',
            description: '宗门重点培养的弟子',
            avatar: '🎓'
        },
        {
            id: 'sword_cultivator',
            name: '剑修',
            type: 'cultivator',
            realm: 3,
            cost: 3,
            attack: 4,
            health: 2,
            spiritRoot: '金',
            description: '攻击力高但生命值低',
            avatar: '🗡️'
        },
        // 练气期 - 小说角色
        {
            id: 'li_feyu',
            name: '厉飞雨',
            type: 'cultivator',
            realm: 2,
            cost: 2,
            attack: 2,
            health: 2,
            spiritRoot: '木',
            description: '韩立早期好友，战友情谊',
            avatar: '🤝',
            onPlay: (game, player) => {
                // 如果有其他友方随从，给予+1/+1
                if (player.field.length > 0) {
                    player.field.forEach(c => {
                        if (c.name !== '厉飞雨') {
                            c.attack += 1;
                            c.health += 1;
                        }
                    });
                    return '厉飞雨激励友方随从+1/+1';
                }
            }
        },
        {
            id: 'doctor_mo',
            name: '墨大夫',
            type: 'cultivator',
            realm: 3,
            cost: 3,
            attack: 2,
            health: 4,
            spiritRoot: '木',
            description: '阴险毒辣，擅长用毒',
            avatar: '👨‍⚕️',
            onAttack: (game, attacker, target) => {
                target.poisoned = true;
                return '墨大夫施毒';
            }
        },
        // 筑基期
        {
            id: 'foundation_elder',
            name: '筑基长老',
            type: 'cultivator',
            realm: 4,
            cost: 4,
            attack: 4,
            health: 5,
            spiritRoot: '水',
            description: '已筑基的宗门长老',
            avatar: '🧙‍♂️',
            battlecry: () => '获得2点护盾',
            onPlay: (game, player) => {
                player.gainArmor(2);
            }
        },
        {
            id: 'demon_cultivator',
            name: '魔道筑基',
            type: 'cultivator',
            realm: 4,
            cost: 4,
            attack: 5,
            health: 4,
            spiritRoot: '火',
            description: '嗜血魔修，攻击时恢复1点生命',
            avatar: '🧛',
            onAttack: (game, attacker, target) => {
                attacker.health += 1;
                return '魔道筑基吸取生命力';
            }
        },
        {
            id: 'li_huayuan',
            name: '李化元',
            type: 'cultivator',
            realm: 5,
            cost: 5,
            attack: 4,
            health: 6,
            spiritRoot: '火',
            description: '黄枫谷结丹期修士，韩立师父',
            avatar: '👨‍🏫',
            battlecry: () => '召唤一个黄枫谷弟子',
            onPlay: (game, player) => {
                player.summon({
                    name: '黄枫谷弟子',
                    attack: 1,
                    health: 2,
                    avatar: '👤'
                });
                return '李化元召唤弟子助阵';
            }
        },
        {
            id: 'hong_fu',
            name: '红拂',
            type: 'cultivator',
            realm: 5,
            cost: 5,
            attack: 3,
            health: 7,
            spiritRoot: '水',
            description: '黄枫谷结丹期女修，南宫婉师父',
            avatar: '👩‍🏫',
            onPlay: (game, player) => {
                // 为所有友方随从恢复2生命
                player.field.forEach(c => {
                    if (c.health < c.maxHealth) {
                        c.health = Math.min(c.health + 2, c.maxHealth);
                    }
                });
                return '红拂为友方恢复生命';
            }
        },
        // 结丹期
        {
            id: 'core_ancestor',
            name: '结丹老祖',
            type: 'cultivator',
            realm: 7,
            cost: 6,
            attack: 5,
            health: 6,
            spiritRoot: '土',
            description: '一方霸主',
            avatar: '👑',
            battlecry: () => '对敌方英雄造成2点伤害',
            onPlay: (game, player) => {
                const opponent = game.getOpponent(player);
                opponent.takeDamage(2);
            }
        },
        {
            id: 'thunder_master',
            name: '雷系修士',
            type: 'cultivator',
            realm: 7,
            cost: 7,
            attack: 6,
            health: 6,
            spiritRoot: '雷',
            description: '变异雷灵根，出场时对随机敌人造成3点伤害',
            avatar: '⚡',
            onPlay: (game, player) => {
                const opponent = game.getOpponent(player);
                if (opponent.field.length > 0) {
                    const target = opponent.field[Math.floor(Math.random() * opponent.field.length)];
                    target.takeDamage(3);
                    return `雷霆击中${target.name}`;
                } else {
                    opponent.takeDamage(3);
                    return '雷霆击中敌方英雄';
                }
            }
        },
        {
            id: 'linghu_old',
            name: '令狐老祖',
            type: 'cultivator',
            realm: 8,
            cost: 8,
            attack: 6,
            health: 8,
            spiritRoot: '木',
            description: '黄枫谷元婴老祖，实力深不可测',
            avatar: '👴',
            battlecry: () => '获得4点护盾，抽一张牌',
            onPlay: (game, player) => {
                player.gainArmor(4);
                player.draw(1);
                return '令狐老祖展现元婴实力';
            }
        },
        // 元婴期
        {
            id: 'nascent_soul',
            name: '元婴大能',
            type: 'cultivator',
            realm: 10,
            cost: 10,
            attack: 8,
            health: 8,
            spiritRoot: '水',
            description: '可元婴出窍，死亡后回到手牌',
            avatar: '☯️',
            deathrattle: () => '返回手牌',
            onDeath: (game, player, card) => {
                player.addToHand(card);
                return '元婴出窍，返回手牌';
            }
        },
        // 化神期 - 顶级随从
        {
            id: 'divine_transformation',
            name: '化神老怪',
            type: 'cultivator',
            realm: 13,
            cost: 12,
            attack: 10,
            health: 10,
            spiritRoot: '变异',
            description: '人界巅峰存在，出场时清除所有敌方随从',
            avatar: '🌟',
            onPlay: (game, player) => {
                const opponent = game.getOpponent(player);
                const count = opponent.field.length;
                opponent.field = [];
                if (count > 0) {
                    return `化神老怪威压，清除${count}个敌方随从`;
                }
            }
        },
        {
            id: 'thunder_master',
            name: '雷系修士',
            type: 'cultivator',
            realm: 7,
            cost: 7,
            attack: 6,
            health: 6,
            spiritRoot: '雷',
            description: '变异雷灵根，出场时对随机敌人造成3点伤害',
            avatar: '⚡',
            onPlay: (game, player) => {
                const opponent = game.getOpponent(player);
                if (opponent.field.length > 0) {
                    const target = opponent.field[Math.floor(Math.random() * opponent.field.length)];
                    target.takeDamage(3);
                    return `雷霆击中${target.name}`;
                } else {
                    opponent.takeDamage(3);
                    return '雷霆击中敌方英雄';
                }
            }
        },
        // 元婴期
        {
            id: 'nascent_soul',
            name: '元婴大能',
            type: 'cultivator',
            realm: 10,
            cost: 10,
            attack: 8,
            health: 8,
            spiritRoot: '水',
            description: '可元婴出窍，死亡后回到手牌',
            avatar: '☯️',
            deathrattle: () => '返回手牌',
            onDeath: (game, player, card) => {
                player.addToHand(card);
                return '元婴出窍，返回手牌';
            }
        },
        // 韩立专属修士 - 黄枫谷系列
        {
            id: 'huangfeng_elder',
            name: '黄枫谷长老',
            type: 'cultivator',
            realm: 5,
            cost: 5,
            attack: 3,
            health: 6,
            spiritRoot: '木',
            description: '黄枫谷结丹长老，高生命值，获得嘲讽',
            avatar: '👴',
            onPlay: (game, player) => {
                // 找到刚召唤的这个随从
                const creature = player.field[player.field.length - 1];
                if (creature) {
                    creature.taunt = true;
                }
                return '黄枫谷长老坐镇，获得嘲讽';
            }
        },
        // 南宫婉专属修士 - 掩月宗系列
        {
            id: 'yanyue_disciple',
            name: '掩月宗弟子',
            type: 'cultivator',
            realm: 2,
            cost: 2,
            attack: 2,
            health: 3,
            spiritRoot: '水',
            description: '掩月宗入门弟子，攻击时恢复1点生命',
            avatar: '🌙',
            onAttack: (game, attacker, target) => {
                attacker.health = Math.min(attacker.health + 1, attacker.maxHealth);
                return '掩月宗弟子吸收月华';
            }
        },
        {
            id: 'yanyue_elder',
            name: '掩月宗长老',
            type: 'cultivator',
            realm: 6,
            cost: 6,
            attack: 4,
            health: 7,
            spiritRoot: '水',
            description: '掩月宗结丹长老，出场时冻结一个敌方随从',
            avatar: '🌸',
            onPlay: (game, player) => {
                const opponent = game.getOpponent(player);
                if (opponent.field.length > 0) {
                    const target = opponent.field[Math.floor(Math.random() * opponent.field.length)];
                    target.frozen = true;
                    return `掩月宗长老冻结${target.name}`;
                }
                return '掩月宗长老出场';
            }
        },
        // 大衍神君专属修士 - 大衍宗系列
        {
            id: 'dayan_disciple',
            name: '大衍宗弟子',
            type: 'cultivator',
            realm: 3,
            cost: 3,
            attack: 2,
            health: 4,
            spiritRoot: '金',
            description: '大衍宗弟子，召唤傀儡时额外获得+1/+1',
            avatar: '🔮',
            // 效果在大衍神君技能中处理
        },
        // 紫灵专属修士 - 妙音门系列
        {
            id: 'miaoyin_disciple',
            name: '妙音门弟子',
            type: 'cultivator',
            realm: 3,
            cost: 3,
            attack: 2,
            health: 3,
            spiritRoot: '水',
            description: '妙音门弟子，攻击时敌方英雄失去1点灵石',
            avatar: '🎵',
            onAttack: (game, attacker, target) => {
                const opponent = game.getOpponent(game.getPlayerByCreature(attacker));
                if (opponent && opponent.mana > 0) {
                    opponent.mana = Math.max(0, opponent.mana - 1);
                    return '妙音门弟子扰乱敌方灵力';
                }
            }
        },
        // 元瑶专属修士 - 鬼灵门/鬼道系列
        {
            id: 'guiling_disciple',
            name: '鬼灵门弟子',
            type: 'cultivator',
            realm: 2,
            cost: 2,
            attack: 2,
            health: 2,
            spiritRoot: '阴',
            description: '鬼灵门弟子，死亡时抽一张牌',
            avatar: '👻',
            onDeath: (game, player, card) => {
                player.draw(1);
                return '鬼灵门弟子魂魄归位，抽一张牌';
            }
        },
        {
            id: 'ghost_cultivator',
            name: '鬼修',
            type: 'cultivator',
            realm: 4,
            cost: 4,
            attack: 4,
            health: 3,
            spiritRoot: '阴',
            description: '鬼道修士，攻击时恢复2点生命',
            avatar: '💀',
            onAttack: (game, attacker, target) => {
                attacker.health = Math.min(attacker.health + 2, attacker.maxHealth);
                return '鬼修吸取生命力';
            }
        }
    ],

    // ========== 法术卡 ==========
    spells: [
        // 攻击法术
        {
            id: 'fireball',
            name: '火球术',
            type: 'spell',
            realm: 1,
            cost: 1,
            description: '造成3点伤害',
            avatar: '🔥',
            effect: (game, player) => {
                const target = game.selectTarget('deal_damage');
                if (target) {
                    target.takeDamage(3);
                    return `火球术造成3点伤害`;
                }
            }
        },
        {
            id: 'lightning_strike',
            name: '雷击术',
            type: 'spell',
            realm: 3,
            cost: 3,
            description: '对全场所有敌方造成2点伤害',
            avatar: '⚡',
            effect: (game, player) => {
                const opponent = game.getOpponent(player);
                opponent.field.forEach(creature => creature.takeDamage(2));
                opponent.takeDamage(2);
                return '雷击全场！';
            }
        },
        {
            id: 'sword_qingyuan',
            name: '青元剑诀',
            type: 'spell',
            realm: 5,
            cost: 5,
            description: '造成8点伤害',
            avatar: '🗡️',
            effect: (game, player) => {
                const target = game.selectTarget('deal_damage');
                if (target) {
                    target.takeDamage(8);
                    return '青元剑诀！';
                }
            }
        },
        // 防御法术
        {
            id: 'shield_spell',
            name: '护盾术',
            type: 'spell',
            realm: 2,
            cost: 2,
            description: '获得5点护甲',
            avatar: '🛡️',
            effect: (game, player) => {
                player.gainArmor(5);
                return '获得5点护甲';
            }
        },
        {
            id: 'healing_light',
            name: '回春术',
            type: 'spell',
            realm: 2,
            cost: 2,
            description: '恢复5点生命',
            avatar: '💚',
            effect: (game, player) => {
                player.heal(5);
                return '恢复5点生命';
            }
        },
        // 控制法术
        {
            id: 'freeze_spell',
            name: '冰冻术',
            type: 'spell',
            realm: 3,
            cost: 3,
            description: '冻结一个敌方修士，使其下回合无法攻击',
            avatar: '❄️',
            effect: (game, player) => {
                const target = game.selectTarget('enemy_creature');
                if (target) {
                    target.frozen = true;
                    return `${target.name}被冻结`;
                }
            }
        },
        {
            id: 'blood_escape',
            name: '血遁术',
            type: 'spell',
            realm: 4,
            cost: 2,
            description: '抽2张牌，失去3点生命',
            avatar: '🩸',
            effect: (game, player) => {
                player.draw(2);
                player.takeDamage(3);
                return '血遁逃生，失去3点生命';
            }
        }
    ],

    // ========== 法宝卡 (参考游戏王装备魔法 + 凡人修仙传经典法宝) ==========
    treasures: [
        // ===== 攻击类法宝 =====
        {
            id: 'bamboo_bee_cloud_sword',
            name: '青竹蜂云剑',
            type: 'treasure',
            realm: 7,
            cost: 6,
            description: '韩立本命法宝，装备修士攻击力+3，攻击时造成剑气伤害',
            avatar: '🎋',
            category: '攻击',
            durability: 5, // 耐久度，攻击一次减1
            equipEffect: (creature) => {
                creature.attack += 3;
                creature.hasSwordQi = true;
            },
            onAttack: (game, attacker, target, treasure) => {
                // 剑气额外伤害
                if (target && treasure.durability > 0) {
                    target.takeDamage(2);
                    treasure.durability--;
                    if (treasure.durability <= 0) {
                        return '青竹蜂云剑灵气耗尽，法宝损毁';
                    }
                    return '青竹蜂云剑释放剑气';
                }
            },
            onUnequip: (creature) => {
                creature.attack -= 3;
                creature.hasSwordQi = false;
            }
        },
        {
            id: 'golden_thunder_bamboo',
            name: '金雷竹',
            type: 'treasure',
            realm: 6,
            cost: 5,
            description: '辟邪至宝，装备修士攻击+2，对魔道/鬼修伤害翻倍',
            avatar: '⚡',
            category: '攻击',
            durability: 4,
            equipEffect: (creature) => {
                creature.attack += 2;
                creature.goldenThunder = true;
            },
            onAttack: (game, attacker, target, treasure) => {
                if (target && (target.spiritRoot === '阴' || target.type === 'ghost' || target.sect === '魔道')) {
                    const extraDamage = attacker.attack;
                    target.takeDamage(extraDamage);
                    treasure.durability--;
                    return '金雷竹辟邪之力爆发！';
                }
            },
            onUnequip: (creature) => {
                creature.attack -= 2;
                creature.goldenThunder = false;
            }
        },
        {
            id: 'blood_demon_sword',
            name: '血魔剑',
            type: 'treasure',
            realm: 5,
            cost: 4,
            description: '魔道至宝，装备修士攻击+2，攻击时吸血',
            avatar: '🗡️',
            category: '攻击',
            durability: 3,
            equipEffect: (creature) => {
                creature.attack += 2;
            },
            onAttack: (game, attacker, target, treasure) => {
                if (target) {
                    const healAmount = 2;
                    attacker.health = Math.min(attacker.health + healAmount, attacker.maxHealth);
                    treasure.durability--;
                    return `血魔剑吸血${healAmount}点`;
                }
            },
            onUnequip: (creature) => {
                creature.attack -= 2;
            }
        },
        {
            id: 'yin_yang_blades',
            name: '阴阳双刀',
            type: 'treasure',
            realm: 4,
            cost: 3,
            description: '可攻可守，装备修士攻击+1，可切换为防御模式(+2生命)',
            avatar: '🔪',
            category: '攻击',
            durability: 4,
            equipEffect: (creature) => {
                creature.attack += 1;
                creature.yinYangMode = 'attack'; // attack/defense
            },
            activeSkill: {
                name: '切换模式',
                effect: (game, creature, treasure) => {
                    if (creature.yinYangMode === 'attack') {
                        creature.yinYangMode = 'defense';
                        creature.attack -= 1;
                        creature.health += 2;
                        creature.maxHealth += 2;
                        return '阴阳双刀切换为防御模式';
                    } else {
                        creature.yinYangMode = 'attack';
                        creature.attack += 1;
                        creature.health -= 2;
                        creature.maxHealth -= 2;
                        return '阴阳双刀切换为攻击模式';
                    }
                }
            },
            onUnequip: (creature) => {
                if (creature.yinYangMode === 'attack') {
                    creature.attack -= 1;
                } else {
                    creature.health -= 2;
                    creature.maxHealth -= 2;
                }
                creature.yinYangMode = null;
            }
        },
        {
            id: 'golden_cup_blades',
            name: '金蚨子母刃',
            type: 'treasure',
            realm: 6,
            cost: 5,
            description: '可分化出子刃攻击，装备修士攻击+2，攻击时额外攻击一个目标',
            avatar: '🏆',
            category: '攻击',
            durability: 3,
            equipEffect: (creature) => {
                creature.attack += 2;
            },
            onAttack: (game, attacker, target, treasure) => {
                // 寻找另一个敌方目标
                const opponent = game.getOpponent(game.getPlayerByCreature(attacker));
                if (opponent.field.length > 1) {
                    const otherTargets = opponent.field.filter(c => c !== target);
                    const secondTarget = otherTargets[Math.floor(Math.random() * otherTargets.length)];
                    if (secondTarget) {
                        secondTarget.takeDamage(Math.floor(attacker.attack / 2));
                        treasure.durability--;
                        return `金蚨子母刃分化攻击${secondTarget.name}`;
                    }
                }
            },
            onUnequip: (creature) => {
                creature.attack -= 2;
            }
        },

        // ===== 防御类法宝 =====
        {
            id: 'blue_crystal_shield',
            name: '蓝晶盾',
            type: 'treasure',
            realm: 3,
            cost: 3,
            description: '防御法宝，装备修士生命+3，受到的伤害-1',
            avatar: '🛡️',
            category: '防御',
            durability: 5,
            equipEffect: (creature) => {
                creature.health += 3;
                creature.maxHealth += 3;
                creature.damageReduction = (creature.damageReduction || 0) + 1;
            },
            onTakeDamage: (game, creature, damage, treasure) => {
                treasure.durability--;
                if (treasure.durability <= 0) {
                    return '蓝晶盾破碎';
                }
                return '蓝晶盾抵挡伤害';
            },
            onUnequip: (creature) => {
                creature.health -= 3;
                creature.maxHealth -= 3;
                creature.damageReduction = Math.max(0, (creature.damageReduction || 0) - 1);
            }
        },
        {
            id: 'yuan_magnet_mountain',
            name: '元磁神山',
            type: 'treasure',
            realm: 8,
            cost: 7,
            description: '重量法宝，装备修士获得嘲讽，生命+5，受到的伤害-2',
            avatar: '⛰️',
            category: '防御',
            durability: 6,
            equipEffect: (creature) => {
                creature.health += 5;
                creature.maxHealth += 5;
                creature.taunt = true;
                creature.damageReduction = (creature.damageReduction || 0) + 2;
            },
            onTakeDamage: (game, creature, damage, treasure) => {
                treasure.durability--;
                if (treasure.durability <= 0) {
                    creature.taunt = false;
                    return '元磁神山崩溃';
                }
                return '元磁神山吸收冲击';
            },
            onUnequip: (creature) => {
                creature.health -= 5;
                creature.maxHealth -= 5;
                creature.taunt = false;
                creature.damageReduction = Math.max(0, (creature.damageReduction || 0) - 2);
            }
        },
        {
            id: 'xuantian_shield',
            name: '玄天仙盾',
            type: 'treasure',
            realm: 9,
            cost: 8,
            description: '玄天之宝，装备修士免疫一次致命伤害',
            avatar: '🌟',
            category: '防御',
            durability: 1,
            equipEffect: (creature) => {
                creature.immortalShield = true;
            },
            onFatalDamage: (game, creature, treasure) => {
                if (creature.immortalShield && treasure.durability > 0) {
                    treasure.durability = 0;
                    creature.immortalShield = false;
                    creature.health = 1;
                    return '玄天仙盾救主，抵挡致命一击！';
                }
            },
            onUnequip: (creature) => {
                creature.immortalShield = false;
            }
        },

        // ===== 辅助类法宝 =====
        {
            id: 'wind_thunder_wings',
            name: '风雷翅',
            type: 'treasure',
            realm: 6,
            cost: 4,
            description: '遁术至宝，装备修士获得疾风（可攻击两次），攻击力-1',
            avatar: '🦅',
            category: '辅助',
            durability: 4,
            equipEffect: (creature) => {
                creature.attack -= 1;
                creature.windThunderWings = true;
                creature.canAttackTwice = true;
            },
            activeSkill: {
                name: '风雷遁',
                effect: (game, creature, treasure) => {
                    creature.canAttack = true;
                    treasure.durability--;
                    return `${creature.name}使用风雷翅，本回合可再次攻击`;
                }
            },
            onUnequip: (creature) => {
                creature.attack += 1;
                creature.windThunderWings = false;
                creature.canAttackTwice = false;
            }
        },
        {
            id: 'heaven_bottle',
            name: '掌天瓶',
            type: 'treasure',
            realm: 1,
            cost: 2,
            description: '催熟灵药，每回合开始时抽一张牌',
            avatar: '🏺',
            category: '辅助',
            durability: 3,
            onTurnStart: (game, player, creature, treasure) => {
                if (treasure.durability > 0) {
                    player.draw(1);
                    treasure.durability--;
                    if (treasure.durability <= 0) {
                        return '掌天瓶灵液耗尽';
                    }
                    return '掌天瓶催熟灵药，获得卡牌';
                }
            },
            activeSkill: {
                name: '绿液催熟',
                effect: (game, player, treasure) => {
                    player.heal(5);
                    treasure.durability = 0;
                    return '掌天瓶绿液催熟，恢复5点生命';
                }
            },
            onUnequip: (creature) => {
                // 无属性变化
            }
        },
        {
            id: 'nine_curve_spirit',
            name: '九曲灵参',
            type: 'treasure',
            realm: 5,
            cost: 4,
            description: '成精灵药，装备修士每回合恢复2点生命，+1生命上限',
            avatar: '🌿',
            category: '辅助',
            durability: 4,
            equipEffect: (creature) => {
                creature.maxHealth += 1;
                creature.health += 1;
            },
            onTurnStart: (game, player, creature, treasure) => {
                if (treasure.durability > 0 && creature.health < creature.maxHealth) {
                    creature.health = Math.min(creature.health + 2, creature.maxHealth);
                    treasure.durability--;
                    return '九曲灵参恢复生命';
                }
            },
            onUnequip: (creature) => {
                creature.maxHealth -= 1;
            }
        },
        {
            id: 'spirit_eye_spring',
            name: '灵眼之泉',
            type: 'treasure',
            realm: 4,
            cost: 3,
            description: '灵眼宝物，装备修士灵力消耗-1（最少1点）',
            avatar: '👁️',
            category: '辅助',
            durability: 5,
            equipEffect: (creature) => {
                creature.manaDiscount = (creature.manaDiscount || 0) + 1;
            },
            onUnequip: (creature) => {
                creature.manaDiscount = Math.max(0, (creature.manaDiscount || 0) - 1);
            }
        },

        // ===== 特殊类法宝 =====
        {
            id: 'xutian_ding',
            name: '虚天鼎',
            type: 'treasure',
            realm: 8,
            cost: 7,
            description: '虚天殿至宝，可封印敌方一个修士1回合',
            avatar: '🏛️',
            category: '特殊',
            durability: 2,
            activeSkill: {
                name: '虚天封印',
                effect: (game, player, treasure) => {
                    const opponent = game.getOpponent(player);
                    if (opponent.field.length > 0) {
                        const target = opponent.field[Math.floor(Math.random() * opponent.field.length)];
                        target.sealed = true;
                        target.sealedTurns = 1;
                        treasure.durability--;
                        return `虚天鼎封印${target.name}1回合`;
                    }
                    return '场上没有可封印的目标';
                }
            },
            onUnequip: (creature) => {}
        },
        {
            id: 'eight_spirit_ruler',
            name: '八灵尺',
            type: 'treasure',
            realm: 7,
            cost: 6,
            description: '通天灵宝，可控制敌方一个修士攻击友方',
            avatar: '📏',
            category: '特殊',
            durability: 2,
            activeSkill: {
                name: '八灵控魂',
                effect: (game, player, treasure) => {
                    const opponent = game.getOpponent(player);
                    if (opponent.field.length > 0) {
                        const target = opponent.field[Math.floor(Math.random() * opponent.field.length)];
                        if (opponent.field.length > 1) {
                            const allies = opponent.field.filter(c => c !== target);
                            const ally = allies[Math.floor(Math.random() * allies.length)];
                            ally.takeDamage(target.attack);
                            treasure.durability--;
                            return `八灵尺控制${target.name}攻击${ally.name}`;
                        }
                    }
                    return '无法使用控魂';
                }
            },
            onUnequip: (creature) => {}
        },
        {
            id: 'five_devils',
            name: '五子同心魔',
            type: 'treasure',
            realm: 6,
            cost: 5,
            description: '魔道邪宝，装备修士攻击+1，死亡时召唤5个1/1魔魂',
            avatar: '👹',
            category: '特殊',
            durability: 1,
            equipEffect: (creature) => {
                creature.attack += 1;
            },
            onDeath: (game, player, creature, treasure) => {
                for (let i = 0; i < 5; i++) {
                    player.summon({
                        name: '魔魂',
                        attack: 1,
                        health: 1,
                        avatar: '👻'
                    });
                }
                treasure.durability = 0;
                return '五子同心魔释放魔魂！';
            },
            onUnequip: (creature) => {
                creature.attack -= 1;
            }
        },
        {
            id: 'fire_cauldron',
            name: '火鼎',
            type: 'treasure',
            realm: 4,
            cost: 3,
            description: '炼丹至宝，使用后立即获得2张随机丹药卡',
            avatar: '🔥',
            category: '特殊',
            durability: 2,
            activeSkill: {
                name: '炼制丹药',
                effect: (game, player, treasure) => {
                    const pills = getCardsByType('pill');
                    for (let i = 0; i < 2 && i < pills.length; i++) {
                        const randomPill = pills[Math.floor(Math.random() * pills.length)];
                        player.addToHand({ ...randomPill, id: Math.random().toString(36) });
                    }
                    treasure.durability--;
                    return '火鼎炼制出2枚丹药';
                }
            },
            onUnequip: (creature) => {}
        },
        {
            id: 'blood_red_dart',
            name: '血红梭',
            type: 'treasure',
            realm: 3,
            cost: 2,
            description: '一次性法宝，对敌方英雄造成5点伤害后损毁',
            avatar: '🔺',
            category: '特殊',
            durability: 1,
            activeSkill: {
                name: '血光一击',
                effect: (game, player, treasure) => {
                    const opponent = game.getOpponent(player);
                    opponent.takeDamage(5);
                    treasure.durability = 0;
                    return '血红梭化作血光直击敌方！';
                }
            },
            onUnequip: (creature) => {}
        },
        {
            id: 'flying_sword_basic',
            name: '飞剑',
            type: 'treasure',
            realm: 2,
            cost: 2,
            description: '基础飞剑，装备修士攻击力+2',
            avatar: '🗡️',
            category: '攻击',
            durability: 4,
            equipEffect: (creature) => {
                creature.attack += 2;
            },
            onUnequip: (creature) => {
                creature.attack -= 2;
            }
        }
    ],

    // ========== 丹药卡 ==========
    pills: [
        {
            id: 'spirit_pill',
            name: '回灵丹',
            type: 'pill',
            realm: 1,
            cost: 1,
            description: '恢复3点生命',
            avatar: '💊',
            effect: (game, player) => {
                player.heal(3);
                return '服用回灵丹';
            }
        },
        {
            id: 'burst_pill',
            name: '爆灵丹',
            type: 'pill',
            realm: 3,
            cost: 2,
            description: '本回合灵石上限+2',
            avatar: '💉',
            effect: (game, player) => {
                player.tempMana += 2;
                return '爆灵丹激发潜力';
            }
        },
        {
            id: 'foundation_pill',
            name: '筑基丹',
            type: 'pill',
            realm: 4,
            cost: 4,
            description: '永久提升1点境界上限',
            avatar: '💎',
            effect: (game, player) => {
                player.maxRealmBonus += 1;
                return '服用筑基丹，根基更加稳固';
            }
        },
        // 韩立专属丹药
        {
            id: 'green_liquid',
            name: '掌天瓶绿液',
            type: 'pill',
            realm: 2,
            cost: 2,
            description: '韩立秘制，恢复5点生命并抽一张牌',
            avatar: '🧪',
            effect: (game, player) => {
                player.heal(5);
                player.draw(1);
                return '绿液入体，伤势痊愈';
            }
        },
        // 南宫婉专属丹药
        {
            id: 'moon_pill',
            name: '月华丹',
            type: 'pill',
            realm: 3,
            cost: 3,
            description: '掩月宗秘药，恢复4点生命并获得2点护甲',
            avatar: '🌙',
            effect: (game, player) => {
                player.heal(4);
                player.gainArmor(2);
                return '月华之力护体';
            }
        },
        // 大衍神君专属丹药
        {
            id: 'puppet_core',
            name: '傀儡核心',
            type: 'pill',
            realm: 3,
            cost: 3,
            description: '召唤一个2/2的临时傀儡',
            avatar: '⚙️',
            effect: (game, player) => {
                player.summon({
                    name: '临时傀儡',
                    attack: 2,
                    health: 2,
                    avatar: '🤖',
                    isPuppet: true
                });
                return '傀儡核心激活';
            }
        },
        // 银月专属丹药
        {
            id: 'fox_pill',
            name: '妖狐丹',
            type: 'pill',
            realm: 2,
            cost: 2,
            description: '妖族秘药，恢复3点生命，手牌未满时抽一张牌',
            avatar: '🦊',
            effect: (game, player) => {
                player.heal(3);
                if (player.hand.length < 10) {
                    player.draw(1);
                    return '妖狐丹生效，伤势恢复并补充卡牌';
                }
                return '妖狐丹生效，伤势恢复';
            }
        },
        // 紫灵专属丹药
        {
            id: 'sound_pill',
            name: '妙音丹',
            type: 'pill',
            realm: 2,
            cost: 2,
            description: '妙音门秘药，恢复2点生命，敌方场上修士攻击力-1',
            avatar: '🎵',
            effect: (game, player) => {
                player.heal(2);
                const opponent = game.getOpponent(player);
                opponent.field.forEach(c => {
                    if (c.attack > 0) c.attack -= 1;
                });
                return '妙音丹削弱敌方';
            }
        },
        // 元瑶专属丹药
        {
            id: 'soul_pill',
            name: '养魂丹',
            type: 'pill',
            realm: 3,
            cost: 3,
            description: '鬼道秘药，从墓地随机召回一个修士到手牌',
            avatar: '👻',
            effect: (game, player) => {
                const cultivators = player.graveyard.filter(c => c.type === 'cultivator' || c.type === 'pet' || c.type === 'puppet');
                if (cultivators.length > 0) {
                    const randomCard = cultivators[Math.floor(Math.random() * cultivators.length)];
                    player.addToHand({ ...randomCard, id: Math.random().toString(36) });
                    return `养魂丹召回${randomCard.name}`;
                }
                return '墓地无可用修士';
            }
        }
    ],

    // ========== 傀儡卡 (大衍神君系列) ==========
    puppets: [
        {
            id: 'puppet_soldier',
            name: '傀儡士兵',
            type: 'puppet',
            realm: 2,
            cost: 2,
            attack: 2,
            health: 3,
            description: '大衍神君制作的基础傀儡',
            avatar: '🤖',
            isPuppet: true
        },
        {
            id: 'puppet_beast',
            name: '傀儡兽',
            type: 'puppet',
            realm: 4,
            cost: 4,
            attack: 4,
            health: 4,
            description: '兽型傀儡，攻击时额外造成1点伤害',
            avatar: '🦁',
            isPuppet: true,
            onAttack: (game, attacker, target) => {
                target.takeDamage(1);
                return '傀儡兽造成额外伤害';
            }
        },
        {
            id: 'puppet_giant',
            name: '巨力傀儡',
            type: 'puppet',
            realm: 6,
            cost: 6,
            attack: 6,
            health: 6,
            description: '巨型傀儡，生命值高',
            avatar: '👾',
            isPuppet: true,
            battlecry: () => '获得嘲讽（敌人必须优先攻击此随从）',
            onPlay: (game, player) => {
                // 嘲讽效果需要在攻击选择目标时处理
                return '巨力傀儡获得嘲讽';
            }
        },
        {
            id: 'puppet_assassin',
            name: '影杀傀儡',
            type: 'puppet',
            realm: 5,
            cost: 5,
            attack: 7,
            health: 2,
            description: '暗杀型傀儡，高攻击低生命',
            avatar: '🥷',
            isPuppet: true
        }
    ],

    // ========== 阵法卡 (参考游戏王场地魔法 + 凡人修仙传阵法) ==========
    formations: [
        // 基础阵法 - 资源类
        {
            id: 'spirit_gathering',
            name: '聚灵阵',
            type: 'formation',
            realm: 2,
            cost: 2,
            duration: 3, // 持续3回合
            description: '持续3回合，每回合开始时获得1点灵石',
            avatar: '⭕',
            category: '资源',
            // 回合开始时触发
            onTurnStart: (game, player, formation) => {
                player.tempMana += 1;
                return `聚灵阵运转，获得1点额外灵石`;
            },
            // 阵法激活时触发
            onActivate: (game, player, formation) => {
                return '聚灵阵激活，灵力汇聚';
            },
            // 阵法消失时触发
            onExpire: (game, player, formation) => {
                return '聚灵阵灵力耗尽，阵法消散';
            }
        },
        
        // 攻击阵法
        {
            id: 'sword_formation',
            name: '小五行剑阵',
            type: 'formation',
            realm: 4,
            cost: 4,
            duration: 4,
            description: '持续4回合，我方场上修士攻击力+1',
            avatar: '⚔️',
            category: '攻击',
            // 光环效果 - 持续生效
            auraEffect: (player, formation) => {
                player.field.forEach(c => {
                    if (!c.buffFromFormation) c.buffFromFormation = 0;
                    c.buffFromFormation += 1;
                    c.attack += 1;
                });
            },
            // 阵法消失时移除光环
            onExpire: (game, player, formation) => {
                player.field.forEach(c => {
                    if (c.buffFromFormation) {
                        c.attack -= c.buffFromFormation;
                        c.buffFromFormation = 0;
                    }
                });
                return '小五行剑阵消散，攻击力加成消失';
            },
            onActivate: (game, player) => {
                return '小五行剑阵启动，剑气纵横';
            }
        },
        
        // 防御阵法
        {
            id: 'defense_formation',
            name: '金刚阵',
            type: 'formation',
            realm: 3,
            cost: 3,
            duration: 3,
            description: '持续3回合，我方英雄受到伤害-1（最少1点）',
            avatar: '🔰',
            category: '防御',
            damageReduction: 1,
            onActivate: (game, player) => {
                player.damageReduction = (player.damageReduction || 0) + 1;
                return '金刚阵护体，防御提升';
            },
            onExpire: (game, player, formation) => {
                player.damageReduction = Math.max(0, (player.damageReduction || 0) - (formation.damageReduction || 1));
                return '金刚阵破碎，防御下降';
            }
        },
        
        // 高级防御阵法
        {
            id: 'nine_heavens_protection',
            name: '九天玄罡阵',
            type: 'formation',
            realm: 6,
            cost: 5,
            duration: 3,
            description: '持续3回合，我方场上修士生命值+2，获得嘲讽',
            avatar: '🛡️',
            category: '防御',
            onActivate: (game, player) => {
                player.field.forEach(c => {
                    c.health += 2;
                    c.maxHealth += 2;
                    c.taunt = true;
                });
                return '九天玄罡阵展开，万法不侵';
            },
            onExpire: (game, player) => {
                return '九天玄罡阵崩溃';
            }
        },
        
        // 回复阵法
        {
            id: 'healing_formation',
            name: '回春阵',
            type: 'formation',
            realm: 3,
            cost: 3,
            duration: 3,
            description: '持续3回合，每回合开始时为英雄恢复2点生命',
            avatar: '💚',
            category: '回复',
            onTurnStart: (game, player) => {
                player.heal(2);
                return '回春阵生效，生命恢复';
            },
            onActivate: (game, player) => {
                player.heal(3);
                return '回春阵启动，万物复苏';
            },
            onExpire: (game, player) => {
                return '回春阵消散';
            }
        },
        
        // 控制阵法
        {
            id: 'confusion_formation',
            name: '迷踪幻阵',
            type: 'formation',
            realm: 5,
            cost: 4,
            duration: 2,
            description: '持续2回合，敌方场上所有修士攻击力-1（新召唤的也受影响）',
            avatar: '🌫️',
            category: '控制',
            // 光环效果：每回合开始时对敌方场上所有随从施加debuff
            onTurnStart: (game, player, formation) => {
                const opponent = game.getOpponent(player);
                opponent.field.forEach(c => {
                    // 只降低一次（通过标记判断）
                    if (!c.confusionApplied) {
                        c.attack = Math.max(0, c.attack - 1);
                        c.confusionApplied = true;
                    }
                });
                return '迷踪幻阵持续生效，敌方攻击力被压制';
            },
            onActivate: (game, player) => {
                const opponent = game.getOpponent(player);
                opponent.field.forEach(c => {
                    if (!c.confusionApplied) {
                        c.attack = Math.max(0, c.attack - 1);
                        c.confusionApplied = true;
                    }
                });
                return '迷踪幻阵笼罩敌阵，敌方攻击力-1';
            },
            onExpire: (game, player) => {
                const opponent = game.getOpponent(player);
                opponent.field.forEach(c => {
                    if (c.confusionApplied) {
                        c.attack += 1; // 恢复攻击力
                        c.confusionApplied = false;
                    }
                });
                return '迷踪幻阵消散，敌方恢复正常';
            }
        },
        
        // 特殊阵法 - 逆转阴阳
        {
            id: 'yin_yang_reversal',
            name: '逆转阴阳阵',
            type: 'formation',
            realm: 7,
            cost: 6,
            duration: 1,
            description: '持续1回合，本回合受到的所有伤害转化为治疗',
            avatar: '☯️',
            category: '特殊',
            onActivate: (game, player) => {
                player.damageToHeal = true;
                return '逆转阴阳，化伤为疗';
            },
            onExpire: (game, player) => {
                player.damageToHeal = false;
                return '阴阳阵消散，恢复正常';
            }
        },
        
        // 小说经典 - 颠倒五行阵
        {
            id: 'reversed_five_elements',
            name: '颠倒五行阵',
            type: 'formation',
            realm: 5,
            cost: 5,
            duration: 3,
            description: '持续3回合，敌方施放法术时受到2点反噬',
            avatar: '🔄',
            category: '反击',
            onActivate: (game, player) => {
                return '颠倒五行阵布下，法术反噬';
            },
            onExpire: (game, player) => {
                return '颠倒五行阵失效';
            }
        },
        
        // 小说经典 - 大庚剑阵
        {
            id: 'dage_sword_formation',
            name: '大庚剑阵',
            type: 'formation',
            realm: 8,
            cost: 7,
            duration: 2,
            description: '持续2回合，每回合对敌方全体造成3点伤害',
            avatar: '🗡️',
            category: '攻击',
            onTurnStart: (game, player) => {
                const opponent = game.getOpponent(player);
                opponent.field.forEach(c => c.takeDamage(3));
                opponent.takeDamage(3);
                return '大庚剑阵发动，万剑齐发！';
            },
            onActivate: (game, player) => {
                return '大庚剑阵布成，杀气冲霄';
            },
            onExpire: (game, player) => {
                return '大庚剑阵剑气耗尽';
            }
        },
        
        // 小说经典 - 风雷阵
        {
            id: 'wind_thunder_formation',
            name: '风雷阵',
            type: 'formation',
            realm: 6,
            cost: 5,
            duration: 3,
            description: '持续3回合，我方雷属性修士攻击力+2，攻击时造成连锁闪电',
            avatar: '⚡',
            category: '属性强化',
            onTurnStart: (game, player) => {
                player.field.forEach(c => {
                    if (c.spiritRoot === '雷') {
                        c.chainLightning = true;
                    }
                });
                return '风雷阵呼啸';
            },
            onActivate: (game, player) => {
                return '风雷阵起，雷霆万钧';
            },
            onExpire: (game, player) => {
                player.field.forEach(c => {
                    c.chainLightning = false;
                });
                return '风雷平息';
            }
        }
    ],

    // ========== 灵宠卡 ==========
    pets: [
        {
            id: 'gold_devourer',
            name: '噬金虫',
            type: 'pet',
            realm: 2,
            cost: 2,
            attack: 1,
            health: 2,
            description: '攻击时获得+1/+1',
            avatar: '🐛',
            onAttack: (game, attacker, target) => {
                attacker.attack += 1;
                attacker.health += 1;
                return '噬金虫吞噬金属成长';
            }
        },
        {
            id: 'blood_spider',
            name: '血玉蜘蛛',
            type: 'pet',
            realm: 4,
            cost: 4,
            attack: 3,
            health: 4,
            description: '剧毒，攻击时使目标中毒（每回合-1生命）',
            avatar: '🕷️',
            onAttack: (game, attacker, target) => {
                target.poisoned = true;
                return '血玉蜘蛛注入毒液';
            }
        },
        {
            id: 'soul_beast',
            name: '啼魂兽',
            type: 'pet',
            realm: 6,
            cost: 6,
            attack: 5,
            health: 5,
            description: '对鬼修伤害翻倍',
            avatar: '👻',
            onAttack: (game, attacker, target) => {
                if (target.spiritRoot === '阴' || target.type === 'ghost') {
                    target.takeDamage(attacker.attack); // 额外伤害
                    return '啼魂兽克制鬼物！';
                }
            }
        },
        // 新增灵宠
        {
            id: 'turtle_gui',
            name: '圭灵',
            type: 'pet',
            realm: 5,
            cost: 5,
            attack: 3,
            health: 7,
            description: '玄龟后裔，生命值高，受到的伤害-1',
            avatar: '🐢',
            onPlay: (game, player) => {
                // 添加减伤效果（需要在takeDamage中处理）
                return '圭灵加入战斗，防御姿态';
            }
        },
        {
            id: 'frost_worm',
            name: '六翼霜蚣',
            type: 'pet',
            realm: 7,
            cost: 7,
            attack: 6,
            health: 5,
            description: '冰属性真灵，攻击时冻结目标',
            avatar: '🦋',
            onAttack: (game, attacker, target) => {
                target.frozen = true;
                return '六翼霜蚣冻结目标';
            }
        },
        {
            id: 'thunder_leopard',
            name: '豹麟兽',
            type: 'pet',
            realm: 4,
            cost: 4,
            attack: 4,
            health: 3,
            description: '麒麟后裔，风雷双属性，出场时造成2点伤害',
            avatar: '🦁',
            onPlay: (game, player) => {
                const opponent = game.getOpponent(player);
                opponent.takeDamage(2);
                return '豹麟兽召唤风雷';
            }
        },
        {
            id: 'earth_dragon',
            name: '土甲龙',
            type: 'pet',
            realm: 3,
            cost: 3,
            attack: 2,
            health: 4,
            description: '擅长遁地，无法被法术指定为目标',
            avatar: '🐲',
            // 这个效果需要在法术选择目标时处理
        },
        {
            id: 'snow_silkworm',
            name: '雪晶蚕',
            type: 'pet',
            realm: 2,
            cost: 2,
            attack: 1,
            health: 3,
            description: '吐丝困敌，攻击时使目标攻击力-1',
            avatar: '🐛',
            onAttack: (game, attacker, target) => {
                if (target.attack > 0) {
                    target.attack -= 1;
                    return '雪晶蚕削弱目标攻击力';
                }
            }
        },
        {
            id: 'black_wind_beast',
            name: '裂风兽',
            type: 'pet',
            realm: 5,
            cost: 5,
            attack: 5,
            health: 4,
            description: '风属性妖兽，攻击两次',
            avatar: '🦅',
            onAttack: (game, attacker, target) => {
                // 需要在攻击逻辑中处理两次攻击
                return '裂风兽快速攻击';
            }
        },
        // 韩立专属灵宠 - 噬金虫进阶
        {
            id: 'gold_devourer_queen',
            name: '噬金虫王',
            type: 'pet',
            realm: 6,
            cost: 6,
            attack: 3,
            health: 5,
            description: '韩立本命灵宠，攻击时获得+2/+2并恢复2点生命',
            avatar: '👑',
            onAttack: (game, attacker, target) => {
                attacker.attack += 2;
                attacker.health += 2;
                attacker.maxHealth += 2;
                return '噬金虫王吞噬金属，快速成长';
            }
        },
        // 银月专属灵宠
        {
            id: 'silver_fox',
            name: '银月狐',
            type: 'pet',
            realm: 4,
            cost: 4,
            attack: 3,
            health: 4,
            description: '银月本命妖兽，出场时抽一张牌',
            avatar: '🦊',
            onPlay: (game, player) => {
                player.draw(1);
                return '银月狐幻化，获得卡牌';
            }
        },
        // 南宫婉专属灵宠
        {
            id: 'moon_rabbit',
            name: '月兔',
            type: 'pet',
            realm: 3,
            cost: 3,
            attack: 2,
            health: 4,
            description: '掩月宗灵宠，每回合开始时恢复1点生命',
            avatar: '🐰',
            onTurnStart: (game, player, creature) => {
                if (creature.health < creature.maxHealth) {
                    creature.health = Math.min(creature.health + 1, creature.maxHealth);
                    return '月兔吸收月华，恢复生命';
                }
            }
        }
    ]
};

// 获取所有卡牌（用于构建卡组）
function getAllCards() {
    const allCards = [];
    Object.values(CARD_DATABASE).forEach(category => {
        allCards.push(...category);
    });
    return allCards;
}

// 根据境界筛选卡牌
function getCardsByRealm(realm) {
    return getAllCards().filter(card => card.realm <= realm);
}

// 根据类型筛选卡牌
function getCardsByType(type) {
    return CARD_DATABASE[type] || [];
}
