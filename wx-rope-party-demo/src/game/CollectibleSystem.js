const { BALANCE_CONFIG } = require('../config/balanceConfig');
const { distance } = require('../utils/math');

class CollectibleSystem {
  constructor(intimacySystem) {
    this.intimacySystem = intimacySystem;
    this.items = [];
    this.teamState = null;
  }

  loadLevel(level) {
    this.items = JSON.parse(JSON.stringify(level.collectibles || []));
    this.teamState = {
      hasKey: false,
      keyCount: 0,
      collectedCount: 0,
      friendshipCrownCharges: 0,
      summonRingCount: 0,
      easterEggCount: 0
    };
  }

  getTeamState() {
    return this.teamState;
  }

  update(players, feedback) {
    for (let i = 0; i < this.items.length; i += 1) {
      const item = this.items[i];
      if (item.collected) {
        continue;
      }
      if (item.unlockIntimacy && this.intimacySystem.teamBond < item.unlockIntimacy) {
        continue;
      }

      for (let j = 0; j < players.length; j += 1) {
        const player = players[j];
        if (!player.isAlive) {
          continue;
        }
        const radius =
          item.type === 'DoorKey'
            ? BALANCE_CONFIG.collectibles.keyPickupRadius
            : BALANCE_CONFIG.collectibles.bondPickupRadius;
        if (distance(player.position, { x: item.x, y: item.y }) > radius) {
          continue;
        }

        item.collected = true;
        player.collectedCount += 1;
        this.teamState.collectedCount += 1;
        this.handleCollect(item, player, feedback);
        break;
      }
    }
  }

  handleCollect(item, player, feedback) {
    if (item.type === 'DoorKey') {
      this.teamState.hasKey = true;
      this.teamState.keyCount += 1;
      player.hasKey = true;
      if (feedback) {
        feedback({
          type: 'dangerText',
          text: '钥匙到手',
          x: player.position.x,
          y: player.position.y - player.height - 26,
          color: '#f6bf3c'
        });
      }
      return;
    }

    if (item.type === 'BondHeart' || item.type === 'BondFlower' || item.type === 'BondStamp') {
      this.intimacySystem.addSharedBond(item.value || BALANCE_CONFIG.intimacy.sharedCollect, 'bond_collect', []);
      if (feedback) {
        feedback({
          type: 'dangerText',
          text: '默契 +3',
          x: player.position.x,
          y: player.position.y - player.height - 26,
          color: '#ff7c8f'
        });
      }
      return;
    }

    if (item.type === 'FriendshipCrown') {
      this.teamState.friendshipCrownCharges += 1;
      if (feedback) {
        feedback({
          type: 'dangerText',
          text: '花冠护命 x1',
          x: player.position.x,
          y: player.position.y - player.height - 24,
          color: '#45b36b'
        });
      }
      return;
    }

    if (item.type === 'SummonRing') {
      this.teamState.summonRingCount += 1;
      this.intimacySystem.addSharedBond(2, 'summon_ring', []);
      if (feedback) {
        feedback({
          type: 'dangerText',
          text: '召唤戒指到手',
          x: player.position.x,
          y: player.position.y - player.height - 24,
          color: '#5ca4ff'
        });
      }
      return;
    }

    if (item.type === 'EasterEgg') {
      this.teamState.easterEggCount += 1;
      this.intimacySystem.addSharedBond(4, 'easter_egg', []);
      if (feedback) {
        feedback({
          type: 'dangerText',
          text: '彩蛋发现！',
          x: player.position.x,
          y: player.position.y - player.height - 24,
          color: '#7f6edb'
        });
      }
    }
  }

  render(renderer) {
    for (let i = 0; i < this.items.length; i += 1) {
      const item = this.items[i];
      if (item.collected) {
        continue;
      }
      if (item.unlockIntimacy && this.intimacySystem.teamBond < item.unlockIntimacy) {
        continue;
      }
      const screen = renderer.worldToScreen({ x: item.x, y: item.y });
      if (item.type === 'DoorKey') {
        renderer.drawCircle(screen.x, screen.y, 12, '#f6bf3c', '#8d6200', 2);
        renderer.drawText('钥', screen.x, screen.y + 6, {
          align: 'center',
          font: '18px sans-serif',
          color: '#5b4200'
        });
      } else if (item.type === 'BondHeart') {
        renderer.drawText('❤', screen.x, screen.y + 8, {
          align: 'center',
          font: '28px sans-serif',
          color: '#ff6a8e'
        });
      } else if (item.type === 'BondFlower') {
        renderer.drawText('✿', screen.x, screen.y + 8, {
          align: 'center',
          font: '26px sans-serif',
          color: '#ff89a0'
        });
      } else if (item.type === 'BondStamp') {
        renderer.drawText('※', screen.x, screen.y + 8, {
          align: 'center',
          font: '26px sans-serif',
          color: '#ff89a0'
        });
      } else if (item.type === 'FriendshipCrown') {
        renderer.drawText('♕', screen.x, screen.y + 8, {
          align: 'center',
          font: '28px sans-serif',
          color: '#45b36b'
        });
      } else if (item.type === 'SummonRing') {
        renderer.drawText('◌', screen.x, screen.y + 8, {
          align: 'center',
          font: '28px sans-serif',
          color: '#5ca4ff'
        });
      } else if (item.type === 'EasterEgg') {
        renderer.drawText('★', screen.x, screen.y + 8, {
          align: 'center',
          font: '26px sans-serif',
          color: '#7f6edb'
        });
      }
    }
  }
}

module.exports = {
  CollectibleSystem
};
