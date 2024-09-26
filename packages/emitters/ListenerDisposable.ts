export interface IListenerDisposable {
    dispose: () => void;
}

export interface ICompositeDisposable extends IListenerDisposable {
    add(disposable: IListenerDisposable): void;
    remove(disposable: IListenerDisposable): void;
    clear(): void;
    count: number;
}

export function compositeDisposable(
    ...disposables: readonly IListenerDisposable[]
): ICompositeDisposable {
    const disposablesList = new Set(disposables);
    return {
        get count() {
            return disposablesList.size;
        },
        add(disposable: IListenerDisposable) {
            disposablesList.add(disposable);
        },
        remove(disposable: IListenerDisposable) {
            disposablesList.delete(disposable);
        },
        clear() {
            disposablesList.clear();
        },
        dispose(): void {
            disposablesList.forEach((disposable) => disposable.dispose());
            disposablesList.clear();
        },
    };
}
