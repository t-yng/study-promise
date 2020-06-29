import { MyPromise } from './promise';

describe('MyPromiseのテスト', () => {
    describe('fullfilled', () => {
        test('resolveのコールバックが同期的に値を返すときに解決済みのPromiseが生成されること', done => {
            const p = new MyPromise(resolve => resolve(1));
            p.then(v => {
                expect(v).toBe(1);
                done();
            });
        });

        test('resolveのコールバックが非同期で値を返すときにPromiseが解決されること', done => {
            const p = new MyPromise(resolve => setTimeout(() =>resolve(1), 100));
            p.then(v => {
                expect(v).toBe(1);
                done();
            });
        });

        test('then()が計算済みの値を解決したPromiseを返すこと', done => {
            const p = new MyPromise<number>(resolve => setTimeout(() =>resolve(1), 100));
            p
            .then(v => v + 1)
            .then(v => v + 1)
            .then(v => {
                expect(v).toBe(3);
                done();
            });
        });

        test('resolveのコールバックがPromiseを返すときに最終的な値が解決されること', done => {
            const p = new MyPromise<number>(resolve => {
                setTimeout(() => {
                    const v = 1;
                    resolve(new MyPromise<number>(resolve => resolve(v + 1)));
                }, 100);
            });
            p.then(v => {
                expect(v).toBe(2);
                done();
            });
        });
    });

    describe('rejected', () => {
        test('rejectが呼ばれた時にcatch()メソッドで登録したコールバックが呼ばれること', done => {
            const p = new MyPromise((_resolve, reject) => {
                setTimeout(() => {
                    reject('error happen');
                }, 100);
            });
            p
            .catch(err => {
                expect(err).toBe('error happen');
                done();
            });
        });

        test('then()メソッドのコールバックでエラーが発生した時にcatch()メソッドのコールバックが呼ばれること', done => {
            const p = new MyPromise(resolve => {
                setTimeout(() => {
                    resolve(1);
                }, 100);
            });
            p
            .then(v => {
                throw new Error('error happen');
            })
            .catch(err => {
                expect(err.message).toBe('error happen');
                done();
            });
        });
    });
});
