const fs = require('fs');

import { Group, CardType, BuyingStrategy } from './types';
import {Player, PlayerConfig} from './player'
import {Tile, PropertyTile, CardTile, FineTile, StationTile} from './tiles'
import {Logger} from './logger';

const boardData = JSON.parse(fs.readFileSync('data/board.json'));

let tiles: Tile[] = [];

const populateTiles = () => {
    tiles = [];
    boardData.forEach((tile: { type: string; name: string; cost: number; color: string; rent: number[], group: number[], house: number }) => {
        switch(tile.type) {
            case 'property':
                tiles.push(new PropertyTile(tile.name, Group.brown, tile.cost, tile.rent, tile.house))
                break
            case 'community-chest':
                tiles.push(new CardTile(tile.name, CardType.community))
                break
            case 'chance':
                tiles.push(new CardTile(tile.name, CardType.chance))
                break
            case 'tax':
                tiles.push(new FineTile(tile.name, tile.cost))
                break
            case 'railroad':
                tiles.push(new StationTile(tile.name, Group.station, tile.cost, [25, 50, 100, 200]))
                break;
            default:
                tiles.push(new Tile(tile.name))
                break
        }
    });
}

let logger: Logger;

const playGame = async (players: Player[], maxTurns?: number) => {

    return new Promise<string>(res => {
        populateTiles();
        let activePlayers = players;
        maxTurns = maxTurns ? maxTurns : Infinity;

        for (let turn = 1; turn <= maxTurns; turn+=3) {
            let turnOffset = 0;
            for (let player of activePlayers) {

                player.playTurn(turn+turnOffset)
                turnOffset++;
                
                for (let player of activePlayers) {
                    if (player.bankrupt) {
                        activePlayers = activePlayers.filter(plr => plr.name != player.name)
                    }
                    if (activePlayers.length === 1) {
                        const winner = activePlayers[0];
                        logger.log(`${winner.name} has won the game!`)
                        return
                    }
                }
            }
        }
        logger.log(`The game ended in a stalemate after ${maxTurns} turns!`) 
        const winner = activePlayers.reduce((plr1, plr2) => (plr1.balance > plr2.balance) ? plr1 : plr2);
        logger.log(`${winner.name} wins with the highest final balance`);
        res(winner.name)
    });
}

const simulateGames = async (noGames: number, maxTurns: number, playerConfigs: PlayerConfig[]) => {
    console.log('Simulating games...')

    for (let gameNo = 1; gameNo <= noGames; gameNo++) {
        logger = new Logger(false);
        
        let players: Player[];
        players = [];
        for (let playerConfig of playerConfigs) {
            const player = playerConfig.createPlayer();
            players.push(player)
        };

        logger = new Logger(false)
        const winner = await playGame(players, maxTurns);
        console.log(`${winner} has won `)
    }
}

logger = new Logger(true)
const playerConfigs: PlayerConfig[] = [
    new PlayerConfig('Player1', 500, BuyingStrategy.random),
    new PlayerConfig('Player2', 500, BuyingStrategy.random),
    new PlayerConfig('Player3', 500, BuyingStrategy.random)
]

/*
playGame([
    new Player('Bob', 5000, BuyingStrategy.always),
    new Player('Bob2', 5000, BuyingStrategy.always),
    new Player('Bob3', 5000, BuyingStrategy.always)
], 1000)
*/

simulateGames(20, 100, playerConfigs)

export {tiles, logger};