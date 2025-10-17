import { useEntry } from "@frc-web-components/react";
import { useEffect, useRef } from "react";

function ReefscapeDisplay() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [algaeStates, setAlgaeStates] = useEntry<string[]>('/Reefscape/Algae', ['present', 'present', 'present', 'present', 'present', 'present']);
    const [coralStates, setCoralStates] = useEntry<string[]>('/Reefscape/Coral', [
        'present', 'present', 'present', 'present', 'present', 'present',
        'present', 'present', 'present', 'present', 'present', 'present',
        'present', 'present', 'present', 'present', 'present', 'present',
        'present', 'present', 'present', 'present', 'present', 'present',
        'present', 'present', 'present', 'present', 'present', 'present',
        'present', 'present', 'present', 'present', 'present', 'present',
    ]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = canvas.clientWidth * devicePixelRatio;
            canvas.height = canvas.clientHeight * devicePixelRatio;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                // Scale the context to match device pixel ratio
                ctx.scale(devicePixelRatio, devicePixelRatio);
                
                // Use client dimensions for drawing calculations
                const drawWidth = canvas.clientWidth;
                const drawHeight = canvas.clientHeight;
                const minDimension = Math.min(drawWidth, drawHeight);
                const scale = minDimension / 400 * 0.9; // Base scale factor
                
                // Draw a dark blue background
                ctx.fillStyle = "#001f3f";
                ctx.fillRect(0, 0, drawWidth, drawHeight);
                ctx.strokeStyle = "#FFFFFF";
                ctx.lineWidth = 4 * scale;
                
                const drawHexagon = (x: number, y: number, size: number) => {
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const angle = (Math.PI / 3) * i;
                        const x_i = x + size * Math.cos(angle);
                        const y_i = y + size * Math.sin(angle);
                        if (i === 0) {
                            ctx.moveTo(x_i, y_i);
                        } else {
                            ctx.lineTo(x_i, y_i);
                        }
                    }
                    ctx.closePath();
                    ctx.stroke();
                }
                
                const centerPoint = { x: drawWidth / 2, y: drawHeight / 2 };
                drawHexagon(centerPoint.x, centerPoint.y, 100 * scale);
                
                const addLetters = (centerX: number, centerY: number) => {
                    ctx.fillStyle = "#FFFFFF";
                    ctx.font = `${20 * scale}px Arial`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
                    const radius = 70 * scale;
                    letters.forEach((letter, index) => {
                        const angle = (2 * Math.PI / letters.length) * index - Math.PI / 2 - Math.PI / 12;
                        const x = centerX + radius * Math.cos(angle);
                        const y = centerY + radius * Math.sin(angle);
                        ctx.fillText(letter, x, y);
                    });
                }
                addLetters(centerPoint.x, centerPoint.y);
                
                const drawAlgaeCircles = (centerX: number, centerY: number) => {
                    const radius = 40 * scale;
                    const circleRadius = 15 * scale;
                    algaeStates.forEach((state, index) => {
                        const angle = (2 * Math.PI / algaeStates.length) * index - Math.PI / 2;
                        const x = centerX + radius * Math.cos(angle);
                        const y = centerY + radius * Math.sin(angle);
                        if (state === 'present') {
                            ctx.fillStyle = "#00FF00"; // Green for present
                        }
                        else if (state === 'next') {
                            ctx.fillStyle = "#FFFF00"; // Yellow for next
                        }
                        else {
                            ctx.fillStyle = "#FF0000"; // Red for absent
                        }
                        ctx.beginPath();
                        ctx.arc(x, y, circleRadius, 0, 2 * Math.PI);
                        ctx.fill();
                    });
                }
                drawAlgaeCircles(centerPoint.x, centerPoint.y);
                
                const drawCoralCircles = (centerX: number, centerY: number) => {
                    // Arrange coral into 12 lines of 3 circles each
                    // The line should radiate out from the edge of the hexagon
                    // They should be orthogonal to the hexagon side
                    // There should be two lines per hexagon side
                    const hexagonSize = 120 * scale;
                    const circleRadius = 15 * scale;
                    const centerSpacing = 25 * scale;
                    const coralSpacing = 35 * scale;
                    
                    for (let i = 0; i < 6; i++)
                    {
                        const angleToEdgeCenter = (Math.PI / 3) * i - Math.PI / 2;
                        const angleToEdgeNormal = angleToEdgeCenter + Math.PI / 2;
                        const edgeCenterX = centerX + hexagonSize * Math.cos(angleToEdgeCenter);
                        const edgeCenterY = centerY + hexagonSize * Math.sin(angleToEdgeCenter);
                        const start1X = edgeCenterX + centerSpacing * Math.cos(angleToEdgeNormal);
                        const start1Y = edgeCenterY + centerSpacing * Math.sin(angleToEdgeNormal);
                        const start2X = edgeCenterX - centerSpacing * Math.cos(angleToEdgeNormal);
                        const start2Y = edgeCenterY - centerSpacing * Math.sin(angleToEdgeNormal);
                        
                        for (let j = 0; j < 3; j++)
                        {
                            const index1 = i * 6 + j * 2;
                            const index2 = i * 6 + j * 2 + 1;
                            const x1 = start1X + j * coralSpacing * Math.cos(angleToEdgeCenter);
                            const y1 = start1Y + j * coralSpacing * Math.sin(angleToEdgeCenter);
                            const x2 = start2X + j * coralSpacing * Math.cos(angleToEdgeCenter);
                            const y2 = start2Y + j * coralSpacing * Math.sin(angleToEdgeCenter);
                            
                            if (coralStates[index1] === 'present') {
                                ctx.fillStyle = "#FFA500"; // Orange for present
                            }
                            else if (coralStates[index1] === 'next') {
                                ctx.fillStyle = "#FFFF00"; // Yellow for next
                            }
                            else {
                                ctx.fillStyle = "#FF0000"; // Red for absent
                            }
                            ctx.beginPath();
                            ctx.arc(x1, y1, circleRadius, 0, 2 * Math.PI);
                            ctx.fill();
                            
                            if (coralStates[index2] === 'present') {
                                ctx.fillStyle = "#FFA500"; // Orange for present
                            }
                            else if (coralStates[index2] === 'next') {
                                ctx.fillStyle = "#FFFF00"; // Yellow for next
                            }
                            else {
                                ctx.fillStyle = "#FF0000"; // Red for absent
                            }
                            ctx.beginPath();
                            ctx.arc(x2, y2, circleRadius, 0, 2 * Math.PI);
                            ctx.fill();
                        }
                    }
                }
                drawCoralCircles(centerPoint.x, centerPoint.y);
            }
        }
    }, [algaeStates, coralStates]); // Added dependencies to redraw when states change
    const handleClick = (event: React.MouseEvent) => {
        // Change the state of the clicked corals or algae
        const x = event.clientX;
        const y = event.clientY;
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const canvasX = x - rect.left;
            const canvasY = y - rect.top;
            const drawWidth = canvasRef.current.clientWidth;
            const drawHeight = canvasRef.current.clientHeight;
            const minDimension = Math.min(drawWidth, drawHeight);
            const scale = minDimension / 400 * 0.9; // Base scale factor
            const centerPoint = { x: drawWidth / 2, y: drawHeight / 2 };
            const radiusAlgae = 40 * scale;
            const radiusCoral = 120 * scale;
            const circleRadius = 15 * scale;
            console.log(`Click at (${canvasX}, ${canvasY})`);
            // Check algae circles
            for (let i = 0; i < algaeStates.length; i++) {
                const angle = (2 * Math.PI / algaeStates.length) * i - Math.PI / 2;
                const algaeX = centerPoint.x + radiusAlgae * Math.cos(angle);
                const algaeY = centerPoint.y + radiusAlgae * Math.sin(angle);
                const dist = Math.hypot(canvasX - algaeX, canvasY - algaeY);
                if (dist <= circleRadius) {
                    // Clicked on this algae
                    const newStates = [...algaeStates];
                    if (newStates[i] === 'present') {
                        newStates[i] = 'next';
                    } else if (newStates[i] === 'next') {
                        newStates[i] = 'absent';
                    } else {
                        newStates[i] = 'present';
                    }
                    setAlgaeStates(newStates);
                    return;
                }
            }
            // Check coral circles
            for (let i = 0; i < coralStates.length; i++) {
                // Calculate position based on the same logic as drawing
                const hexagonSize = 120 * scale;
                const centerSpacing = 25 * scale;
                const coralSpacing = 35 * scale;
                
                const side = Math.floor(i / 6);
                const positionInSide = i % 6;
                const line = Math.floor(positionInSide / 2);
                const indexInLine = positionInSide % 2;
                
                const angleToEdgeCenter = (Math.PI / 3) * side - Math.PI / 2;
                const angleToEdgeNormal = angleToEdgeCenter + Math.PI / 2;
                const edgeCenterX = centerPoint.x + hexagonSize * Math.cos(angleToEdgeCenter);
                const edgeCenterY = centerPoint.y + hexagonSize * Math.sin(angleToEdgeCenter);
                const startX = edgeCenterX + (indexInLine === 0 ? centerSpacing : -centerSpacing) * Math.cos(angleToEdgeNormal);
                const startY = edgeCenterY + (indexInLine === 0 ? centerSpacing : -centerSpacing) * Math.sin(angleToEdgeNormal);
                
                const coralX = startX + line * coralSpacing * Math.cos(angleToEdgeCenter);
                const coralY = startY + line * coralSpacing * Math.sin(angleToEdgeCenter);
                
                const dist = Math.hypot(canvasX - coralX, canvasY - coralY);
                if (dist <= circleRadius) {
                    // Clicked on this coral
                    const newStates = [...coralStates];
                    if (newStates[i] === 'present') {
                        newStates[i] = 'next';
                    } else if (newStates[i] === 'next') {
                        newStates[i] = 'absent';
                    } else {
                        newStates[i] = 'present';
                    }
                    setCoralStates(newStates);
                    return;
                }
            }
            // Click was outside any interactive elements
            return;
        }
    }
    
    return (
        <canvas ref={canvasRef} style={{maxWidth: '100%', maxHeight: '100%', aspectRatio: 1}}
            onClick={handleClick}>
            Your browser does not support the HTML5 canvas tag.
        </canvas>
    )
}

export default ReefscapeDisplay;