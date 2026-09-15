import { Ctx, stamp, unwrap } from "./context";
import { PhysicsMode, isDynamicEligible, physicsMode } from "./meta";

export const physicsMenuId = (driverId: string) => `${driverId}:physics`;
export const staticMenuId = (driverId: string) => `${driverId}:static`;
export const dynamicMenuId = (driverId: string) => `${driverId}:dynamic`;

export type MenuChecks = { static: boolean; dynamic: boolean };

export async function toggleSelectionTag(
    ctx: Ctx,
    mode: Exclude<PhysicsMode, "none">
): Promise<number> {
    const { drawdyElementIds } = unwrap(
        await ctx.issueCommand({
            type: "command:scene:get-current-selected-drawdy-elements",
            ...stamp(ctx),
        })
    );
    if (drawdyElementIds.length === 0) return 0;
    const selected = new Set(drawdyElementIds);

    const { drawdyElements } = unwrap(
        await ctx.issueCommand({
            type: "command:scene:get-drawdy-elements",
            ...stamp(ctx),
            req: { properties: ["componentType", "locked", "meta"] },
        })
    );
    const sel = drawdyElements.filter(
        (el) => selected.has(el.id) && physicsMode(el) !== "sandbox"
    );
    if (sel.length === 0) return 0;

    const allTagged = sel.every((el) => physicsMode(el) === mode);
    const targets = allTagged
        ? sel
        : mode === "static"
          ? sel
          : sel.filter(isDynamicEligible);
    if (targets.length === 0) return 0;

    const nextMode: PhysicsMode = allTagged ? "none" : mode;
    unwrap(
        await ctx.issueCommand({
            type: "command:scene:update-drawdy-elements",
            ...stamp(ctx),
            req: {
                updates: targets.map((el) => ({
                    drawdyElementId: el.id,
                    properties: { meta: { physics: { mode: nextMode } } },
                })),
            },
        })
    );
    return targets.length;
}

let shownChecks: MenuChecks | null = null;

export function resetMenuChecks(): void {
    shownChecks = null;
}

export async function refreshMenuChecks(
    ctx: Ctx,
    checks: MenuChecks
): Promise<void> {
    if (
        shownChecks &&
        shownChecks.static === checks.static &&
        shownChecks.dynamic === checks.dynamic
    ) {
        return;
    }
    shownChecks = checks;
    const menu = {
        menuId: physicsMenuId(ctx.driverId),
        menuTitle: "Physics",
        children: [
            {
                menuId: staticMenuId(ctx.driverId),
                menuTitle: `Static${checks.static ? " ✓" : ""}`,
            },
            {
                menuId: dynamicMenuId(ctx.driverId),
                menuTitle: `Dynamic${checks.dynamic ? " ✓" : ""}`,
            },
        ],
    };
    unwrap(
        await ctx.issueCommand({
            type: "command:context-menu:remove",
            ...stamp(ctx),
            req: { menuId: menu.menuId },
        })
    );
    unwrap(
        await ctx.issueCommand({
            type: "command:context-menu:add",
            ...stamp(ctx),
            req: menu,
        })
    );
}
