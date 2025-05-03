'use client'
import { BallConstraints, Cursor_Hover } from "@/constants/bouncingBall";
import React, { SetStateAction, useEffect, useRef, useState } from "react";

interface CanvasProps {
 
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

interface BallConstraints {
    ball_Counts: number;
    minBallRadius: number;
    maxBallRadius: number;
    minBallVelocity_X: number;
    maxBallVelocity_X: number;
    minBallVelocity_Y: number;
    maxBallVelocity_Y: number;
    ballMass: number;
}
function handleMouseHover(
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
    cursorProperty: { x: number, y: number, isHover: boolean, },
) {
    const canvas = e.currentTarget;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    cursorProperty.x = e.clientX - rect.left;
    cursorProperty.y = e.clientY - rect.top;
    cursorProperty.isHover = true
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
    cursorProperty: { x: number, y: number, hoverRadius: number, isHover: boolean },
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
        if (cursorProperty.isHover) {
            const isBallCollideWithHover = ballColliding({
                ...cursorProperty,
                radius: cursorProperty.hoverRadius,
            }, ball.properties)
            drawBall(ctx, properties, isBallCollideWithHover);
        }
        else {
            drawBall(ctx, properties, false);
        }
        // draw ball
        properties.x = properties.x + velocity.vx;
        properties.y = properties.y + velocity.vy;
    })
    cursorProperty.isHover = false;

    requestAnimationFrame(() =>
        renderBouncingBall(ctx, canvasWidth, canvasHeight, ballProperties, cursorProperty)
    )
}

function generateInitialBalls(canvasWidth: number, canvasHeight: number, constraints: BallConstraints): BallProperties[] {
    const balls: BallProperties[] = [];

    for (let i = 0; i < constraints.ball_Counts; i++) {
        const radius = randomNumberGenerate(constraints.minBallRadius, constraints.maxBallRadius);
        const x = randomNumberGenerate(radius, canvasWidth - radius);
        const y = randomNumberGenerate(radius, canvasHeight - radius);
        const vx = randomNumberGenerate(constraints.minBallVelocity_X, constraints.maxBallVelocity_X);
        const vy = randomNumberGenerate(constraints.minBallVelocity_Y, constraints.maxBallVelocity_Y);

        balls.push({
            properties: {
                radius,
                x,
                y,
                color: `rgb(${randomNumberGenerate(0, 255)}, ${randomNumberGenerate(0, 255)}, ${randomNumberGenerate(0, 255)})`,
                mass: constraints.ballMass
            },
            velocity: { vx, vy }
        });
    }

    return balls;
}

const BounceBallCanvas: React.FC<CanvasProps> = () => {

    const cursorProperty = useRef({ x: 0, y: 0, hoverRadius: Cursor_Hover.Cursor_Hover_Radius, isHover: false });
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas !== null) {
            console.log(canvas.clientWidth);
            const canvasWidth = canvas.clientWidth;
            const canvasHeight = canvas.clientHeight;
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            const ctx = canvas?.getContext("2d");
            if (!ctx) return

            const ballConstraints: BallConstraints = {
                ball_Counts: BallConstraints.BallCount,
                minBallRadius: BallConstraints.MinRadius,
                maxBallRadius: BallConstraints.MaxRadius,
                minBallVelocity_X: BallConstraints.MinVelocityX,
                maxBallVelocity_X: BallConstraints.MaxVelocityX,
                minBallVelocity_Y: BallConstraints.MinVelocityY,
                maxBallVelocity_Y: BallConstraints.MaxVelocityY,
                ballMass: BallConstraints.Mass,
            };
            const balls = generateInitialBalls(canvasWidth, canvasHeight, ballConstraints);

            renderBouncingBall(ctx, canvasWidth, canvasHeight, balls, cursorProperty.current)

        }
    }, []);

    return (
        <div
            className="w-[100vw] h-[80vh] border"
        >
            <canvas className="w-full h-full" ref={canvasRef} onMouseMove={(e) => handleMouseHover(e, cursorProperty.current)} />
        </div>
    );
};

export default BounceBallCanvas;