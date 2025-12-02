import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Circle, Rect, Ellipse, Line, RegularPolygon, Star, Arrow, Transformer, Text } from 'react-konva';
import io from 'socket.io-client';
import { useLocation } from 'react-router-dom';
import '../styles/CanvasCSS.css';

const DraggableShape = ({ shapeProps, isSelected, onSelect, onChange, editingText, setEditingText }) => {
  const shapeRef = useRef();
  const trRef = useRef();
  const [isEditing, setIsEditing] = useState(false);
  const [textValue, setTextValue] = useState(shapeProps.text || '');

  useEffect(() => {
  if (isSelected && shapeProps.type !== 'text' && shapeProps.type !== 'pen') {
    trRef.current.nodes([shapeRef.current]);
    trRef.current.getLayer().batchDraw();
  }
}, [isSelected, shapeProps.type]);

  const handleDragEnd = (e) => {
    onChange({
      ...shapeProps,
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    let updatedProps = {
      ...shapeProps,
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
    };

    if (shapeProps.type === 'circle') {
      updatedProps.radius = Math.max(5, shapeProps.radius * Math.min(scaleX, scaleY));
    } else if (shapeProps.type === 'rectangle') {
      updatedProps.width = Math.max(10, shapeProps.width * scaleX);
      updatedProps.height = Math.max(10, shapeProps.height * scaleY);
    } else if (shapeProps.type === 'ellipse') {
      updatedProps.radiusX = Math.max(5, shapeProps.radiusX * scaleX);
      updatedProps.radiusY = Math.max(5, shapeProps.radiusY * scaleY);
    } else if (shapeProps.type === 'polygon' || shapeProps.type === 'star') {
      updatedProps.radius = Math.max(5, shapeProps.radius * Math.min(scaleX, scaleY));
      if (shapeProps.type === 'star') {
        updatedProps.innerRadius = Math.max(5, shapeProps.innerRadius * Math.min(scaleX, scaleY));
        updatedProps.outerRadius = Math.max(5, shapeProps.outerRadius * Math.min(scaleX, scaleY));
      }
    } else if (shapeProps.type === 'line' || shapeProps.type === 'arrow') {
      updatedProps.points = shapeProps.points.map((point, index) => {
        return index % 2 === 0 ? point * scaleX : point * scaleY;
      });
    } else if (shapeProps.type === 'text') {
      updatedProps.fontSize = Math.max(8, shapeProps.fontSize * Math.min(scaleX, scaleY));
      updatedProps.width = Math.max(50, shapeProps.width * scaleX);
    }

    onChange(updatedProps);
  };

  const handleTextDblClick = (e) => {
  e.cancelBubble = true;
  if (shapeProps.type === 'text') {
    const stage = e.target.getStage();
    const stageBox = stage.container().getBoundingClientRect();
    setEditingText({
      id: shapeProps.id,
      x: stageBox.left + shapeProps.x,
      y: stageBox.top + shapeProps.y,
      text: shapeProps.text,
      fontSize: shapeProps.fontSize,
      fontFamily: shapeProps.fontFamily,
      fontStyle: shapeProps.fontStyle,
      fill: shapeProps.fill,
    });
  }
};

  const commonProps = {
    ref: shapeRef,
    draggable: !isEditing,
    x: shapeProps.x,
    y: shapeProps.y,
    rotation: shapeProps.rotation,
    fill: shapeProps.fill,
    stroke: shapeProps.stroke,
    strokeWidth: shapeProps.strokeWidth,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
  };

  let shape;
  switch (shapeProps.type) {
    case 'circle':
      shape = <Circle {...commonProps} radius={shapeProps.radius} />;
      break;
    case 'rectangle':
      shape = <Rect {...commonProps} width={shapeProps.width} height={shapeProps.height} />;
      break;
    case 'ellipse':
      shape = <Ellipse {...commonProps} radiusX={shapeProps.radiusX} radiusY={shapeProps.radiusY} />;
      break;
    case 'polygon':
      shape = <RegularPolygon {...commonProps} radius={shapeProps.radius} sides={shapeProps.sides} />;
      break;
    case 'star':
      shape = <Star {...commonProps} numPoints={shapeProps.numPoints} innerRadius={shapeProps.innerRadius} outerRadius={shapeProps.outerRadius} />;
      break;
    case 'line':
      shape = <Line {...commonProps} points={shapeProps.points} />;
      break;
    case 'arrow':
      shape = <Arrow {...commonProps} points={shapeProps.points} />;
      break;
    case 'pen':
      shape = <Line {...commonProps} points={shapeProps.points} lineCap="round" lineJoin="round" />;
      break;
    case 'text':
      shape = (
        <Text
          {...commonProps}
          text={shapeProps.text}
          fontSize={shapeProps.fontSize}
          fontFamily={shapeProps.fontFamily}
          fontStyle={shapeProps.fontStyle}
          width={shapeProps.width}
          onDblClick={handleTextDblClick}
          onDblTap={handleTextDblClick}
        />
      );
      break;
    default:
      shape = null;
  }

  return (
    <>
      {shape}
      {isSelected && shapeProps.type !== 'pen' && !isEditing && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
      {isSelected && shapeProps.type !== 'pen' && !editingText && (
  <Transformer
    ref={trRef}
    boundBoxFunc={(oldBox, newBox) => {
      if (newBox.width < 5 || newBox.height < 5) {
        return oldBox;
      }
      return newBox;
    }}
  />
)}
    </>
  );
};

const Canvas = () => {
  const [shapes, setShapes] = useState([]);
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#fbbf24');
  const [tool, setTool] = useState('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [penWidth, setPenWidth] = useState(3);
  const [eraserSize, setEraserSize] = useState(20);
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontStyle, setFontStyle] = useState('normal');
  const [latency, setLatency] = useState(0);

  const location = useLocation();
  const socketRef = useRef(null);
  const roomId = location?.state?.room?.id;
  const userId = location?.state?.userId;
  const username = location?.state?.username;
  const canvasRef = useRef(null);
  const [canvasBg, setCanvasBg] = useState("#ffffff");
  const [editingText, setEditingText] = useState(null);
  useEffect(() => {
    console.log('Room ID:', roomId);
    console.log('User ID:', userId);
    console.log('Username:', username);
  }, []);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');

    if (roomId && userId) {
      socketRef.current.emit('join-room', {
        roomId,
        username: username || `User-${userId.slice(0, 4)}`
      });

      socketRef.current.on('room-joined', ({ shapes: initialShapes, backgroundColor }) => {
        console.log('Room joined, initial shapes:', initialShapes);
        setShapes(initialShapes || []);
        if (backgroundColor) {
          setCanvasBg(backgroundColor);
        }
      });

      socketRef.current.on('shape-added', ({ shape, userId: senderId }) => {
        const startTime = Date.now();
        if (senderId !== userId) {
          setShapes(prev => [...prev, shape]);
          const endTime = Date.now();
          const latencyMs = endTime - startTime;
          setLatency(latencyMs);
          console.log(`Shape added latency: ${latencyMs}ms`);
        }
      });

      socketRef.current.on('shape-updated', ({ shape, userId: senderId }) => {
        const startTime = Date.now();
        if (senderId !== userId) {
          setShapes(prev => prev.map(s => s.id === shape.id ? shape : s));
          const endTime = Date.now();
          const latencyMs = endTime - startTime;
          setLatency(latencyMs);
          console.log(`Shape updated latency: ${latencyMs}ms`);
        }
      });

      socketRef.current.on('shape-deleted', ({ shapeId, userId: senderId }) => {
        const startTime = Date.now();
        if (senderId !== userId) {
          setShapes(prev => prev.filter(s => s.id !== shapeId));
          const endTime = Date.now();
          const latencyMs = endTime - startTime;
          setLatency(latencyMs);
          console.log(`Shape deleted latency: ${latencyMs}ms`);
        }
      });

      socketRef.current.on('canvas-cleared', ({ userId: senderId }) => {
        const startTime = Date.now();
        if (senderId !== userId) {
          setShapes([]);
          const endTime = Date.now();
          const latencyMs = endTime - startTime;
          setLatency(latencyMs);
          console.log(`Canvas cleared latency: ${latencyMs}ms`);
        }
      });
      socketRef.current.on('background-changed', ({ color, userId: senderId }) => {
        if (senderId !== userId) {
          setCanvasBg(color);
          console.log(`Background changed to ${color}`);
        }
      });
    }

    return () => {
      socketRef.current.disconnect();
    };
  }, [roomId, userId, username]);

  const emitShapeAdded = (shape) => {
    const startTime = Date.now();
    socketRef.current.emit('shape-added', { shape });
    console.log(`Emitted shape-added at ${startTime}`);
  };

  const emitShapeUpdated = (shape) => {
    const startTime = Date.now();
    socketRef.current.emit('shape-updated', { shape });
    console.log(`Emitted shape-updated at ${startTime}`);
  };

  const emitShapeDeleted = (shapeId) => {
    const startTime = Date.now();
    socketRef.current.emit('shape-deleted', { shapeId });
    console.log(`Emitted shape-deleted at ${startTime}`);
  };

  const emitCanvasCleared = () => {
    const startTime = Date.now();
    socketRef.current.emit('canvas-cleared');
    console.log(`Emitted canvas-cleared at ${startTime}`);
  };
  const emitBackgroundChanged = (color) => {
  const startTime = Date.now();
  socketRef.current.emit('background-changed', { color });
  console.log(`Emitted background-changed at ${startTime}`);
};
  const primaryColors = [
    '#fbbf24', '#f59e0b', '#d97706', '#b45309',
    '#f97316', '#ea580c', '#fde68a', '#fef3c7'
  ];

  const fontFamilies = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Comic Sans MS'];
  const fontStyles = ['normal', 'bold', 'italic', 'bold italic'];

  const saveToHistory = (newShapes) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newShapes]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setShapes([...history[historyIndex - 1]]);
      setSelectedId(null);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setShapes([...history[historyIndex + 1]]);
      setSelectedId(null);
    }
  };

  const checkDeselect = (e) => {
    if (tool === 'select') {
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        setSelectedId(null);
      }
    }
  };

  const handleMouseDown = (e) => {
    checkDeselect(e);
    
    if (tool === 'pen') {
      setIsDrawing(true);
      const pos = e.target.getStage().getPointerPosition();
      setCurrentPath([pos.x, pos.y]);
    } else if (tool === 'eraser') {
      const pos = e.target.getStage().getPointerPosition();
      eraseAtPosition(pos.x, pos.y);
    } else if (tool === 'text') {
      const pos = e.target.getStage().getPointerPosition();
      if (e.target === e.target.getStage()) {
        addText(pos.x, pos.y);
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    
    if (tool === 'pen') {
      setCurrentPath([...currentPath, point.x, point.y]);
    } else if (tool === 'eraser') {
      eraseAtPosition(point.x, point.y);
    }
  };

  const handleMouseUp = () => {
    if (tool === 'pen' && isDrawing) {
      const newShape = {
        id: Date.now(),
        type: 'pen',
        points: currentPath,
        stroke: selectedColor,
        strokeWidth: penWidth,
        x: 0,
        y: 0,
        rotation: 0,
      };
      const newShapes = [...shapes, newShape];
      setShapes(newShapes);
      saveToHistory(newShapes);
      emitShapeAdded(newShape);
      setCurrentPath([]);
    }
    setIsDrawing(false);
  };

  const eraseAtPosition = (x, y) => {
    const newShapes = shapes.filter(shape => {
      const dx = x - shape.x;
      const dy = y - shape.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      let threshold = eraserSize / 2;
      if (shape.type === 'circle') {
        threshold += shape.radius;
      } else if (shape.type === 'rectangle') {
        threshold += Math.max(shape.width, shape.height) / 2;
      } else if (shape.type === 'ellipse') {
        threshold += Math.max(shape.radiusX, shape.radiusY);
      } else if (shape.type === 'polygon' || shape.type === 'star') {
        threshold += shape.radius || shape.outerRadius || 50;
      } else if (shape.type === 'text') {
        threshold += Math.max(shape.width || 100, shape.fontSize || 24);
      } else if (shape.type === 'pen') {
        for (let i = 0; i < shape.points.length; i += 2) {
          const pointX = shape.points[i] + shape.x;
          const pointY = shape.points[i + 1] + shape.y;
          const pointDistance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
          if (pointDistance < eraserSize / 2) {
            return false;
          }
        }
        return true;
      } else {
        threshold += 30;
      }
      
      return distance > threshold;
    });
    
    if (newShapes.length !== shapes.length) {
      const deletedShapes = shapes.filter(s => !newShapes.includes(s));
      setShapes(newShapes);
      saveToHistory(newShapes);
      deletedShapes.forEach(shape => emitShapeDeleted(shape.id));
    }
  };

  const addText = (x, y) => {
  const id = Date.now();
  const newShape = {
    id,
    type: 'text',
    x,
    y,
    text: 'Double-click to edit',
    fontSize: fontSize,
    fontFamily: fontFamily,
    fontStyle: fontStyle,
    fill: selectedColor,
    stroke: selectedColor,
    strokeWidth: 0,
    width: 200,
    rotation: 0,
  };

  const newShapes = [...shapes, newShape];
  setShapes(newShapes);
  saveToHistory(newShapes);
  emitShapeAdded(newShape);
  setSelectedId(id);
  setTool('select'); // Auto-switch to select mode after adding text
};

  const addShape = (type) => {
    const id = Date.now();
    let newShape = {
      id,
      type,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      fill: selectedColor,
      stroke: 'black',
      strokeWidth: 2,
      rotation: 0,
    };

    switch (type) {
      case 'circle':
        newShape.radius = 50;
        break;
      case 'rectangle':
        newShape.width = 100;
        newShape.height = 60;
        break;
      case 'ellipse':
        newShape.radiusX = 80;
        newShape.radiusY = 40;
        break;
      case 'polygon':
        newShape.radius = 50;
        newShape.sides = 6;
        break;
      case 'star':
        newShape.numPoints = 5;
        newShape.innerRadius = 30;
        newShape.outerRadius = 60;
        break;
      case 'line':
        newShape.points = [-50, 0, 50, 0];
        newShape.stroke = selectedColor;
        newShape.strokeWidth = 4;
        delete newShape.fill;
        break;
      case 'arrow':
        newShape.points = [-50, 0, 50, 0];
        newShape.stroke = selectedColor;
        newShape.strokeWidth = 4;
        break;
    }

    const newShapes = [...shapes, newShape];
    setShapes(newShapes);
    saveToHistory(newShapes);
    emitShapeAdded(newShape);
  };

  const updateShape = (newAttrs) => {
    const newShapes = shapes.map(shape => 
      shape.id === newAttrs.id ? newAttrs : shape
    );
    setShapes(newShapes);
    saveToHistory(newShapes);
    emitShapeUpdated(newAttrs);
  };

  const deleteSelected = () => {
    if (selectedId) {
      const newShapes = shapes.filter(shape => shape.id !== selectedId);
      setShapes(newShapes);
      saveToHistory(newShapes);
      emitShapeDeleted(selectedId);
      setSelectedId(null);
    }
  };

  const clearCanvas = () => {
    setShapes([]);
    saveToHistory([]);
    setSelectedId(null);
    emitCanvasCleared();
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
    
    if (selectedId) {
      const newShapes = shapes.map(shape => 
        shape.id === selectedId ? { ...shape, fill: color, stroke: color } : shape
      );
      setShapes(newShapes);
      saveToHistory(newShapes);
      const updatedShape = newShapes.find(s => s.id === selectedId);
      emitShapeUpdated(updatedShape);
    }
  };

  const updateSelectedTextProperty = (property, value) => {
  if (selectedId) {
    const selectedShape = shapes.find(shape => shape.id === selectedId);
    if (selectedShape && selectedShape.type === 'text') {
      const updatedShape = { ...selectedShape, [property]: value };
      const newShapes = shapes.map(shape => 
        shape.id === selectedId ? updatedShape : shape
      );
      setShapes(newShapes);
      saveToHistory(newShapes);
      emitShapeUpdated(updatedShape);
    }
  } else {
    // Update default values for new text
    if (property === 'fontSize') setFontSize(value);
    if (property === 'fontFamily') setFontFamily(value);
    if (property === 'fontStyle') setFontStyle(value);
  }
};

  const getLatencyClass = () => {
    if (latency < 100) return '';
    if (latency < 200) return 'warning';
    return 'error';
  };
// Change Background Color for Konva Stage
const changeBackgroundColor = (color) => {
  setCanvasBg(color);
  emitBackgroundChanged(color);
};

// Download Canvas using Konva
const downloadCanvas = () => {
  const uri = canvasRef.current.toDataURL();
  const link = document.createElement("a");
  link.download = `syncpad_canvas_${Date.now()}.png`;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


  return (
    <div className="canvas-container">

      <div className="toolbar">
        <div className="toolbar-header">
          <h3 className="toolbar-title">Drawing Tools</h3>
          <h4 className="room-info">
            Room: {roomId}
    <button 
      onClick={() => {
        navigator.clipboard.writeText(roomId);
        alert('Room ID copied to clipboard!');
      }}
      className="copy-btn"
      title="Copy Room ID"
      style={{
        marginLeft: '8px',
        padding: '4px 8px',
        background: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
      }}
    >
      📋 Copy
    </button>
          </h4>
        </div>

        <div className="toolbar-section">
          <div className="undo-redo-btns">
            <button onClick={undo} disabled={historyIndex <= 0} className="undo-btn">
              ↶ Undo
            </button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="redo-btn">
              ↷ Redo
            </button>
          </div>
        </div>

        <div className="toolbar-section">
          <div className="current-tool-display">
            Current Tool: <span className="current-tool-name">{tool.charAt(0).toUpperCase() + tool.slice(1)}</span>
          </div>
          <div className="tool-buttons">
            {[
              { tool: 'select', label: 'Select', icon: '⟲' },
              { tool: 'pen', label: 'Pen', icon: '✏️' },
              { tool: 'text', label: 'Text', icon: 'T' },
              { tool: 'eraser', label: 'Eraser', icon: '🧽' }
            ].map(({ tool: toolType, label, icon }) => (
              <button
                key={toolType}
                onClick={() => setTool(toolType)}
                className={`tool-btn ${tool === toolType ? 'active' : ''}`}
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
        
<div className="toolbar-section">

  <div className="setting-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    <label className="setting-label">Background</label>

    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <input
        type="color"
        className="color-picker"
        value={canvasBg}
        onChange={(e) => changeBackgroundColor(e.target.value)}
        title="Pick background color"
      />

      <button onClick={downloadCanvas} className="download-btn">
        Download Canvas
      </button>
    </div>
  </div>

</div>

        <div className="toolbar-section">
          <div className="text-settings-panel">
            <h4 className="text-settings-title">Text Settings</h4>
            
            <div className="setting-group">
              <label className="setting-label">
                Font Size: {fontSize}px
              </label>
              <input
                type="range"
                min="8"
                max="72"
                value={fontSize}
                onChange={(e) => {
                  const newSize = parseInt(e.target.value);
                  setFontSize(newSize);
                  updateSelectedTextProperty('fontSize', newSize);
                }}
                className="range-input"
              />
            </div>

            <div className="setting-group">
              <label className="setting-label">Font Family</label>
              <select
                value={fontFamily}
                onChange={(e) => {
                  setFontFamily(e.target.value);
                  updateSelectedTextProperty('fontFamily', e.target.value);
                }}
                className="select-input"
              >
                {fontFamilies.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>

            <div className="setting-group">
              <label className="setting-label">Font Style</label>
              <select
                value={fontStyle}
                onChange={(e) => {
                  setFontStyle(e.target.value);
                  updateSelectedTextProperty('fontStyle', e.target.value);
                }}
                className="select-input"
              >
                {fontStyles.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {tool === 'pen' && (
          <div className="toolbar-section">
            <label className="setting-label">
              Pen Width: {penWidth}px
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={penWidth}
              onChange={(e) => setPenWidth(parseInt(e.target.value))}
              className="range-input"
            />
          </div>
        )}

        {tool === 'eraser' && (
          <div className="toolbar-section">
            <label className="setting-label">
              Eraser Size: {eraserSize}px
            </label>
            <input
              type="range"
              min="10"
              max="50"
              value={eraserSize}
              onChange={(e) => setEraserSize(parseInt(e.target.value))}
              className="range-input"
            />
          </div>
        )}
        
        <div className="toolbar-section">
          <div className="color-info">
            Current Color: <span className="current-color-dot" style={{ backgroundColor: selectedColor }}></span>
            {selectedId && <span className="color-hint">(Click color to change selected shape)</span>}
          </div>
          <div className="color-palette">
            {primaryColors.map(color => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`color-btn ${selectedColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
              />
            ))}
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="color-picker"
            />
          </div>
        </div>
        
        <div className="toolbar-section">
          <span className="section-label">Add Shapes</span>
          <div className="shape-grid">
            {[
              { type: 'circle', label: 'Circle', icon: '●' },
              { type: 'rectangle', label: 'Rectangle', icon: '▬' },
              { type: 'ellipse', label: 'Ellipse', icon: '⬭' },
              { type: 'polygon', label: 'Polygon', icon: '⬢' },
              { type: 'star', label: 'Star', icon: '★' },
              { type: 'line', label: 'Line', icon: '─' },
              { type: 'arrow', label: 'Arrow', icon: '→' }
            ].map(({ type, label, icon }) => (
              <button
                key={type}
                onClick={() => addShape(type)}
                className="shape-btn"
              >
                <span className="shape-icon">{icon}</span>
                <span className="shape-label">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar-section">
          <div className="action-buttons">
            <button onClick={deleteSelected} disabled={!selectedId} className="delete-btn">
              Delete
            </button>
            <button onClick={clearCanvas} className="clear-btn">
              Clear All
            </button>
          </div>
        </div>

        <div className="info-text">
          <div className="info-line"><span className="info-label">Mode:</span> {tool}</div>
          <div className="info-line"><span className="info-label">Shapes:</span> {shapes.length}</div>
          <div className="info-line"><span className="info-label">Selected:</span> {selectedId || 'None'}</div>
          <div className="help-text">
            {tool === 'pen' && 'Click and drag to draw freely'}
            {tool === 'eraser' && 'Click and drag to erase'}
            {tool === 'text' && 'Click anywhere to add text'}
            {tool === 'select' && 'Click shapes to select • Drag to move • Use handles to resize • Double-click text to edit'}
          </div>
        </div>
      </div>

      <Stage
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        className={`canvas-stage ${
          tool === 'pen' ? 'pen-cursor' : 
          tool === 'eraser' ? 'eraser-cursor' : 
          tool === 'text' ? 'text-cursor' : ''
        }`}
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={window.innerWidth}
            height={window.innerHeight}
            fill={canvasBg}
            listening={false}   // so it doesn't block drawing
          />
          {shapes.map((shape) => (
            <DraggableShape
              key={shape.id}
              shapeProps={shape}
              isSelected={shape.id === selectedId}
              onSelect={() => tool === 'select' && setSelectedId(shape.id)}
              onChange={updateShape}
              editingText={editingText}
              setEditingText={setEditingText}
            />
          ))}
          {isDrawing && currentPath.length > 0 && (
            <Line
              points={currentPath}
              stroke={selectedColor}
              strokeWidth={penWidth}
              lineCap="round"
              lineJoin="round"
            />
          )}
        </Layer>
      </Stage>
      {editingText && (
        <input
          type="text"
          defaultValue={editingText.text}
          onBlur={(e) => {
            const newShapes = shapes.map(shape => 
              shape.id === editingText.id ? { ...shape, text: e.target.value } : shape
            );
            setShapes(newShapes);
            saveToHistory(newShapes);
            const updatedShape = newShapes.find(s => s.id === editingText.id);
            emitShapeUpdated(updatedShape);
            setEditingText(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.target.blur();
            }
            if (e.key === 'Escape') {
              setEditingText(null);
            }
          }}
          style={{
            position: 'fixed',
            left: `${editingText.x}px`,
            top: `${editingText.y}px`,
            fontSize: `${editingText.fontSize}px`,
            fontFamily: editingText.fontFamily,
            fontStyle: editingText.fontStyle,
            color: editingText.fill,
            border: '2px solid #3b82f6',
            padding: '4px 8px',
            background: 'white',
            minWidth: '150px',
            zIndex: 10000,
            outline: 'none',
          }}
          autoFocus
        />
      )}
    </div>
  );
};

export default Canvas;