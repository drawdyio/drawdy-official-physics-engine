import { DriverCommandIssuer } from "@drawdy/driver-protocol";

export type Ctx = {
    driverId: string;
    issueCommand: DriverCommandIssuer;
    generateId: () => string;
    nextRequestId: () => string;
};

export function stamp(ctx: Ctx): { driverId: string; requestId: string } {
    return { driverId: ctx.driverId, requestId: ctx.nextRequestId() };
}

export function unwrap<V>(response: { res: { error?: any; value?: V } }): V {
    const { error, value } = response.res;
    if (error !== undefined) {
        throw new Error(error);
    }
    return value as V;
}
