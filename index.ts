type OnFullFilled = (v: any) => MyPromise | void;
type OnRejected<T extends Error = Error> = (error: T) => MyPromise | void;
type Executor = (onFullFilled: OnFullFilled, OnRejected?: OnRejected) => void;
type PromiseStateType = 'pending' | 'resolved' | 'failed';

const PromiseState = {
    PENDING: 'pending' as const,
    RESOLVED: 'resolved' as const,
    FAILED: 'failed' as const,
};

class MyPromise {
    private resolved?: any;
    private failed?: Error;
    private state: PromiseStateType;
    private fullFilledHandlers: OnFullFilled[];
    private rejectedHandlers: OnRejected[];

    constructor(executor: Executor) {
        this.state = PromiseState.PENDING;
        this.fullFilledHandlers = [];
        this.rejectedHandlers = [];
        executor(this.resolve.bind(this), this.reject.bind(this));
    }

    resolve(value: any): MyPromise {
        this.state = PromiseState.RESOLVED;
        this.resolved = value;
        let onFullFilled = this.fullFilledHandlers.shift();
        while(onFullFilled != null) {
            try {
                this.resolved = onFullFilled(this.resolved);
            } catch (error) {
                this.reject(error);
                break;
            }
            onFullFilled = this.fullFilledHandlers.shift();
        }
        return this;
    }

    reject(error: Error): MyPromise {
        this.state = PromiseState.FAILED;
        const handler = this.rejectedHandlers.shift();
        if (handler != null) {
            handler(error);
        }
        this.failed = error;
        return this;
    }

    then(onFullFilled: OnFullFilled): MyPromise {
        if (this.isResolved()) {
            this.resolved = onFullFilled(this.resolved);
        } else {
            this.fullFilledHandlers.push(onFullFilled);
        }
        return this;
    }

    catch(onRejected: OnRejected): MyPromise {
        if (this.isRejected()) {
            onRejected(this.failed);
        } else {
            this.rejectedHandlers.push(onRejected);
        }
        return this;
    }

    private isResolved(): boolean {
        return this.state === PromiseState.RESOLVED;
    }

    private isRejected(): boolean {
        return this.state === PromiseState.FAILED;
    }
}


const p = new MyPromise((resolve, reject) => {
    setTimeout(() => resolve(1), 500);
})

p
    .then(v => v + 1)
    .then(v => {
        console.log(v);
        throw new Error('エラーが発生');
    })
    .catch(error => console.log(error));
