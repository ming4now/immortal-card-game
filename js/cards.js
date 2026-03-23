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
        // 练气期
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
            avatar: '👤'
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
            avatar: '👹'
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
                attacker.heal(1);
                return '魔道筑基吸取生命力';
            }
        },
        // 结丹期
        {
            id: 'core_ancestor',
            name: '结丹老祖',
            type: 'cultivator',
            realm: 7,
            cost: 7,
            attack: 7,
            health: 7,
            spiritRoot: '土',
            description: '一方霸主',
            avatar: '👑',
            battlecry: () => '对敌方英雄造成3点伤害',
            onPlay: (game, player) => {
                const opponent = game.getOpponent(player);
                opponent.takeDamage(3);
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

    // ========== 法宝卡 ==========
    treasures: [
        {
            id: 'flying_sword',
            name: '飞剑',
            type: 'treasure',
            realm: 2,
            cost: 2,
            description: '装备修士攻击力+2',
            avatar: '🗡️',
            equipEffect: (creature) => {
                creature.attack += 2;
            }
        },
        {
            id: 'spirit_armor',
            name: '灵甲',
            type: 'treasure',
            realm: 3,
            cost: 3,
            description: '装备修士生命值+3',
            avatar: '🛡️',
            equipEffect: (creature) => {
                creature.health += 3;
                creature.maxHealth += 3;
            }
        },
        {
            id: 'storage_bag',
            name: '储物袋',
            type: 'treasure',
            realm: 2,
            cost: 1,
            description: '抽一张牌',
            avatar: '👜',
            effect: (game, player) => {
                player.draw(1);
                return '从储物袋取出物品';
            }
        },
        {
            id: 'golden_cup',
            name: '金蚨子母刃',
            type: 'treasure',
            realm: 6,
            cost: 5,
            description: '召唤3个1/1的子刃',
            avatar: '🏆',
            effect: (game, player) => {
                for (let i = 0; i < 3; i++) {
                    player.summon({
                        name: '子刃',
                        attack: 1,
                        health: 1,
                        avatar: '🔪'
                    });
                }
                return '金蚨子母刃分化！';
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
        }
    ],

    // ========== 阵法卡 ==========
    formations: [
        {
            id: 'spirit_gathering',
            name: '聚灵阵',
            type: 'formation',
            realm: 3,
            cost: 3,
            description: '每回合开始时额外获得1点灵石',
            avatar: '⭕',
            onTurnStart: (game, player) => {
                player.gainMana(1);
                return '聚灵阵提供额外灵石';
            }
        },
        {
            id: 'sword_formation',
            name: '剑阵',
            type: 'formation',
            realm: 5,
            cost: 4,
            description: '我方场上修士攻击力+1',
            avatar: '⚔️',
            auraEffect: (player) => {
                player.field.forEach(c => c.attack += 1);
            }
        },
        {
            id: 'defense_formation',
            name: '金刚阵',
            type: 'formation',
            realm: 4,
            cost: 3,
            description: '我方英雄获得3点护甲',
            avatar: '🔰',
            effect: (game, player) => {
                player.gainArmor(3);
                return '金刚阵护体';
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
