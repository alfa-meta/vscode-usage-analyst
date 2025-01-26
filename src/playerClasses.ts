export interface PlayerLevel {
    level: number;
    xP: number;
    mageLevel: number;
    mageXP: number;
    rogueLevel: number;
    rogueXP: number;
    spiritualistLevel: number;
    spiritualistXP: number;
    warriorLevel: number;
    warriorXP: number;
}

export interface PlayerStats {
    hitPoints: 100,
    manaPoints: 100,
    energyPoints: 100,

    strength: 5,
    agility: 5,
    intellect: 5,
    vitality: 5,
    spirit: 5
}


type hybridClassesDictionary = {
    0: "Classless",
    10: "Exile",
    30: "Vagabond",
    50: "Seeker",
    80: "Warden",
    120: "Ascended",
}

type mageClassesDictionary = {
    1: "Magician",
    10: "Wizard",
    30: "Arcanist",
    50: "Archmage",
    80: "High Archmage",
    120: "Sorcerer Supreme",
}

type rogueClassesDictionary = {
    1: "Thief",
    10: "Trickster",
    30: "Bounty Hunter",
    50: "Assassin",
    80: "Phantom",
    120: "Mastermind",
}

type warriorClassesDictionary = {
    1: "Fighter",
    10: "Barbarian",
    30: "Berserker",
    50: "Warbringer",
    80: "Warlord",
    120: "Eternal Champion",
}

type spirtualistClassesDictionary = {
    1: "Priest",
    10: "Holy Healer",
    30: "Divine Enchanter",
    50: "Lightbearer",
    80: "Harbringer of Light",
    120: "Divine Apostle",
}

type mageRogueClassesDictionary = {
    10: "Shadowcaster",
    30: "Ghostblade",
    50: "Dark Mage",
    80: "Night Lord",
    120: "Shadow Monarch"
}

type mageWarriorClassesDictionary = {
    10: "Magic Knight",
    30: "Mage Blade",
    50: "Battle Mage",
    80: "Warcaster",
    120: "Arch Wizard of Royal Knights"
}

type mageSpiritualistClassesDictionary = {
    10: "Druid",
    30: "Natures Guide",
    50: "War Druid",
    80: "Arch Druid",
    120: "Emperor of Nature",
}

type rogueSpiritualistClassesDictionary = {
    10: "Brawler",
    30: "Striker",
    50: "Monk",
    80: "Fist of Heavens",
    120: "God Hand"
}

type rogueWarriorClassesDictionary = {
    10: "Swashbuckler",
    30: "Duelist",
    50: "Gladiator",
    80: "Battle Champion",
    120: "Master of the Arena",
}

type warriorSpiritualistClassesDictionary = {
    10: "Paladin",
    30: "Protector of Light",
    50: "Justicar",
    80: "Chosen Champion",
    120: "Divine Inquisition"
}