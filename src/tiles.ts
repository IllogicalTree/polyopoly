import { Group, CardType, BuyingStrategy } from './types';
import {Player} from './player'

import {tiles, logger} from './index'

export class Tile {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    landedOn(player: Player) {
        logger.log(`${player.name} has landed on ${this.name}`)
    }
}

export class IncomeTile extends Tile {
    group: Group;
    cost: number;
    rent: number[];
    owner: Player | false;

    houses: number;

    constructor(name: string, group: Group, cost: number, rent: number[]) {
        super(name);
        this.group = group;
        this.cost = cost;
        this.rent = rent;

        this.houses = 0;
        this.owner = false;
    }

    private shouldPlayerPurchase(player: Player) {
        switch (player.buyingStrategy) {
            case BuyingStrategy.always:
                return true;
            case BuyingStrategy.never:
                return false;
            case BuyingStrategy.random:
                return Math.random() > .5;
        }
    }

    purchase(player: Player) {
        if (!this.owner) {
            if (this.shouldPlayerPurchase(player)) {
                if (player.balance >= this.cost) {
                    logger.log(`${player.name} has bought ${this.name} for $${this.cost}`)
                    player.balance -= this.cost;
                    this.owner = player;
                    player.ownedTiles.push(this);
                } else {
                    logger.log(`${player.name} did not have enough money to purchase ${this.name}`)
                }
            } else {
                logger.log(`${player.name} has opted not to purchase ${this.name}`)
            }
        }
    }

    collectRent(player: Player, rent: number) {
        if (this.owner && this.owner != player) {
            
            if (player.balance >= rent) {
                logger.log(`${player.name} has payed $${rent} for landing on ${this.name} owned by ${this.owner.name}`)
                player.balance -= rent;
            } else {
                logger.log(`${player.name} did not have enough money to pay ${this.owner.name}`);
                this.owner.balance += player.balance;
                player.declareBankrupt();
                player.ownedTiles.forEach(tile => {
                    tile.owner = false;
                    tile.houses = 0;
                })
            }
        }
    }
}

export class PropertyTile extends IncomeTile {

    houseCost: number;
    houses: number;

    constructor(name: string, group: Group, cost: number, rent: number[], house: number) {
        super(name, group, cost, rent);
        
        this.houseCost = house;
        this.houses = 0;
    }

    private upgrade(player: Player) {
        if (this.owner === player) {
            if (player.balance >= this.houseCost) {
                if (this.houses <= 4) {
                    logger.log(`${player.name} has built a house on ${this.name}`)
                    player.balance -= this.houseCost;
                    this.houses++;
                } else {
                    logger.log(`${player.name} already has the max number of houses on ${this.name}`)
                }
            } else {
                logger.log(`${player.name} can't afford to build a house on ${this.name}`)
            }
        }
    }

    private rentDue(): number {
        return this.rent[this.houses];
    }
    
    landedOn(player: Player) {
        this.collectRent(player, this.rentDue());
        this.upgrade(player);
        this.purchase(player);
    }
}

export class StationTile extends IncomeTile {
    constructor(name: string, group: Group, cost: number, rent: number[]) {
        super(name, group, cost, rent);
    }

    private stationsOwned(): IncomeTile[] {
        if (this.owner) {
            const ownedTiles: IncomeTile[] = this.owner.ownedTiles;
            const ownedStations = ownedTiles.filter(tile => tile.constructor.name === "StationTile");
            return ownedStations;
        }
        return [];
    }

    private rentDue(): number {
        const numStations = this.stationsOwned().length;
        return this.rent[numStations-1];
    }

    landedOn(player: Player) {
        this.collectRent(player, this.rentDue());
        this.purchase(player);
    }
}

export class CardTile extends Tile {
    type: CardType;

    constructor(name: string, type: CardType) {
        super(name);
        this.type = type;
    }

    landedOn(player: Player) {
        logger.log(`${player.name} has received a ${this.name} card!`)
    }
}

export class FineTile extends Tile {
    value: number;

    constructor(name: string, value: number) {
        super(name),
        this.value = value;
    }

    private finePlayer(player: Player) {
        if (player.balance >= this.value) {
            logger.log(`${player.name} has landed on ${this.name} and received a $${this.value} fine!`)
        } else {
            logger.log(`${player.name} has landed on ${this.name} and is unable to pay the fine`)
            player.declareBankrupt();
        }
    }

    landedOn(player: Player) {
        this.finePlayer(player); 
    }
}

export class JailTile extends Tile {
    constructor(name: string) {
        super(name)
    }

    landedOn(player: Player) {
        logger.log(`${player.name} has been sent to jail!`);
        player.position = tiles.findIndex(tile => tile.name === 'Jail');
        player.jail();
        tiles[player.position].landedOn(player);
    }
}