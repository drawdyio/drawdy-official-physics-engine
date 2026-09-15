import { Body } from "./body";
import { broadphasePairs } from "./broadphase";
import { collide, Contact } from "./narrowphase";
import { correctPositions, resolveVelocity } from "./impulse";
import { Vec2 } from "./vec2";

export const TICK = 60;
export const SIM_MULTIPLIER = 2;
export const SPEED = 0.5;
export const TIME_STEP = (1 / TICK / SIM_MULTIPLIER) * SPEED;

export const GRAVITY = 5000;

export const DEFAULT_RESTITUTION = 0.6;

export const SOLVER_ITERATIONS = 4;

export const MAX_SPEED = 4800;

export const ANGULAR_DAMPING = 0.5;

export const ROLLING_RESISTANCE = 1.2;
export const CONTACT_ANGULAR_RESISTANCE = 2.0;

export class World {
    public readonly bodies: Body[] = [];
    public gravity: Vec2 = { x: 0, y: GRAVITY };
    public lastPairCount = 0;
    public lastContactCount = 0;

    add(body: Body): void {
        this.bodies.push(body);
    }

    remove(id: string): void {
        const idx = this.bodies.findIndex((b) => b.id === id);
        if (idx >= 0) this.bodies.splice(idx, 1);
    }

    step(dt: number): void {
        for (const body of this.bodies) {
            if (body.isStatic) continue;
            if (body.touching) {
                body.vel = Vec2.scale(
                    body.vel,
                    Math.max(0, 1 - ROLLING_RESISTANCE * dt)
                );
                body.angVel *= Math.max(
                    0,
                    1 - CONTACT_ANGULAR_RESISTANCE * dt
                );
                body.touching = false;
            }
            body.vel = Vec2.add(body.vel, Vec2.scale(this.gravity, dt));
            const speed = Vec2.length(body.vel);
            if (speed > MAX_SPEED) {
                body.vel = Vec2.scale(body.vel, MAX_SPEED / speed);
            }
            body.pos = Vec2.add(body.pos, Vec2.scale(body.vel, dt));
            body.angVel *= Math.max(0, 1 - ANGULAR_DAMPING * dt);
            body.angle += body.angVel * dt;
        }

        const pairs = broadphasePairs(this.bodies);
        const contacts: Contact[] = [];
        for (const [i, j] of pairs) {
            const contact = collide(this.bodies, i, j);
            if (contact) contacts.push(contact);
        }
        this.lastPairCount = pairs.length;
        this.lastContactCount = contacts.length;
        for (let iter = 0; iter < SOLVER_ITERATIONS; iter++) {
            for (const contact of contacts) {
                resolveVelocity(this.bodies, contact);
            }
        }
        for (const contact of contacts) {
            correctPositions(this.bodies, contact);
        }
    }

    poseDeltas(): { id: string; dx: number; dy: number; dRotation: number }[] {
        return this.bodies
            .filter((b) => !b.isStatic)
            .map((b) => ({
                id: b.id,
                dx: b.pos.x - b.restPos.x,
                dy: b.pos.y - b.restPos.y,
                dRotation: b.angle,
            }));
    }
}
