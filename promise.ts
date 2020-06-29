type Executor<T> = (resolve: (value: T | MyPromise<T>) => void, reject?: (reason: any) => void) => void;
type PromiseStatus = 'pending' | 'fullfilled' | 'rejected';

const PromiseStatus = {
    PENDING: 'pending' as const,
    FULLFILLED: 'fullfilled' as const,
    REJECTED: 'rejected' as const,
};

export class MyPromise<T> {
    private value?: T;
    private reason?: any;
    private status: PromiseStatus;
    private fullfilledHandlers: ((value: T) => void)[];
    private rejectedHandlers: ((reason?: any) => void)[];

    constructor(executor: Executor<T>) {
        this.status = PromiseStatus.PENDING;
        this.fullfilledHandlers = [];
        this.rejectedHandlers = [];
        executor(this.resolve.bind(this), this.reject.bind(this));
    }

    resolve(value: T | MyPromise<T>): void {
        if (value instanceof MyPromise) {
            value.then((v: T) => {
                this.resolved(v);
            });
        } else {
            this.resolved(value);
        }
    }

    resolved(value: T): void {
        this.status = PromiseStatus.FULLFILLED;
        this.value = value;
        this.handleFullFilled();
    }

    static resolve<T>(value: T): MyPromise<T> {
        return new MyPromise<T>((resolve) => {
            resolve(value);
        });
    }

    reject(reason: any): void {
        this.status = PromiseStatus.REJECTED;
        this.reason = reason;
        this.handleRejected();
    }

    /**
     * Promiseがfullfilled状態になった時のコールバック関数を登録する
     * @param onFullfilled
     * @param onRejected
     */
    then<TResult = T>(
        onFullfilled: (value: T) => TResult | MyPromise<TResult>,
        onRejected?: (reason?: any) => TResult | MyPromise<TResult>
    ): MyPromise<TResult> {
        if (this.isPending()) {
            return new MyPromise<TResult>((resolve, reject) => {
                this.onFullfilled((v: T) => {
                    try {
                        resolve(onFullfilled(this.value));
                    } catch (err) {
                        reject(err);
                    }
                });
            });
        } else if (this.isFullfilled()) {
            return new MyPromise<TResult>((resolve, reject) => {
                try {
                    resolve(onFullfilled(this.value));
                } catch(err) {
                    reject(err);
                }
            });
        }
    }

    catch<TResult = T>(onRejected: (reason?: any) => TResult | MyPromise<TResult>): MyPromise<TResult> {
        if (this.isPending()) {
            return new MyPromise<TResult>((resolve, reject) => {
                this.onRejected((reason?: any) => {
                    try {
                        resolve(onRejected(reason));
                    } catch (err) {
                        reject(err);
                    }
                });
            });
        } else if (this.isRejected()) {
            return new MyPromise<TResult>((resolve, reject) => {
                try {
                    resolve(onRejected(this.reason));
                } catch (err) {
                    reject(err);
                }
            });
        }
    }

    private isPending(): boolean {
        return this.status === PromiseStatus.PENDING;
    }

    private isFullfilled(): boolean {
        return this.status === PromiseStatus.FULLFILLED
    }

    private isRejected(): boolean {
        return this.status === PromiseStatus.REJECTED
    }

    private handleFullFilled(): void {
        let handler = this.fullfilledHandlers.shift();
        while (handler != null) {
            handler(this.value);
            handler = this.fullfilledHandlers.shift();
        }
    }

    private handleRejected(): void {
        let handler = this.rejectedHandlers.shift();
        while (handler != null) {
            handler(this.reason);
            handler = this.rejectedHandlers.shift();
        }
    }

    private onFullfilled(fullfilledHandler: (value: T) => void) {
        this.fullfilledHandlers.push(fullfilledHandler);
    }

    private onRejected(rejectedHandler: (reason?: any) => void) {
        this.rejectedHandlers.push(rejectedHandler);
    }
}
