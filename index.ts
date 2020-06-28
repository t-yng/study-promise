/**
 * Promiseの自前実装
 * ECMAScriptの仕様は以下のリポジトリを参照
 * @see: https://github.com/domenic/promises-unwrapping
 */

type OnFullFilled<T> = (value: T) => T | MyPromise<T>;
type OnRejected<T extends Error = Error> = (error: T) => MyPromise<T> | void;
type Executor<T> = (resolve: (value: T | MyPromise<T>) => void, reject?: (reason: any) => void) => void;
type PromiseStatus = 'pending' | 'fullfilled' | 'rejected';

const PromiseStatus = {
    PENDING: 'pending' as const,
    FULLFILLED: 'fullfilled' as const,
    REJECTED: 'rejected' as const,
};

class MyPromise<T> {
    private value?: T;
    private status: PromiseStatus;
    private fullfilledHandlers: ((value: T) => void)[];

    constructor(executor: Executor<T>) {
        this.status = PromiseStatus.PENDING;
        this.fullfilledHandlers = [];
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

    reject(error: Error): void {
        // TODO: implemented
    }

    /**
     * Promiseがfullfilled状態になった時のコールバック関数を登録する
     * @param onFullfilled
     * @param onRejected
     */
    then<TResult = T>(onFullfilled: (value: T) => TResult | MyPromise<TResult>, onRejected?: OnRejected): MyPromise<TResult> {
        if (this.isPending()) {
            return new MyPromise<TResult>((resolve) => {
                this.onFullfilled((v: T) => resolve(onFullfilled(this.value)));
            });
        } else if (this.isFullfilled()) {
            return new MyPromise<TResult>((resolve) => {
                resolve(onFullfilled(this.value));
            });
        }
    }

    private isPending(): boolean {
        return this.status === PromiseStatus.PENDING;
    }

    private isFullfilled(): boolean {
        return this.status === PromiseStatus.FULLFILLED
    }

    private handleFullFilled(): void {
        let handler = this.fullfilledHandlers.shift();
        while (handler != null) {
            handler(this.value);
            handler = this.fullfilledHandlers.shift();
        }
    }

    private onFullfilled(fullfilledHandler: (value: T) => void) {
        this.fullfilledHandlers.push(fullfilledHandler);
    }
}

const p = new MyPromise<number>((resolve, reject) => {
    // resolve(2);
    setTimeout(() => resolve(1), 500);
})

p.then(v => {
    console.log(v);
    return v+ 1;
});
p.then(v => {
    console.log(v);
    return v+ 1;
});

p
    .then(v => v + 1)
    .then(v => v + 1)
    .then(v => {
        console.log(v);
    })
