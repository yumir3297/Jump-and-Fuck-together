const GAME_CONFIG = {
  appName: '友尽又贴贴',
  version: '0.1.0-demo',
  targetFps: 30,
  fixedDeltaMs: 1000 / 30,
  designWidth: 1334,
  designHeight: 750,
  backgroundColor: '#f9f2df',
  colors: {
    bgTop: '#f7ddb8',
    bgBottom: '#f8f8ef',
    panel: '#fff8ef',
    panelBorder: '#5f4b32',
    text: '#3d2a1f',
    muted: '#8b6b52',
    key: '#f6bf3c',
    keyGlow: '#ffd56a',
    danger: '#ff6262',
    success: '#45b36b',
    ropeNormal: '#8f724e',
    ropeTight: '#f7b955',
    ropeDanger: '#ff5f7f'
  },
  world: {
    gravity: 0.82,
    moveSpeed: 4.3,
    anchorMoveSpeed: 1.25,
    airMoveSpeed: 3.55,
    jumpVelocity: -11.8,
    doubleJumpVelocity: -10.4,
    maxFallSpeed: 18,
    friction: 0.76,
    airFriction: 0.92,
    cameraLerp: 0.16,
    killY: 920,
    checkpointReviveYOffset: 0
  },
  player: {
    width: 28,
    height: 42,
    pickupRange: 58,
    teammateBumpRange: 34,
    coyoteFrames: 4,
    jumpBufferFrames: 5,
    anchorMinMs: 220
  },
  ui: {
    safePadding: 24,
    topBarHeight: 78,
    buttonRadius: 42,
    buttonGap: 18,
    overlayAlpha: 0.72,
    progressBarWidth: 280,
    intimacyBarWidth: 220
  },
  network: {
    inputDelayFrames: 2,
    maxReconnectMs: 3000,
    simulatedLatencyFrames: [0, 1, 2],
    packetLossRate: 0.02
  },
  gameplay: {
    levelTimeLimitSec: 240,
    defaultPlayerCount: 2,
    maxPlayers: 4
  },
  modeOptions: [
    { key: 'solo', label: '单人模拟', playerCount: 1 },
    { key: 'duo', label: '双人模拟', playerCount: 2 },
    { key: 'trio', label: '三人模拟', playerCount: 3 },
    { key: 'squad', label: '四人模拟', playerCount: 4 },
    { key: 'create', label: '创建房间', playerCount: 2 },
    { key: 'join', label: '加入房间', playerCount: 2 }
  ],
  playerProfiles: [
    { id: 'p1', name: '桃桃', color: '#ff7c8f', accent: '#fff0f3' },
    { id: 'p2', name: '栗栗', color: '#5ca4ff', accent: '#eef5ff' },
    { id: 'p3', name: '柚柚', color: '#66c96f', accent: '#effff0' },
    { id: 'p4', name: '莓莓', color: '#f7a94a', accent: '#fff7ea' }
  ],
  analyticsEvents: [
    'app_launch',
    'loading_complete',
    'main_menu_view',
    'mode_selected',
    'room_create',
    'room_join',
    'player_ready',
    'game_start',
    'tutorial_step_complete',
    'player_death',
    'team_death',
    'reward_ad_offer',
    'reward_ad_show',
    'reward_ad_complete',
    'level_complete',
    'result_view',
    'share_click',
    'replay_click'
  ]
};

module.exports = {
  GAME_CONFIG
};
