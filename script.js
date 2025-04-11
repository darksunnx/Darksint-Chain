
let stage = new Konva.Stage({
  container: 'stage-container',
  width: window.innerWidth - 240,
  height: window.innerHeight
});
let layer = new Konva.Layer();
stage.add(layer);

let nodes = [];
let selectedNode = null;
let linkingMode = false;
let linkStartNode = null;
let links = [];

function addNode(type) {
  const group = new Konva.Group({
    x: 150 + Math.random() * 300,
    y: 100 + Math.random() * 200,
    draggable: true
  });

  const box = new Konva.Rect({
    width: 180,
    height: 80,
    fill: '#2a2a2a',
    stroke: '#00bcd4',
    strokeWidth: 2,
    cornerRadius: 14,
    shadowColor: 'black',
    shadowBlur: 10,
    shadowOffset: { x: 2, y: 2 },
    shadowOpacity: 0.4
  });

  const text = new Konva.Text({
    text: type,
    fontSize: 16,
    fill: 'white',
    padding: 10,
    width: 180,
    align: 'center',
    name: 'node-text'
  });

  group.add(box);
  group.add(text);
  layer.add(group);
  layer.draw();

  group.on('dblclick', () => {
    selectedNode = group;
    document.getElementById('node-title').value = text.text();
    document.getElementById('node-details').value = group.attrs.details || '';
    document.getElementById('node-bgcolor').value = box.fill();
    document.getElementById('node-textcolor').value = text.fill();
    document.getElementById('property-popup').classList.add('visible');
  });

  group.on('click', () => {
    if (linkingMode) {
      if (!linkStartNode) {
        linkStartNode = group;
      } else {
        const line = new Konva.Line({
          points: [linkStartNode.x()+90, linkStartNode.y()+40, group.x()+90, group.y()+40],
          stroke: '#00e5ff',
          strokeWidth: 2,
          lineCap: 'round'
        });
        layer.add(line);
        links.push({ start: linkStartNode, end: group, line });
        layer.draw();
        linkingMode = false;
        linkStartNode = null;
      }
    }
  });

  group.on('dragmove', () => {
    links.forEach(link => {
      if (link.start === group || link.end === group) {
        link.line.points([
          link.start.x() + 90, link.start.y() + 40,
          link.end.x() + 90, link.end.y() + 40
        ]);
      }
    });
  });

  nodes.push({ group, type, text, box });
}

function saveProperties() {
  if (!selectedNode) return;
  const title = document.getElementById('node-title').value;
  const details = document.getElementById('node-details').value;
  const bgColor = document.getElementById('node-bgcolor').value;
  const textColor = document.getElementById('node-textcolor').value;

  const textNode = selectedNode.findOne('.node-text');
  const box = selectedNode.findOne('Rect');
  textNode.text(title + (details ? `\n${details}` : ''));
  textNode.fill(textColor);
  box.fill(bgColor);
  selectedNode.attrs.details = details;

  layer.draw();
  closePropertyPopup();
}

function closePropertyPopup() {
  document.getElementById('property-popup').classList.remove('visible');
  selectedNode = null;
}

function enableLinking() {
  linkingMode = true;
  linkStartNode = null;
  alert("Связывание: выбери 2 узла");
}

function downloadProject() {
  const data = {
    nodes: nodes.map(n => ({
      x: n.group.x(),
      y: n.group.y(),
      text: n.text.text(),
      type: n.type,
      details: n.group.attrs.details || '',
      fill: n.box.fill(),
      color: n.text.fill()
    })),
    links: links.map(l => ({
      startIndex: nodes.findIndex(n => n.group === l.start),
      endIndex: nodes.findIndex(n => n.group === l.end)
    }))
  };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'project.osint';
  a.click();
}

function loadProject(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = JSON.parse(e.target.result);
    nodes = [];
    links = [];
    layer.destroyChildren();
    data.nodes.forEach(n => {
      addNode(n.type);
      const node = nodes[nodes.length - 1];
      node.group.x(n.x);
      node.group.y(n.y);
      node.text.text(n.text);
      node.group.attrs.details = n.details;
      node.box.fill(n.fill);
      node.text.fill(n.color);
    });
    data.links.forEach(link => {
      const start = nodes[link.startIndex].group;
      const end = nodes[link.endIndex].group;
      const line = new Konva.Line({
        points: [start.x() + 90, start.y() + 40, end.x() + 90, end.y() + 40],
        stroke: '#00e5ff',
        strokeWidth: 2
      });
      layer.add(line);
      links.push({ start, end, line });
    });
    layer.draw();
  };
  reader.readAsText(file);
}

function exportAsImage() {
  const dataURL = stage.toDataURL({ pixelRatio: 2 });
  const a = document.createElement('a');
  a.download = 'darksint-map.png';
  a.href = dataURL;
  a.click();
}

function toggleTheme() {
  document.body.classList.toggle('light');
}


function setCustomBackground(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    document.body.style.background = `url('${e.target.result}') no-repeat center center fixed`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.setProperty('backdrop-filter', 'blur(12px)');
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.style.backdropFilter = 'blur(12px)';
    }
  };
  reader.readAsDataURL(file);
}
