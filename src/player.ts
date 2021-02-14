import { tiles, logger } from './index';
import { IncomeTile } from './tiles';
import { BuyingStrategy } from './types';

export class PlayerConfig {
    name: string;
    buyingStategy: BuyingStrategy
    startingBalance: number;
    
    constructor(name: string, startingBalance: number, buyingStategy: BuyingStrategy) {
        this.name = name,
        this.buyingStategy = buyingStategy,
        this.startingBalance = startingBalance;
    }

    createPlayer() {
        return (new Player(this.name, this.startingBalance, this.buyingStategy))
    }
}

export class Player {
    name: string;
    position: number;
    balance: number;
    bankrupt: boolean;
    jailed: number;
    ownedTiles: IncomeTile[];
    buyingStrategy: BuyingStrategy;

    constructor(name: string, balance: number, buyingStrategy: BuyingStrategy) {
        this.name = name,
        this.position = 0;
        this.balance = balance;
        this.bankrupt = false;
        this.jailed = 0;
        this.ownedTiles = [];
        this.buyingStrategy = buyingStrategy;
    }

    jail() {
        this.jailed = 1;
    }

    private checkIfPassedGo() {
        if (this.position >= tiles.length) {
            logger.log(`${this.name} has passed go and recieved $200 from the bank!`);
            this.position = this.position - tiles.length;
            //console.log(this.position)
            this.balance += 200;
        }
    }

    escapeJail() {
        if (!this.jailed) return;

        this.jailed++;

        if (this.jailed === 5) {
            logger.log(`${this.name} has escaped jail after 3 turns!`)
            this.jailed = 0;
        } else {
            const roll1 = Math.floor(6*Math.random())+1;  
            const roll2 = Math.floor(6*Math.random())+1;
            if (roll1 === roll2) {
                logger.log(`${this.name} has rolled double ${roll1}'s and has escaped jail`)
                this.jailed = 0;
            } else {
                logger.log(`${this.name} has failed to roll doubles and escape jail`)
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
        const roll1 = Math.floor(6*Math.random())+1;  
        const roll2 = Math.floor(6*Math.random())+1;  
        const roll = roll1+roll2
        //const roll = 1;
        this.position += roll;
        logger.log(`\n[${turn}] ${this.name} rolled a ${roll}!`);
    }

    declareBankrupt() {
        logger.log(`${this.name} has been declared bankrupt!`)
        this.bankrupt = true;
    }
}