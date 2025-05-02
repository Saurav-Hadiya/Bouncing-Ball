'use client'
import { useEffect, useRef } from "react";

interface CanvasProps {
    canvasWidth: number,
    canvasHeight: number
}

interface Point {
    x: number,
    y: number
}

interface DrawingProperties {
    x: number,
    y: number,
    radius: number,
    color: string,
    mass: number
}

interface Velocity {
    vx: number,
    vy: number
}

interface BallProperties {
    properties: DrawingProperties,
    velocity: Velocity
}

function handleMouseHover(
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
    cursorPoint: { x: number, y: number }
) {
    const canvas = e.currentTarget;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    cursorPoint.x = e.clientX - rect.left;
    cursorPoint.y = e.clientY - rect.top;
}

function randomNumberGenerate(min: number, max: number): number {
    const number = Math.random() * (max - min + 1) + min;
    return number;
}

function ballColliding(ball1: Omit<DrawingProperties, 'color' | 'mass'>, ball2: Omit<DrawingProperties, 'color' | 'mass'>): boolean {

    // distance between two balls
    const ballDistance =
        Math.sqrt(
            Math.pow((ball1.x - ball2.x), 2) +
            Math.pow((ball1.y - ball2.y), 2)
        )

    // sum of two balls radius
    const sumOfRadius = ball1.radius + ball2.radius;

    // based on whether balls are collide or not returns true or false
    return ballDistance <= sumOfRadius;
}

function collisionVelocity(ball1: BallProperties, ball2: BallProperties): void {
    // ball1 properties and velocity
    const x1 = ball1.properties.x;
    const y1 = ball1.properties.y;
    const m1 = ball1.properties.mass
    const vx1 = ball1.velocity.vx
    const vy1 = ball1.velocity.vy

    // ball2 properties and velocity
    const x2 = ball2.properties.x;
    const y2 = ball2.properties.y;
    const m2 = ball2.properties.mass
    const vx2 = ball2.velocity.vx
    const vy2 = ball2.velocity.vy

    const dx = x1 - x2;
    const dy = y1 - y2;
    const dvx = vx1 - vx2;
    const dvy = vy1 - vy2;

    /* Based on this equation calculates collision velocity of balls
    v1' = v1 - (2(m2) * (v1 - v2) ⋅ (p1 - p2) ) * (p1 - p2) / ((m1 + m2)*(|p1 - p2|²))
    */

    // dot products of both the balls
    const dotProduct = (dvx * dx) + (dvy * dy);

    if (dotProduct >= 0) return;
    // sum of square of both the balls positions values difference
    const distSeq = (dx * dx) + (dy * dy);

    // sum of both the balls mas
    const massSum = m1 + m2;

    // calculate collision impulse
    const collisionImpulse = (2 * dotProduct) / ((massSum) * (distSeq));

    // update the velocity of both the balls
    ball1.velocity.vx -= (m1 * collisionImpulse * dx);
    ball1.velocity.vy -= (m1 * collisionImpulse * dy);

    ball2.velocity.vx -= (m2 * collisionImpulse * (-dx));
    ball2.velocity.vy -= (m2 * collisionImpulse * (-dy));

    return;
}

function drawBall(ctx: CanvasRenderingContext2D, properties: DrawingProperties, flag: boolean): void {
    const { x, y, radius, color } = properties

    // Save the canvas state
    ctx.save();

    // Draw the ball
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);

    if (flag) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = color;
        ctx.fill();
    } else {
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    // Restore the canvas state
    ctx.restore()
}

function renderBouncingBall(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    ballProperties: BallProperties[],
    cursorPoint: { x: number, y: number }
): void {

    // clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    ballProperties.forEach((ball) => {
        const { properties, velocity } = ball

        for (const otherBall of ballProperties) {
            if (otherBall === ball) continue;
            const isBallColliding = ballColliding(ball.properties, otherBall.properties);
            if (isBallColliding) {
                collisionVelocity(ball, otherBall)
            }
        }

        if (properties.x + velocity.vx > canvasWidth - properties.radius || properties.x + velocity.vx < properties.radius) {
            velocity.vx = -velocity.vx;
        }
        if (properties.y + velocity.vy > canvasHeight - properties.radius || properties.y + velocity.vy < properties.radius) {
            velocity.vy = -velocity.vy;
        }

        const isBallCollideWithHover = ballColliding({
            ...cursorPoint,
            radius: 30,
        }, ball.properties)

        // draw ball
        drawBall(ctx, properties, isBallCollideWithHover);
        properties.x = properties.x + velocity.vx;
        properties.y = properties.y + velocity.vy;
    })

    requestAnimationFrame(() => renderBouncingBall(ctx, canvasWidth, canvasHeight, ballProperties, cursorPoint))
}

function generateInitialBalls(count: number, canvasWidth: number, canvasHeight: number): BallProperties[] {
    const balls: BallProperties[] = [];

    for (let i = 0; i < count; i++) {
        const radius = randomNumberGenerate(5, 20);
        const x = randomNumberGenerate(radius, canvasWidth - radius);
        const y = randomNumberGenerate(radius, canvasHeight - radius);
        const vx = randomNumberGenerate(3, 4);
        const vy = randomNumberGenerate(3, 4);

        balls.push({
            properties: {
                radius,
                x,
                y,
                color: `rgb(${randomNumberGenerate(0, 255)}, ${randomNumberGenerate(0, 255)}, ${randomNumberGenerate(0, 255)})`,
                mass: 1
            },
            velocity: { vx, vy }
        });
    }

    return balls;
}

const BounceBallCanvas: React.FC<CanvasProps> = ({ canvasWidth, canvasHeight }) => {
    const cursorPoint = useRef({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas !== null) {
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            const ctx = canvas?.getContext("2d");
            if (!ctx) return

            const balls = generateInitialBalls(20, canvasWidth, canvasHeight);

            renderBouncingBall(ctx, canvas?.width, canvas?.height, balls, cursorPoint.current)

        }
    }, [canvasWidth, canvasHeight]);

    return (
        <div
            className="w-fit h-auto border"
        >
            <canvas ref={canvasRef} onMouseMove={(e) => handleMouseHover(e, cursorPoint.current)} />
        </div>
    );
};

export default BounceBallCanvas;