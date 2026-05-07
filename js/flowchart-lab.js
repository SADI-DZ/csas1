/**
 * Flowchart Designer Module - Premium Edition
 * Interactive SVG-based flowchart builder for Informatics Lab.
 */

class FlowchartDesigner {
  constructor() {
    this.canvas = document.getElementById('flowCanvas');
    this.nodesGroup = document.getElementById('flowNodesGroup');
    this.connectionsGroup = document.getElementById('flowConnectionsGroup');
    this.tempGroup = document.getElementById('flowTempGroup');
    this.wrap = document.getElementById('flowCanvasWrap');
    
    this.nodes = [];
    this.edges = [];
    this.selectedId = null;
    this.draggingNode = null;
    this.connectingFrom = null;
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    
    this.zoom = 1;
    this.gridSize = 20;
    
    this.init();
  }

  init() {
    if (!this.canvas) return;

    // Tool item click listeners
    document.querySelectorAll('.shape-tool[data-shape]').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.dataset.shape;
        this.addNode(type);
      });
    });

    // Zoom controls
    document.getElementById('flowZoomIn').onclick = () => this.setZoom(this.zoom + 0.1);
    document.getElementById('flowZoomOut').onclick = () => this.setZoom(this.zoom - 0.1);
    document.getElementById('flowZoomReset').onclick = () => this.setZoom(1);

    // Global click to deselect
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.target === this.canvas || e.target.tagName === 'rect') {
        this.selectNode(null);
        if (e.button === 0 && !this.draggingNode) {
            this.isPanning = true;
            this.panStart = { x: e.clientX, y: e.clientY };
            this.wrap.style.cursor = 'grabbing';
        }
      }
    });

    // Mouse Move for dragging and connecting
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mouseup', (e) => this.handleMouseUp(e));

    // Keyboard events
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.selectedId && document.activeElement.tagName !== 'INPUT') {
          this.deleteNode(this.selectedId);
        }
      }
    });

    // Clear Canvas
    document.getElementById('flowClearBtn').onclick = () => {
      if (confirm('هل أنت متأكد من مسح المخطط بالكامل؟')) {
        this.nodes = [];
        this.edges = [];
        this.render();
      }
    };

    // Properties panel
    const textInput = document.getElementById('nodeTextInput');
    if (textInput) {
        textInput.oninput = (e) => {
            if (this.selectedId) {
                const node = this.nodes.find(n => n.id === this.selectedId);
                if (node) {
                    node.text = e.target.value;
                    this.render();
                }
            }
        };
    }

    const deleteBtn = document.getElementById('deleteNodeBtn');
    if (deleteBtn) {
        deleteBtn.onclick = () => {
            if (this.selectedId) this.deleteNode(this.selectedId);
        };
    }

    // Export
    document.getElementById('flowExportBtn').onclick = () => this.exportAsImage();

    // Language Toggle
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Logic to switch labels can be added here
        };
    });

    // Initial render
    this.render();
  }

  setZoom(val) {
    this.zoom = Math.max(0.2, Math.min(3, val));
    this.canvas.style.transform = `scale(${this.zoom})`;
    this.canvas.style.transformOrigin = '0 0';
    document.getElementById('flowZoomInfo').textContent = `${Math.round(this.zoom * 100)}%`;
  }

  addNode(type) {
    const scrollLeft = this.wrap.scrollLeft;
    const scrollTop = this.wrap.scrollTop;
    const centerX = (this.wrap.clientWidth / 2 + scrollLeft) / this.zoom;
    const centerY = (this.wrap.clientHeight / 2 + scrollTop) / this.zoom;

    const id = 'node_' + Date.now();
    let text = '';
    switch(type) {
      case 'start': text = 'بداية'; break;
      case 'process': text = 'عملية'; break;
      case 'decision': text = 'قرار؟'; break;
      case 'io': text = 'إدخال'; break;
      case 'connector': text = ''; break;
      case 'comment': text = 'تعليق...'; break;
    }

    this.nodes.push({
      id,
      type,
      x: Math.round(centerX / this.gridSize) * this.gridSize,
      y: Math.round(centerY / this.gridSize) * this.gridSize,
      text,
      width: type === 'connector' ? 40 : 120,
      height: type === 'connector' ? 40 : 60
    });

    this.render();
    this.selectNode(id);
  }

  selectNode(id) {
    this.selectedId = id;
    const props = document.getElementById('flowProperties');
    const textInput = document.getElementById('nodeTextInput');
    
    if (id) {
      const node = this.nodes.find(n => n.id === id);
      if (props) props.hidden = false;
      if (textInput) textInput.value = node.text;
    } else {
      if (props) props.hidden = true;
    }
    this.render();
  }

  deleteNode(id) {
    this.nodes = this.nodes.filter(n => n.id !== id);
    this.edges = this.edges.filter(e => e.from !== id && e.to !== id);
    this.selectedId = null;
    this.render();
  }

  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / this.zoom,
      y: (e.clientY - rect.top) / this.zoom
    };
  }

  handleMouseMove(e) {
    const pos = this.getMousePos(e);

    if (this.draggingNode) {
      const node = this.nodes.find(n => n.id === this.draggingNode.id);
      if (node) {
        node.x = Math.round((pos.x - this.draggingNode.offsetX) / this.gridSize) * this.gridSize;
        node.y = Math.round((pos.y - this.draggingNode.offsetY) / this.gridSize) * this.gridSize;
        this.render();
      }
      return;
    }

    if (this.connectingFrom) {
      this.renderTempLine(pos);
      return;
    }

    if (this.isPanning) {
        const dx = e.clientX - this.panStart.x;
        const dy = e.clientY - this.panStart.y;
        this.wrap.scrollLeft -= dx;
        this.wrap.scrollTop -= dy;
        this.panStart = { x: e.clientX, y: e.clientY };
    }
  }

  handleMouseUp(e) {
    if (this.connectingFrom) {
      const pos = this.getMousePos(e);
      // Find if we dropped on another node
      const target = this.nodes.find(n => {
        const dx = pos.x - n.x;
        const dy = pos.y - n.y;
        return Math.abs(dx) < n.width/2 && Math.abs(dy) < n.height/2;
      });

      if (target && target.id !== this.connectingFrom.id) {
        const exists = this.edges.find(edge => edge.from === this.connectingFrom.id && edge.to === target.id);
        if (!exists) {
          this.edges.push({
            from: this.connectingFrom.id,
            to: target.id,
            fromAnchor: this.connectingFrom.anchor,
            toAnchor: 'top'
          });
        }
      }
      this.connectingFrom = null;
      this.tempGroup.innerHTML = '';
      this.render();
    }
    this.draggingNode = null;
    this.isPanning = false;
    this.wrap.style.cursor = 'grab';
  }

  renderTempLine(pos) {
    const fromNode = this.nodes.find(n => n.id === this.connectingFrom.id);
    if (!fromNode) return;
    
    const start = this.getAnchorPos(fromNode, this.connectingFrom.anchor);
    this.tempGroup.innerHTML = `
      <line x1="${start.x}" y1="${start.y}" x2="${pos.x}" y2="${pos.y}" 
            stroke="var(--flow-primary)" stroke-width="2" stroke-dasharray="5,5" />
    `;
  }

  getAnchorPos(node, anchor) {
    const w = node.width, h = node.height;
    switch(anchor) {
      case 'top': return { x: node.x, y: node.y - h/2 };
      case 'bottom': return { x: node.x, y: node.y + h/2 };
      case 'left': return { x: node.x - w/2, y: node.y };
      case 'right': return { x: node.x + w/2, y: node.y };
      default: return { x: node.x, y: node.y };
    }
  }

  render() {
    this.nodesGroup.innerHTML = '';
    this.connectionsGroup.innerHTML = '';

    // Render Edges
    this.edges.forEach(edge => {
      const fromNode = this.nodes.find(n => n.id === edge.from);
      const toNode = this.nodes.find(n => n.id === edge.to);
      if (!fromNode || !toNode) return;

      const start = this.getAnchorPos(fromNode, edge.fromAnchor);
      const end = this.getAnchorPos(toNode, edge.toAnchor);

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const midY = (start.y + end.y) / 2;
      path.setAttribute('d', `M ${start.x} ${start.y} C ${start.x} ${midY}, ${end.x} ${midY}, ${end.x} ${end.y}`);
      path.setAttribute('class', 'flow-edge');
      this.connectionsGroup.appendChild(path);
    });

    // Render Nodes
    this.nodes.forEach(node => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', `flow-node node-${node.type} ${this.selectedId === node.id ? 'is-selected' : ''}`);
      g.setAttribute('transform', `translate(${node.x}, ${node.y})`);

      let shape;
      const w = node.width, h = node.height;

      if (node.type === 'start' || node.type === 'end') {
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        shape.setAttribute('x', -w/2);
        shape.setAttribute('y', -h/2);
        shape.setAttribute('width', w);
        shape.setAttribute('height', h);
        shape.setAttribute('rx', h/2);
      } else if (node.type === 'process') {
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        shape.setAttribute('x', -w/2);
        shape.setAttribute('y', -h/2);
        shape.setAttribute('width', w);
        shape.setAttribute('height', h);
        shape.setAttribute('rx', 4);
      } else if (node.type === 'decision') {
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        shape.setAttribute('points', `0,${-h/2} ${w/2},0 0,${h/2} ${-w/2},0`);
      } else if (node.type === 'io') {
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        shape.setAttribute('points', `${-w/2 + 15},${-h/2} ${w/2 + 15},${-h/2} ${w/2 - 15},${h/2} ${-w/2 - 15},${h/2}`);
      } else if (node.type === 'connector') {
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        shape.setAttribute('r', w/2);
      } else if (node.type === 'comment') {
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        shape.setAttribute('x', -w/2);
        shape.setAttribute('y', -h/2);
        shape.setAttribute('width', w);
        shape.setAttribute('height', h);
        shape.setAttribute('stroke-dasharray', '5,5');
      }

      g.appendChild(shape);

      if (node.text) {
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.textContent = node.text;
          text.setAttribute('y', 5); // Center text
          g.appendChild(text);
      }

      // Anchors (only show on hover via CSS)
      ['top', 'bottom', 'left', 'right'].forEach(anchor => {
        const pos = this.getAnchorPos({x:0, y:0, width:w, height:h}, anchor);
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', pos.x);
        circle.setAttribute('cy', pos.y);
        circle.setAttribute('r', 5);
        circle.setAttribute('class', 'anchor-point');
        circle.onmousedown = (e) => {
          e.stopPropagation();
          this.connectingFrom = { id: node.id, anchor };
        };
        g.appendChild(circle);
      });

      g.onmousedown = (e) => {
        if (e.target.classList.contains('anchor-point')) return;
        e.stopPropagation();
        this.selectNode(node.id);
        const mouse = this.getMousePos(e);
        this.draggingNode = {
          id: node.id,
          offsetX: mouse.x - node.x,
          offsetY: mouse.y - node.y
        };
      };

      g.ondblclick = () => {
        const input = document.getElementById('nodeTextInput');
        if (input) input.focus();
      };

      this.nodesGroup.appendChild(g);
    });
  }

  async exportAsImage() {
    const svg = this.canvas;
    const xml = new XMLSerializer().serializeToString(svg);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const b64Start = 'data:image/svg+xml;base64,';
    const image64 = b64Start + svg64;

    const img = new Image();
    img.src = image64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svg.width.baseVal.value;
      canvas.height = svg.height.baseVal.value;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = 'flowchart-design.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  window.flowDesigner = new FlowchartDesigner();
});
