import { Group, CardType } from "./types";

class Tile {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    landedOn(player: Player) {
        console.log(`${player.name} has landed on ${this.name}`)
    }
}

class PropertyTile extends Tile{
    group: Group;
    cost: number;
    owner: Player | false;

    constructor(name: string, group: Group, cost: number) {
        super(name);
        this.group = group;
        this.cost = cost;
        
        this.owner = false;
    }

    private purchase(player: Player) {
        if (!this.owner) {
            if (player.balance >= this.cost) {
                console.log(`${player.name} has bought ${this.name} for ${this.cost}`)
                player.balance -= this.cost;
                this.owner = player;
            } else {
                console.log(`${player.name} did not have enough money to purchase ${this.name}`)
            }
        }
    }

    private collectRent(player: Player) {
        if (this.owner && this.owner != player) {
            console.log(`${player.name} has landed on ${this.name} owned by ${this.owner.name}`)
        }
    }

    private upgrade(player: Player) {
        if (this.owner === player) {
            console.log(`${player.name} has built a house on ${this.name}`)
        }
    }
    
    landedOn(player: Player) {
        this.collectRent(player);
        this.upgrade(player);
        this.purchase(player);
    }
}

class StationTile extends Tile {
    cost: number;

    constructor(name: string, cost: number) {
        super(name);
        this.cost = cost;
    }
}

class CardTile extends Tile {
    type: CardType;

    constructor(name: string, type: CardType) {
        super(name);
        this.type = type;
    }

    landedOn(player: Player) {
        console.log(`${player.name} has received a ${this.name} card!`)
    }
}

class FineTile extends Tile {
    value: number;

    constructor(name: string, value: number) {
        super(name),
        this.value = value;
    }

    private finePlayer(player: Player) {
        if (player.balance >= this.value) {
            console.log(`${player.name} has landed on ${this.name} and received a $${this.value} fine!`)
        } else {
            console.log(`${player.name} has landed on ${this.name} and is unable to pay the fine`)
            player.declareBankrupt();
        }
    }

    landedOn(player: Player) {
        this.finePlayer(player); 
    }
}

class JailTile extends Tile {
    constructor(name: string) {
        super(name)
    }

    landedOn(player: Player) {
        console.log(`${player.name} has been sent to jail!`);
        player.position = tiles.findIndex(tile => tile.name === 'Jail');
        player.jail();
        tiles[player.position].landedOn(player);
    }
}

class Player {
    name: string;
    position: number;
    private _balance: number;
    bankrupt: boolean;
    jailed: number;

    public get balance() {
        return this._balance;
    }

    public set balance(balance: number) {
        this._balance = balance;
    }

    constructor(name: string, balance: number) {
        this.name = name,
        this.position = 0;
        this._balance = balance;
        this.bankrupt = false;
        this.jailed = 0;
    }

    jail() {
        this.jailed = 1;
    }

    private checkIfPassedGo() {
        if (this.position >= tiles.length) {
            console.log(`${this.name} has passed go and recieved $200 from the bank!`);
            this.position = this.position - tiles.length;
            this.balance += 200;
        }
    }

    escapeJail() {
        if (!this.jailed) return;

        this.jailed++;

        if (this.jailed === 5) {
            console.log(`${this.name} has escaped jail after 3 turns!`)
            this.jailed = 0;
        } else {
            const roll1 = Math.floor(6*Math.random())+1;  
            const roll2 = Math.floor(6*Math.random())+1;
            if (roll1 === roll2) {
                console.log(`${this.name} has rolled double ${roll1}'s and has escaped jail`)
                this.jailed = 0;
            } else {
                console.log(`${this.name} has failed to roll doubles and escape jail`)
            }
        }
    }

    playTurn(turn: number) {
        if (!this.bankrupt) {
            if (this.jailed) {
                this.escapeJail()
            } else {
                this.rollDice(turn);
                this.checkIfPassedGo();
                tiles[this.position].landedOn(this);
            }
        }
    }

    rollDice(turn: number) {
        const roll = Math.floor(6*Math.random())+1;  
        this.position += roll;
        console.log(`[${turn}] ${this.name} rolled a ${roll}!`);
    }

    declareBankrupt() {
        console.log(`${this.name} has been declared bankrupt!`)
        this.bankrupt = true;
    }
}

const fs = require('fs');
let rawData = fs.readFileSync('data/board.json');
let boardData = JSON.parse(rawData)

let tiles: Tile[] = [];

boardData.forEach((tile: { type: string; name: string; cost: number; }) => {
    switch(tile.type) {
        case 'property':
            tiles.push(new PropertyTile(tile.name, Group.brown, tile.cost))
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
        default:
            tiles.push(new Tile(tile.name))
            break
    }
});

const player1 = new Player("Player 1", 200)
const player2 = new Player("Player 2", 200)

const noTurns = 100;

function gameLoop(players: Player[]) {

    let activePlayers = players;

    for (let i=0; i < noTurns; i++) {

        if (i%2===0) {
            players[0].playTurn(i+1);
        } else {
            players[1].playTurn(i+1);
        }

        for (let i = 0; i < activePlayers.length; i++) {
            const player = activePlayers[i]
            if (player.bankrupt) {
                activePlayers = activePlayers.filter(plr => plr.name != player.name)
            }
            if (activePlayers.length === 1) {
                const winner = activePlayers[0];
                console.log(`${winner.name} has won the game!`);
                return
            }
        }
    } 
}

gameLoop([player1, player2]);
