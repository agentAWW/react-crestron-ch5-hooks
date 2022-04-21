import { renderHook, RenderHookResult, act } from "@testing-library/react/pure";
import CrestronCH5 from "@norgate-av/crestron-ch5-helper";
import { useCrestronSerialCollection } from "../hooks";
import { ISerialEventAction, Serial } from "../types";
import { setupTest, signalNames } from "./helpers";

describe("useCrestronSerialCollection", () => {
    const {
        signalType,
        signalName,
        publishEvent,
        callback,
        subscribeState,
        unsubscribeState,
    } = setupTest<Serial>(CrestronCH5.SignalType.Serial, signalNames);

    let hook: RenderHookResult<
        [Serial[], ISerialEventAction[]],
        unknown
    > | null = null;

    let state: Serial[];
    let actions: ISerialEventAction[];

    beforeAll(() => {
        hook = renderHook(() =>
            useCrestronSerialCollection(signalName as string[], callback),
        );

        [state, actions] = hook.result.current;
    });

    it("should initialize correctly", () => {
        expect(hook?.result.current).toEqual([
            state,
            Array.from<ISerialEventAction>({ length: signalName.length }).fill({
                setValue: expect.any(Function),
            }),
        ]);
    });

    it("should call CrComLib.subscribeState() correctly", () => {
        expect(subscribeState).toHaveBeenCalledWith(
            signalType,
            expect.any(String),
            expect.any(Function),
        );

        expect(subscribeState).toHaveBeenCalledTimes(signalName.length);
        expect(subscribeState).toHaveReturnedWith(expect.any(String));
    });

    it("should call CrComLib.publishEvent() correctly for each signalName", () => {
        const signalNames = signalName as string[];

        signalNames.forEach((signalName, index) => {
            const action = actions[index];

            act(() => {
                action.setValue("100");
            });

            expect(publishEvent).toHaveBeenCalledWith(
                signalType,
                signalName,
                "100",
            );

            expect(publishEvent).toHaveBeenCalledTimes(1);
            publishEvent.mockClear();
        });
    });

    it("should call CrComLib.unsubscribeState() correctly on unmount", () => {
        act(() => {
            hook?.unmount();
        });

        expect(unsubscribeState).toHaveBeenCalledWith(
            signalType,
            expect.any(String),
            expect.any(String),
        );

        expect(unsubscribeState).toHaveBeenCalledTimes(signalName.length);
    });
});
