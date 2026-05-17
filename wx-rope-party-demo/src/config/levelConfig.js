const LEVEL_CONFIG = [
  {
    id: 'level-1',
    name: 'Level 1 - 贴贴热身',
    subtitle: '无感教程关',
    width: 1680,
    height: 750,
    cameraStartX: 0,
    spawnPoints: [
      { x: 110, y: 560 },
      { x: 155, y: 560 },
      { x: 200, y: 560 },
      { x: 245, y: 560 }
    ],
    solids: [
      { id: 'g1', x: 0, y: 560, width: 390, height: 190, color: '#c7b088' },
      { id: 'g2', x: 470, y: 560, width: 610, height: 190, color: '#c7b088' },
      { id: 'g3', x: 1140, y: 560, width: 540, height: 190, color: '#c7b088' },
      { id: 'high-step', x: 1180, y: 430, width: 130, height: 16, color: '#a9895f' }
    ],
    obstacles: [
      { id: 'lb-1', type: 'LowBarrier', x: 255, y: 508, width: 38, height: 52 },
      { id: 'pit-1', type: 'SmallPit', x: 390, y: 560, width: 80, height: 190 },
      { id: 'door-1', type: 'FinishDoor', x: 1505, y: 470, width: 70, height: 90, requiresKey: true }
    ],
    collectibles: [
      { id: 'bond-1', type: 'BondHeart', x: 565, y: 510, value: 3 },
      { id: 'key-1', type: 'DoorKey', x: 1238, y: 388, required: true }
    ],
    hints: [
      { id: 'h-move', x: 200, y: 465, text: '左右动一动', step: 'move' },
      { id: 'h-jump', x: 255, y: 455, text: '跳一下', step: 'jump' },
      { id: 'h-rope', x: 520, y: 455, text: '别把绳子绷太紧', step: 'rope' },
      { id: 'h-key', x: 1208, y: 330, text: '拿到钥匙', step: 'key' }
    ],
    checkpoints: [
      { x: 110, y: 560 },
      { x: 1140, y: 560 }
    ]
  },
  {
    id: 'level-2',
    name: 'Level 2 - 你丢我接',
    subtitle: '协作关',
    width: 1880,
    height: 750,
    cameraStartX: 0,
    spawnPoints: [
      { x: 110, y: 560 },
      { x: 150, y: 560 },
      { x: 190, y: 560 },
      { x: 230, y: 560 }
    ],
    solids: [
      { id: 'g1', x: 0, y: 560, width: 530, height: 190, color: '#c7b088' },
      { id: 'g2', x: 790, y: 560, width: 450, height: 190, color: '#c7b088' },
      { id: 'g3', x: 1380, y: 560, width: 500, height: 190, color: '#c7b088' },
      { id: 'high-platform', x: 1095, y: 352, width: 165, height: 16, color: '#a9895f' },
      { id: 'door-stand', x: 1570, y: 470, width: 90, height: 90, color: '#b99f6d' },
      // 将需要“先过去再拉”的深坑边缘改成阶梯斜坡，避免直角坑边卡住被拉回的队友。
      { id: 'pit-1-ramp-l1', x: 530, y: 592, width: 24, height: 158, color: '#b19368' },
      { id: 'pit-1-ramp-l2', x: 554, y: 620, width: 24, height: 130, color: '#b19368' },
      { id: 'pit-1-ramp-l3', x: 578, y: 648, width: 24, height: 102, color: '#b19368' },
      { id: 'pit-1-ramp-l4', x: 602, y: 676, width: 24, height: 74, color: '#b19368' },
      { id: 'pit-1-ramp-l5', x: 626, y: 704, width: 24, height: 46, color: '#b19368' },
      { id: 'pit-1-ramp-r1', x: 766, y: 592, width: 24, height: 158, color: '#b19368' },
      { id: 'pit-1-ramp-r2', x: 742, y: 620, width: 24, height: 130, color: '#b19368' },
      { id: 'pit-1-ramp-r3', x: 718, y: 648, width: 24, height: 102, color: '#b19368' },
      { id: 'pit-1-ramp-r4', x: 694, y: 676, width: 24, height: 74, color: '#b19368' },
      { id: 'pit-1-ramp-r5', x: 670, y: 704, width: 24, height: 46, color: '#b19368' }
    ],
    obstacles: [
      { id: 'hb-1', type: 'HighBarrier', x: 340, y: 430, width: 46, height: 130 },
      { id: 'pit-1', type: 'DeepPit', x: 530, y: 560, width: 260, height: 260 },
      { id: 'door-2', type: 'FinishDoor', x: 1600, y: 470, width: 72, height: 90, requiresKey: true }
    ],
    collectibles: [
      { id: 'bond-2', type: 'BondFlower', x: 870, y: 505, value: 3 },
      { id: 'key-2', type: 'DoorKey', x: 1175, y: 310, required: true },
      { id: 'ring-2', type: 'SummonRing', x: 1485, y: 518 }
    ],
    hints: [
      { id: 'h-carry', x: 332, y: 376, text: '抱起或丢上去', step: 'carry' },
      { id: 'h-pit', x: 638, y: 425, text: '一人先过去再拉', step: 'pull' },
      { id: 'h-key', x: 1160, y: 260, text: '高台有钥匙', step: 'throw' }
    ],
    checkpoints: [
      { x: 110, y: 560 },
      { x: 790, y: 560 },
      { x: 1380, y: 560 }
    ]
  },
  {
    id: 'level-3',
    name: 'Level 3 - 翻车合照',
    subtitle: '冲突和复活关',
    width: 2300,
    height: 750,
    cameraStartX: 0,
    spawnPoints: [
      { x: 100, y: 560 },
      { x: 140, y: 560 },
      { x: 180, y: 560 },
      { x: 220, y: 560 }
    ],
    solids: [
      { id: 'g1', x: 0, y: 560, width: 420, height: 190, color: '#c7b088' },
      { id: 'g2', x: 540, y: 560, width: 420, height: 190, color: '#c7b088' },
      { id: 'g3', x: 1180, y: 560, width: 470, height: 190, color: '#c7b088' },
      { id: 'g4', x: 1840, y: 560, width: 460, height: 190, color: '#c7b088' },
      { id: 'mid-platform', x: 1460, y: 390, width: 150, height: 16, color: '#a9895f' }
    ],
    obstacles: [
      {
        id: 'pit-3a',
        type: 'DeepPit',
        x: 420,
        y: 560,
        width: 120,
        height: 280
      },
      {
        id: 'mv-platform',
        type: 'MovingPlatform',
        x: 710,
        y: 470,
        width: 140,
        height: 16,
        axis: 'x',
        range: 110,
        speed: 1.4
      },
      {
        id: 'pit-3b',
        type: 'DeepPit',
        x: 960,
        y: 560,
        width: 220,
        height: 280
      },
      {
        id: 'sm-1',
        type: 'StaticMonster',
        x: 1290,
        y: 522,
        width: 44,
        height: 38
      },
      {
        id: 'mm-1',
        type: 'MovingMonster',
        x: 1500,
        y: 516,
        width: 44,
        height: 44,
        axis: 'x',
        range: 95,
        speed: 1.2
      },
      {
        id: 'sudden-1',
        type: 'SuddenMonster',
        x: 1730,
        y: 516,
        width: 44,
        height: 44,
        triggerX: 1660
      },
      {
        id: 'door-3',
        type: 'FinishDoor',
        x: 2140,
        y: 470,
        width: 72,
        height: 90,
        requiresKey: true
      }
    ],
    collectibles: [
      { id: 'key-3', type: 'DoorKey', x: 1525, y: 345, required: true },
      { id: 'bond-3', type: 'BondStamp', x: 610, y: 505, value: 3 },
      { id: 'crown-3', type: 'FriendshipCrown', x: 1240, y: 515 },
      {
        id: 'egg-3',
        type: 'EasterEgg',
        x: 1980,
        y: 505,
        unlockIntimacy: 18
      }
    ],
    hints: [
      { id: 'h-revive', x: 1030, y: 420, text: '掉下去可广告复活', step: 'revive' },
      { id: 'h-monster', x: 1510, y: 450, text: '怪物会送你回起点', step: 'monster' },
      { id: 'h-photo', x: 2080, y: 420, text: '过关后拍合照', step: 'finish' }
    ],
    checkpoints: [
      { x: 100, y: 560 },
      { x: 540, y: 560 },
      { x: 1180, y: 560 },
      { x: 1840, y: 560 }
    ]
  }
];

module.exports = {
  LEVEL_CONFIG
};
