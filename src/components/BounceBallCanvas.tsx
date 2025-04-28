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

function randomNumberGenerate(min: number, max: number) {
    const number = Math.random() * (max - min + 1) + min;
    return number;
}

function collisionVelocity(ball1: BallProperties, ball2: BallProperties) {
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

}

function drawBall(ctx: CanvasRenderingContext2D, properties: DrawingProperties): void {
    const { x, y, radius, color } = properties

    // Save the canvas state
    ctx.save();

    // Draw the ball
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill()

    // Restore the canvas state
    ctx.restore()
}

function renderBouncingBall(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    ballProperties: BallProperties[]
): void {

    // clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    ballProperties.forEach((ball) => {
        const { properties, velocity } = ball
        const currentBallPosition = { x: properties.x, y: properties.y }
        const currentBallRadius = properties.radius

        for (const othrBall of ballProperties) {
            if (othrBall === ball) continue;
            const comparingBallPosition = othrBall.properties
            const comparingBallRadius = othrBall.properties.radius

            const ballDistance =
                Math.sqrt(
                    Math.pow((currentBallPosition.x - comparingBallPosition.x), 2) +
                    Math.pow((currentBallPosition.y - comparingBallPosition.y), 2)
                )
            const sumOfRadius = currentBallRadius + comparingBallRadius

            if (ballDistance <= sumOfRadius) {
                collisionVelocity(ball, othrBall)
            }
        }

        if (properties.x + velocity.vx > canvasWidth - properties.radius || properties.x + velocity.vx < properties.radius) {
            velocity.vx = -velocity.vx;
        }
        if (properties.y + velocity.vy > canvasHeight - properties.radius || properties.y + velocity.vy < properties.radius) {
            velocity.vy = -velocity.vy;
        }

        // draw ball
        drawBall(ctx, properties);
        properties.x = properties.x + velocity.vx;
        properties.y = properties.y + velocity.vy;

    })

    requestAnimationFrame(() => renderBouncingBall(ctx, canvasWidth, canvasHeight, ballProperties))
}

const BounceBallCanvas: React.FC<CanvasProps> = ({ canvasWidth, canvasHeight }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // const balls: BallProperties[] = [
    //     {
    //         properties: {
    //             radius: 30,
    //             x: 30,
    //             y: 30,
    //             color: 'red',
    //             mass: 2
    //         },
    //         velocity: { vx: 5, vy: 5 }
    //     },
    //     {
    //         properties: {
    //             radius: 30,
    //             x: canvasWidth - 30,
    //             y: 30,
    //             color: 'blue',
    //             mass: 3
    //         },
    //         velocity: { vx: 5, vy: 5 }
    //     },
    //     {
    //         properties: {
    //             radius: 30,
    //             x: canvasWidth / 2,
    //             y: canvasHeight / 2,
    //             color: 'yellow',
    //             mass: 3
    //         },
    //         velocity: { vx: 5, vy: 5 }
    //     }

    // ]

    // const balls = generateRandomeBalls(canvasWidth, canvasHeight)
    const balls: BallProperties[] = [];

    for (let i = 0; i < 20; i++) {
        const radius = randomNumberGenerate(5, 20)
        const x = randomNumberGenerate(radius, canvasWidth - radius);
        const y = randomNumberGenerate(radius, canvasHeight - radius);
        const vx = randomNumberGenerate(3, 4);
        const vy = randomNumberGenerate(3, 4);

        const ball = {
            properties: {
                radius,
                x,
                y,
                color: `rgb(${randomNumberGenerate(0, 255)}, ${randomNumberGenerate(0, 255)}, ${randomNumberGenerate(0, 255)})`,
                mass: 1
            },
            velocity: { vx, vy }
        }
        balls.push(ball)
    }
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            const ctx = canvas?.getContext("2d");
            if (!ctx) return

            renderBouncingBall(ctx, canvas?.width, canvas?.height, balls)

        }
    }, [canvasWidth, canvasHeight]);

    return (
        <div
            className="w-fit h-auto border"
        >
            <canvas ref={canvasRef} onMouseUp={() => console.log('hovers')} />
        </div>
    );
};

export default BounceBallCanvas;