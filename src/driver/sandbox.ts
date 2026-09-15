import { SubscribedDrawdyElement } from "@drawdy/driver-protocol";
import { Ctx, stamp, unwrap } from "./context";
import { physicsMode } from "./meta";

export type SandboxRect = {
    x: number;
    y: number;
    w: number;
    h: number;
    rotation: number;
};

export const MIN_SANDBOX_W = 1600;
export const MIN_SANDBOX_H = 1200;
export const SANDBOX_INFLATE = 0.5;

const SANDBOX_STROKE = "#94a3b8";
// Below every ordinary element (the scene floors new elements at 0). The name
// label makes the rect count as filled, so without this the interior swallows
// clicks meant for the bodies inside.
export const SANDBOX_LAYER = -1000;

export function sandboxRect(el: SubscribedDrawdyElement): SandboxRect | null {
    if (el.x == null || el.y == null || el.width == null || el.height == null) {
        return null;
    }
    return {
        x: el.x,
        y: el.y,
        w: el.width,
        h: el.height,
        rotation: el.rotation ?? 0,
    };
}

export function findSandboxes(
    els: ReadonlyArray<SubscribedDrawdyElement>
): SubscribedDrawdyElement[] {
    return els
        .filter((el) => physicsMode(el) === "sandbox" && sandboxRect(el))
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export function sandboxName(el: SubscribedDrawdyElement): string | null {
    const physics = el.meta?.["physics"];
    if (physics && typeof physics === "object") {
        const name = (physics as Record<string, unknown>)["name"];
        if (typeof name === "string" && name.trim()) return name;
    }
    return null;
}

export function isInside(
    rect: SandboxRect,
    geom: { x: number; y: number; w: number; h: number }
): boolean {
    return isPointInside(rect, {
        x: geom.x + geom.w / 2,
        y: geom.y + geom.h / 2,
    });
}

export function isPointInside(
    rect: SandboxRect,
    p: { x: number; y: number }
): boolean {
    const rcx = rect.x + rect.w / 2;
    const rcy = rect.y + rect.h / 2;
    const cos = Math.cos(-rect.rotation);
    const sin = Math.sin(-rect.rotation);
    const dx = p.x - rcx;
    const dy = p.y - rcy;
    const lx = rcx + dx * cos - dy * sin;
    const ly = rcy + dx * sin + dy * cos;
    return (
        lx >= rect.x &&
        lx <= rect.x + rect.w &&
        ly >= rect.y &&
        ly <= rect.y + rect.h
    );
}

export function defaultRectAround(
    content: { x: number; y: number; width: number; height: number } | null
): SandboxRect {
    const c = content ?? { x: 0, y: 0, width: 0, height: 0 };
    const w = Math.max(c.width * (1 + 2 * SANDBOX_INFLATE), MIN_SANDBOX_W);
    const h = Math.max(c.height * (1 + 2 * SANDBOX_INFLATE), MIN_SANDBOX_H);
    const cx = c.x + c.width / 2;
    const cy = c.y + c.height / 2;
    return { x: cx - w / 2, y: cy - h / 2, w, h, rotation: 0 };
}

const SANDBOX_LABEL_FONT_SIZE = 28;

export const singleLineName = (s: string): string =>
    s.replace(/\s*[\r\n]+\s*/g, " ").trim();

type SandboxStyle = {
    strokeColor?: string;
    fillColor?: string;
    strokeWidth?: number;
    strokeDash?: "solid" | "dashed" | "dotted";
    roughness?: number;
};

async function addSandboxElement(
    ctx: Ctx,
    id: string,
    rect: SandboxRect,
    physics: Record<string, unknown>,
    style: SandboxStyle
): Promise<void> {
    const rawName = physics["name"];
    const name = typeof rawName === "string" ? singleLineName(rawName) : "";
    if (name) physics = { ...physics, name };
    unwrap(
        await ctx.issueCommand({
            type: "command:scene:add-drawdy-elements",
            ...stamp(ctx),
            req: {
                elements: [
                    {
                        drawdyElementId: id,
                        type: "shape",
                        componentType: "rect",
                        x: rect.x,
                        y: rect.y,
                        width: rect.w,
                        height: rect.h,
                        layer: SANDBOX_LAYER,
                        strokeColor: style.strokeColor ?? SANDBOX_STROKE,
                        fillColor: style.fillColor ?? "transparent",
                        strokeWidth: style.strokeWidth ?? 2,
                        strokeDash: style.strokeDash ?? "dashed",
                        roughness: style.roughness ?? 0,
                        ...(name
                            ? {
                                  text: name,
                                  fontSize: SANDBOX_LABEL_FONT_SIZE,
                                  textAlign: "left" as const,
                                  textVerticalAlign: "top" as const,
                                  textColor: style.strokeColor ?? SANDBOX_STROKE,
                              }
                            : {}),
                        meta: { physics },
                    },
                ],
            },
        })
    );
}

const physicsMetaOf = (
    el: SubscribedDrawdyElement
): Record<string, unknown> => ({
    ...(el.meta?.["physics"] as object),
    mode: "sandbox",
});

export async function createSandbox(
    ctx: Ctx,
    rect: SandboxRect,
    name?: string
): Promise<string> {
    const id = ctx.generateId();
    await addSandboxElement(
        ctx,
        id,
        rect,
        name ? { mode: "sandbox", name } : { mode: "sandbox" },
        {}
    );
    return id;
}

const removeElement = async (ctx: Ctx, id: string): Promise<void> => {
    unwrap(
        await ctx.issueCommand({
            type: "command:scene:remove-drawdy-elements",
            ...stamp(ctx),
            req: { drawdyElementIds: [id] },
        })
    );
};

// Geometry is not updateable through the protocol, so resize and rename are
// both a remove + re-add under the same element id.
export async function resizeSandbox(
    ctx: Ctx,
    el: SubscribedDrawdyElement,
    w: number,
    h: number
): Promise<SandboxRect | null> {
    const old = sandboxRect(el);
    if (!old) return null;
    const rect: SandboxRect = {
        x: old.x + old.w / 2 - w / 2,
        y: old.y + old.h / 2 - h / 2,
        w,
        h,
        rotation: 0,
    };
    await removeElement(ctx, el.id);
    await addSandboxElement(ctx, el.id, rect, physicsMetaOf(el), el);
    return rect;
}

export async function renameSandbox(
    ctx: Ctx,
    el: SubscribedDrawdyElement,
    name: string
): Promise<void> {
    const rect = sandboxRect(el);
    if (!rect) return;
    await removeElement(ctx, el.id);
    await addSandboxElement(
        ctx,
        el.id,
        rect,
        { ...physicsMetaOf(el), name },
        el
    );
}

export async function ensureSandboxLayer(
    ctx: Ctx,
    els: ReadonlyArray<SubscribedDrawdyElement>
): Promise<void> {
    const stale = els.filter((el) => el.layer !== SANDBOX_LAYER);
    if (stale.length === 0) return;
    unwrap(
        await ctx.issueCommand({
            type: "command:scene:update-drawdy-elements",
            ...stamp(ctx),
            req: {
                updates: stale.map((el) => ({
                    drawdyElementId: el.id,
                    properties: { layer: SANDBOX_LAYER },
                })),
            },
        })
    );
}

export async function syncSandboxLabels(
    ctx: Ctx,
    els: ReadonlyArray<SubscribedDrawdyElement>
): Promise<boolean> {
    const updates: {
        drawdyElementId: string;
        properties: { meta: Record<string, unknown> };
    }[] = [];
    const recreateIds: string[] = [];
    for (const el of els) {
        if (physicsMode(el) !== "sandbox") continue;
        if (typeof el.text !== "string") continue;
        const label = singleLineName(el.text);
        if (!label) continue;
        if (/[\r\n]/.test(el.text)) {
            recreateIds.push(el.id);
            continue;
        }
        if (label === (sandboxName(el) ?? "")) continue;
        updates.push({
            drawdyElementId: el.id,
            properties: {
                meta: { physics: { ...physicsMetaOf(el), name: label } },
            },
        });
    }
    if (updates.length > 0) {
        unwrap(
            await ctx.issueCommand({
                type: "command:scene:update-drawdy-elements",
                ...stamp(ctx),
                req: { updates },
            })
        );
    }
    if (recreateIds.length === 0) return false;
    const { drawdyElements } = unwrap(
        await ctx.issueCommand({
            type: "command:scene:get-drawdy-elements",
            ...stamp(ctx),
            req: {
                properties: [
                    "meta",
                    "text",
                    "x",
                    "y",
                    "width",
                    "height",
                    "strokeColor",
                    "fillColor",
                    "strokeWidth",
                    "strokeDash",
                    "roughness",
                ],
            },
        })
    );
    let recreated = false;
    for (const el of drawdyElements) {
        if (!recreateIds.includes(el.id)) continue;
        const label = singleLineName(el.text ?? "");
        if (!label) continue;
        await renameSandbox(ctx, el, label);
        recreated = true;
    }
    return recreated;
}
