import { useCallback, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';

const MAX_DISTANCE = 96;

function getDockMetrics(node, mouseY) {
  if (!node || mouseY === null) return { proximity: 0, scale: 1, shift: 0 };
  const rect = node.getBoundingClientRect();
  const centerY = rect.top + rect.height / 2;
  const distance = Math.abs(mouseY - centerY);
  const proximity = Math.max(0, 1 - distance / MAX_DISTANCE);
  return { proximity, scale: 1 + proximity * 0.07, shift: proximity * 2.5 };
}

export default function SidebarDock({ items, renderIcon, onNavigate }) {
  const [mouseY, setMouseY] = useState(null);
  const itemNodes = useRef([]);
  const rafRef = useRef(null);

  // Throttle mousemove to one update per animation frame
  const handleMouseMove = useCallback((event) => {
    const y = event.clientY;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      setMouseY(y);
      rafRef.current = null;
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setMouseY(null);
  }, []);

  const assignItemNode = (index) => (node) => {
    itemNodes.current[index] = node;
  };

  return (
    <div
      className="sidebar-dock pb-3"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {items.map(({ to, label, icon }, index) => {
        const metrics = getDockMetrics(itemNodes.current[index], mouseY);

        return (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            ref={assignItemNode(index)}
            className="sidebar-dock-link"
            style={({ isActive }) => ({
              transform: `translateX(${metrics.shift}px)`,
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              background: isActive
                ? 'linear-gradient(135deg, rgba(255,255,255,0.16), rgba(43,0,255,0.12))'
                : `rgba(255,255,255,${0.03 + metrics.proximity * 0.035})`,
              border: `1px solid ${
                isActive ? 'rgba(255,255,255,0.18)' : `rgba(255,255,255,${0.06 + metrics.proximity * 0.06})`
              }`,
              boxShadow: isActive
                ? '0 14px 28px rgba(0,0,0,0.24), 0 0 18px rgba(43,0,255,0.1)'
                : `0 10px 20px rgba(0,0,0,0.16), 0 0 ${10 + metrics.proximity * 12}px rgba(123,144,255,${
                    0.015 + metrics.proximity * 0.03
                  })`,
            })}
          >
            {({ isActive }) => (
              <>
                <span
                  className="sidebar-dock-icon-shell"
                  style={{
                    transform: `scale(${metrics.scale})`,
                    background: isActive
                      ? 'rgba(255,255,255,0.17)'
                      : `rgba(255,255,255,${0.065 + metrics.proximity * 0.045})`,
                    boxShadow: isActive
                      ? '0 12px 24px rgba(43,0,255,0.14)'
                      : `0 8px 18px rgba(0,0,0,0.15), 0 0 ${8 + metrics.proximity * 12}px rgba(255,255,255,${
                          0.012 + metrics.proximity * 0.02
                        })`,
                  }}
                >
                  {renderIcon(icon, 'h-[0.95rem] w-[0.95rem]')}
                </span>

                <span className="sidebar-dock-label">{label}</span>

                <span
                  className="sidebar-dock-indicator"
                  style={{
                    opacity: isActive ? 1 : 0.24 + metrics.proximity * 0.32,
                    transform: `scaleY(${0.76 + (isActive ? 0.24 : metrics.proximity * 0.14)})`,
                    background: isActive ? '#ffffff' : 'rgba(255,255,255,0.42)',
                  }}
                />
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  );
}
