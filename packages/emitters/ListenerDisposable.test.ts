import { compositeDisposable, IListenerDisposable } from "./ListenerDisposable";

function createDisposableMock() {
    const mock = jest.fn<void, []>();
    return {
        disposable: { dispose: mock } as IListenerDisposable,
        mock,
    };
}

describe("CompositeDisposable", () => {
    test("Create empty composite disposable", () => {
        // Act ---------
        const composite = compositeDisposable();

        // Assert ------
        expect(composite.count).toBe(0);
    });

    test("Create composite from disposables", () => {
        // Arrange ----------
        const { disposable: disposableA } = createDisposableMock();
        const { disposable: disposableB } = createDisposableMock();

        // Act -------------
        const composite = compositeDisposable(disposableA, disposableB);

        // Assert -----------
        expect(composite.count).toBe(2);
    });

    test("Add disposables to composite", () => {
        // Arrange ---------
        const { disposable: disposableA } = createDisposableMock();
        const { disposable: disposableB } = createDisposableMock();
        const composite = compositeDisposable();

        // Act -------------
        composite.add(disposableA);
        composite.add(disposableB);

        // Assert ----------
        expect(composite.count).toBe(2);
    });

    test("Add composite in composite", () => {
        // Arrange --------
        const { disposable: disposableA } = createDisposableMock();
        const compositeA = compositeDisposable(disposableA);

        const { disposable: disposableB } = createDisposableMock();

        // Act -------------
        const compositeB = compositeDisposable(compositeA, disposableB);

        // Assert ---------
        expect(compositeA.count).toBe(1);
        expect(compositeB.count).toBe(2);
    });

    test("Remove disposable from composite", () => {
        // Arrange ---------
        const { disposable: disposableA } = createDisposableMock();
        const { disposable: disposableB } = createDisposableMock();
        const composite = compositeDisposable(disposableA, disposableB);

        // Act -------------
        composite.remove(disposableA);

        // Assert ----------
        expect(composite.count).toBe(1);
    });

    test("Clear all disposables", () => {
        // Arrange ---------
        const { disposable: disposableA } = createDisposableMock();
        const { disposable: disposableB } = createDisposableMock();
        const composite = compositeDisposable(disposableA, disposableB);

        // Act -------------
        composite.clear();

        // Assert ----------
        expect(composite.count).toBe(0);
    });

    test("Dispose", () => {
        // Arrange ------
        const disposableMockA1 = createDisposableMock();
        const disposableMockA2 = createDisposableMock();
        const compositeA = compositeDisposable(
            disposableMockA1.disposable,
            disposableMockA2.disposable,
        );

        const disposableMockB = createDisposableMock();
        const compositeB = compositeDisposable(
            disposableMockB.disposable,
            compositeA,
        );

        // Act ----------
        compositeB.dispose();

        // Assert -------
        expect(disposableMockA1.mock).toHaveBeenCalled();
        expect(disposableMockA2.mock).toHaveBeenCalled();
        expect(disposableMockB.mock).toHaveBeenCalled();
    });
});
