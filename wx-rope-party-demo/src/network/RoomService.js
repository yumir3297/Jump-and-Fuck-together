const { GAME_CONFIG } = require('../config/gameConfig');

function randomRoomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

class RoomService {
  constructor(analyticsService) {
    this.analyticsService = analyticsService;
    this.currentRoom = null;
  }

  createRoom(modeKey, playerCount) {
    this.currentRoom = {
      roomId: 'room-' + Date.now(),
      roomCode: randomRoomCode(),
      modeKey,
      ownerId: 'p1',
      status: 'idle',
      players: []
    };

    for (let i = 0; i < playerCount; i += 1) {
      const profile = GAME_CONFIG.playerProfiles[i];
      this.currentRoom.players.push({
        id: profile.id,
        name: profile.name,
        ready: i !== 0,
        disconnected: false,
        local: i < 2
      });
    }

    if (this.analyticsService) {
      this.analyticsService.track('room_create', {
        modeKey,
        roomCode: this.currentRoom.roomCode,
        playerCount
      });
    }
    return this.currentRoom;
  }

  joinRoom(roomCode, playerCount) {
    this.currentRoom = this.createRoom('join', playerCount);
    this.currentRoom.roomCode = roomCode || '888888';
    if (this.analyticsService) {
      this.analyticsService.track('room_join', {
        roomCode: this.currentRoom.roomCode
      });
    }
    return this.currentRoom;
  }

  toggleReady(playerId) {
    if (!this.currentRoom) {
      return null;
    }
    for (let i = 0; i < this.currentRoom.players.length; i += 1) {
      const player = this.currentRoom.players[i];
      if (player.id === playerId) {
        player.ready = !player.ready;
        if (this.analyticsService) {
          this.analyticsService.track('player_ready', {
            playerId,
            ready: player.ready
          });
        }
      }
    }
    return this.currentRoom;
  }

  canStart() {
    if (!this.currentRoom) {
      return false;
    }
    for (let i = 0; i < this.currentRoom.players.length; i += 1) {
      if (!this.currentRoom.players[i].ready) {
        return false;
      }
    }
    return true;
  }

  startGame() {
    if (!this.currentRoom) {
      return null;
    }
    this.currentRoom.status = 'started';
    return this.currentRoom;
  }

  markDisconnected(playerId, disconnected) {
    if (!this.currentRoom) {
      return;
    }
    for (let i = 0; i < this.currentRoom.players.length; i += 1) {
      if (this.currentRoom.players[i].id === playerId) {
        this.currentRoom.players[i].disconnected = disconnected;
      }
    }
  }

  getCurrentRoom() {
    return this.currentRoom;
  }
}

module.exports = {
  RoomService
};
