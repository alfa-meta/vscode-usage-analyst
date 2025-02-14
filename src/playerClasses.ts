class GameObject {
  playerObject: PlayerLevelsInterface;
  playerStats: PlayerStatsInterface;
  levelUpStats: PlayerStatsInterface;

  // Constructor
  constructor(playerClassName: PlayerStatsInterface) {
    this.playerObject = PlayerObject;
    this.playerStats = PlayerStats;
    this.levelUpStats = LevelUpStats;
  }
}

export interface GameInterface {
  playerObject: PlayerLevelsInterface;
  playerStats: PlayerStatsInterface;
  levelUpStats: PlayerStatsInterface;
  mageStats: PlayerStatsInterface;
  warriorStats: PlayerStatsInterface;
  rogueStats: PlayerStatsInterface;
  spiritualistStats: PlayerStatsInterface;
}

interface PlayerLevelsInterface {
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

const PlayerObject: PlayerLevelsInterface = {
  level: 0,
  xP: 0,
  mageLevel: 0,
  mageXP: 0,
  rogueLevel: 0,
  rogueXP: 0,
  spiritualistLevel: 0,
  spiritualistXP: 0,
  warriorLevel: 0,
  warriorXP: 0,
};

interface PlayerStatsInterface {
  hitPoints: number;
  manaPoints: number;
  energyPoints: number;

  strength: number;
  agility: number;
  intellect: number;
  vitality: number;
  spirit: number;
}

const PlayerStats: PlayerStatsInterface = {
  hitPoints: 100,
  manaPoints: 0,
  energyPoints: 0,

  strength: 5,
  agility: 5,
  intellect: 5,
  vitality: 5,
  spirit: 5,
};

const LevelUpStats: PlayerStatsInterface = {
  hitPoints: 5,
  manaPoints: 0,
  energyPoints: 0,

  strength: 1,
  agility: 1,
  intellect: 1,
  vitality: 1,
  spirit: 1,
};

const HybridLevelUpStats: PlayerStatsInterface = {
  // Total 10
  hitPoints: 4,
  manaPoints: 3,
  energyPoints: 3,

  //Total 20
  strength: 4,
  agility: 4,
  intellect: 4,
  vitality: 4,
  spirit: 4,
};

const MageLevelUpStats: PlayerStatsInterface = {
  hitPoints: 0,
  manaPoints: 5,
  energyPoints: 0,

  strength: 0,
  agility: 0,
  intellect: 5,
  vitality: 1,
  spirit: 4,
};

const RogueLevelUpStats: PlayerStatsInterface = {
  hitPoints: 0,
  manaPoints: 0,
  energyPoints: 5,

  strength: 2,
  agility: 5,
  intellect: 1,
  vitality: 2,
  spirit: 0,
};

const WarriorLevelUpStats: PlayerStatsInterface = {
  hitPoints: 5,
  manaPoints: 0,
  energyPoints: 0,

  strength: 5,
  agility: 2,
  intellect: 0,
  vitality: 3,
  spirit: 0,
};

const SpiritualistLevelUpStats: PlayerStatsInterface = {
  hitPoints: 2,
  manaPoints: 3,
  energyPoints: 0,

  strength: 0,
  agility: 0,
  intellect: 3,
  vitality: 2,
  spirit: 5,
};

type hybridClassesDictionary = {
  0: "Classless";
  10: "Exile";
  30: "Vagabond";
  50: "Seeker";
  80: "Warden";
  120: "Ascended";
};

type mageClassesDictionary = {
  1: "Magician";
  10: "Wizard";
  30: "Arcanist";
  50: "Archmage";
  80: "High Archmage";
  120: "Sorcerer Supreme";
};

type rogueClassesDictionary = {
  1: "Thief";
  10: "Trickster";
  30: "Bounty Hunter";
  50: "Assassin";
  80: "Phantom";
  120: "Mastermind";
};

type warriorClassesDictionary = {
  1: "Fighter";
  10: "Barbarian";
  30: "Berserker";
  50: "Warbringer";
  80: "Warlord";
  120: "Eternal Champion";
};

type spirtualistClassesDictionary = {
  1: "Priest";
  10: "Holy Healer";
  30: "Divine Enchanter";
  50: "Lightbearer";
  80: "Harbringer of Light";
  120: "Divine Apostle";
};

type mageRogueClassesDictionary = {
  10: "Shadowcaster";
  30: "Ghostblade";
  50: "Dark Mage";
  80: "Night Lord";
  120: "Shadow Monarch";
};

type mageWarriorClassesDictionary = {
  10: "Magic Knight";
  30: "Mage Blade";
  50: "Battle Mage";
  80: "Warcaster";
  120: "Arch Wizard of Royal Knights";
};

type mageSpiritualistClassesDictionary = {
  10: "Druid";
  30: "Natures Guide";
  50: "War Druid";
  80: "Arch Druid";
  120: "Emperor of Nature";
};

type rogueSpiritualistClassesDictionary = {
  10: "Brawler";
  30: "Striker";
  50: "Monk";
  80: "Fist of Heavens";
  120: "God Hand";
};

type rogueWarriorClassesDictionary = {
  10: "Swashbuckler";
  30: "Duelist";
  50: "Gladiator";
  80: "Battle Champion";
  120: "Master of the Arena";
};

type warriorSpiritualistClassesDictionary = {
  10: "Paladin";
  30: "Protector of Light";
  50: "Justicar";
  80: "Chosen Champion";
  120: "Divine Inquisition";
};
