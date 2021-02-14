export class Logger {
    enabled: Boolean;

    constructor(enabled: boolean) {
        this.enabled = enabled;
    }

    log(message: string) {
        if (this.enabled) {
            console.log(message)
        }
    }
}