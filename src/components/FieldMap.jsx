import { useRef, useEffect, useState } from 'react';

const FIELD_WIDTH_M = 651.22 * 0.0254;  // 16.541m
const FIELD_HEIGHT_M = 317.69 * 0.0254; // 8.069m
const ROBOT_SIZE_M = 0.6604;

// Hub positions (from FieldConstants.java) — in pose coords (origin top-right, x+ left)
const BLUE_HUB = { x: 182.11 * 0.0254, y: FIELD_HEIGHT_M / 2 };
const RED_HUB = { x: FIELD_WIDTH_M - 182.11 * 0.0254, y: FIELD_HEIGHT_M / 2 };

export default function FieldMap({
  paths = [],
  robotPose = null,
  showRobot = false,
  alliance = 'blue',
  width = 800,
  className = '',
}) {
  const canvasRef = useRef(null);
  const [fieldImage, setFieldImage] = useState(null);

  const height = Math.round(width * (FIELD_HEIGHT_M / FIELD_WIDTH_M));

  // Try to load field image once
  useEffect(() => {
    const img = new Image();
    img.onload = () => setFieldImage(img);
    img.onerror = () => setFieldImage(null);
    img.src = '/field.png';
  }, []);

  // Convert field coords (meters, origin top-right, x+ left, y+ down) to canvas pixels
  const toCanvas = (fieldX, fieldY) => ({
    x: (1 - fieldX / FIELD_WIDTH_M) * width,
    y: (fieldY / FIELD_HEIGHT_M) * height,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    // --- Background ---
    if (fieldImage) {
      ctx.drawImage(fieldImage, 0, 0, width, height);
    } else {
      drawPlaceholderField(ctx, width, height);
    }

    // --- Paths ---
    paths.forEach((pathPoints) => {
      if (!pathPoints || pathPoints.length < 2) return;
      ctx.beginPath();
      const start = toCanvas(pathPoints[0].x, pathPoints[0].y);
      ctx.moveTo(start.x, start.y);
      for (let i = 1; i < pathPoints.length; i++) {
        const pt = toCanvas(pathPoints[i].x, pathPoints[i].y);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = '#e6b422';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw start and end waypoint markers
      const first = toCanvas(pathPoints[0].x, pathPoints[0].y);
      const last = toCanvas(pathPoints[pathPoints.length - 1].x, pathPoints[pathPoints.length - 1].y);
      ctx.fillStyle = '#4caf78';
      ctx.beginPath();
      ctx.arc(first.x, first.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d94a4a';
      ctx.beginPath();
      ctx.arc(last.x, last.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // --- Robot ---
    if (showRobot && robotPose) {
      const pos = toCanvas(robotPose.x, robotPose.y);
      const robotSizePx = (ROBOT_SIZE_M / FIELD_WIDTH_M) * width;
      const headingRad = -(robotPose.heading * Math.PI) / 180;

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(headingRad);

      const half = robotSizePx / 2;
      const allianceColor = alliance === 'red' ? '#d94a4a' : '#4a90d9';

      // Square outline
      ctx.strokeStyle = allianceColor;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-half, -half, robotSizePx, robotSizePx);

      // Arrow pointing to front (+x direction)
      const arrowLen = half * 0.7;
      const arrowHead = half * 0.3;
      ctx.beginPath();
      ctx.moveTo(-arrowLen, 0);
      ctx.lineTo(arrowLen, 0);
      ctx.strokeStyle = allianceColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(arrowLen, 0);
      ctx.lineTo(arrowLen - arrowHead, -arrowHead * 0.6);
      ctx.moveTo(arrowLen, 0);
      ctx.lineTo(arrowLen - arrowHead, arrowHead * 0.6);
      ctx.stroke();

      ctx.restore();
    }
  }, [paths, robotPose, showRobot, alliance, width, height, fieldImage]);

  return (
    <div className={`field-map-container ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
      />
    </div>
  );
}

function drawPlaceholderField(ctx, w, h) {
  // Field background
  ctx.fillStyle = '#1a3a1a';
  ctx.fillRect(0, 0, w, h);

  // Border
  ctx.strokeStyle = '#e8e8ec';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, w - 4, h - 4);

  // Center line
  ctx.beginPath();
  ctx.moveTo(w / 2, 2);
  ctx.lineTo(w / 2, h - 2);
  ctx.strokeStyle = '#e8e8ec';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 6]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Alliance walls — blue on right, red on left
  ctx.fillStyle = 'rgba(217, 74, 74, 0.35)';
  ctx.fillRect(2, 2, 30, h - 4);
  ctx.fillStyle = 'rgba(42, 90, 143, 0.35)';
  ctx.fillRect(w - 32, 2, 30, h - 4);

  // Alliance labels
  ctx.save();
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#d94a4a';
  ctx.translate(16, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('RED', 0, 0);
  ctx.restore();

  ctx.save();
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#6ba3e0';
  ctx.translate(w - 16, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('BLUE', 0, 0);
  ctx.restore();

  // Hub markers
  const toCanvas = (fx, fy) => ({
    x: (1 - fx / FIELD_WIDTH_M) * w,
    y: (fy / FIELD_HEIGHT_M) * h,
  });

  const blueHub = toCanvas(BLUE_HUB.x, BLUE_HUB.y);
  const redHub = toCanvas(RED_HUB.x, RED_HUB.y);

  // Blue hub
  ctx.beginPath();
  ctx.arc(blueHub.x, blueHub.y, 12, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(42, 90, 143, 0.6)';
  ctx.fill();
  ctx.strokeStyle = '#6ba3e0';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Red hub
  ctx.beginPath();
  ctx.arc(redHub.x, redHub.y, 12, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(217, 74, 74, 0.6)';
  ctx.fill();
  ctx.strokeStyle = '#d94a4a';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Field dimensions label
  ctx.font = '10px monospace';
  ctx.fillStyle = '#606070';
  ctx.textAlign = 'center';
  ctx.fillText(`${FIELD_WIDTH_M}m x ${FIELD_HEIGHT_M}m`, w / 2, h - 8);
}
