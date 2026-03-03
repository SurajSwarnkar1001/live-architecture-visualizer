import cytoscape from 'cytoscape';
// @ts-ignore
import dagre from 'cytoscape-dagre';

cytoscape.use(dagre);

// @ts-ignore
const vscode = acquireVsCodeApi();

let cy: cytoscape.Core;
let currentGraph: any = null;
let isTableView = false;

// The colors requested
const COLORS = {
    route: '#4A9EFF',
    controller: '#4AFF91',
    service: '#FF9A4A',
    model: '#A04AFF',
    middleware: '#FFD94A',
    utility: '#A0A0A0',
    unknown: '#808080'
};

function initGraph() {
    cy = cytoscape({
        container: document.getElementById('cy'),
        style: [
            {
                selector: 'node',
                style: {
                    'label': 'data(label)',
                    'shape': 'round-rectangle',
                    'width': '120px',
                    'height': '40px',
                    'background-color': (ele: any) => COLORS[ele.data('type') as keyof typeof COLORS] || COLORS.unknown,
                    'color': '#ffffff',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': '13px',
                    'font-weight': 'bold',
                    'text-outline-width': 1,
                    'text-outline-color': (ele: any) => COLORS[ele.data('type') as keyof typeof COLORS] || COLORS.unknown,
                    'border-width': (ele: any) => ele.data('isCircular') ? 4 : (ele.data('isUnused') ? 2 : 1),
                    'border-color': (ele: any) => ele.data('isCircular') ? '#FF3333' : (ele.data('isUnused') ? '#AAAAAA' : 'rgba(0,0,0,0.2)'),
                    'border-style': (ele: any) => ele.data('isUnused') ? 'dashed' : 'solid',
                    'underlay-color': '#000000',
                    'underlay-padding': 3,
                    'underlay-opacity': 0.2,
                    'underlay-shape': 'round-rectangle'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2.5,
                    'line-color': '#888888',
                    'target-arrow-color': '#888888',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'arrow-scale': 1.2,
                    'opacity': 0.7,
                    'line-style': 'solid'
                }
            },
            {
                selector: '.highlighted',
                style: {
                    'background-color': '#fff',
                    'line-color': '#00f',
                    'target-arrow-color': '#00f',
                    'width': 4,
                    'opacity': 1,
                    'z-index': 9999,
                    'underlay-opacity': 0.4
                }
            },
            {
                selector: '.faded',
                style: {
                    'opacity': 0.15
                }
            }
        ],
        layout: {
            name: 'dagre',
            rankDir: 'TB',
            nodeSep: 80,
            rankSep: 120,
            padding: 50
        } as any
    });

    // Interactions
    cy.on('tap', 'node', (evt) => {
        const node = evt.target;
        // Highlight direct dependencies
        cy.elements().removeClass('highlighted faded');
        node.addClass('highlighted');
        node.connectedEdges().addClass('highlighted');
        node.connectedEdges().connectedNodes().addClass('highlighted');
        cy.elements().difference(node.outgoers().union(node.incomers()).union(node)).addClass('faded');
    });

    cy.on('tap', (evt) => {
        if (evt.target === cy) {
            cy.elements().removeClass('highlighted faded');
        }
    });

    cy.on('cxttap', 'node', (evt) => { // Right click
        const node = evt.target;
        vscode.postMessage({ type: 'OPEN_FILE', payload: { filePath: node.id() } });
    });

    // Tooltip logic
    const tooltip = document.getElementById('tooltip')!;
    cy.on('mouseover', 'node', (evt) => {
        const node = evt.target;
        const data = node.data();
        let content = `<b>${data.label}</b>\n`;
        content += `Type: ${data.type}\n`;
        content += `Lines: ${data.lineCount}\n`;
        content += `Complexity: ${data.complexityScore}\n`;
        if (data.exports && data.exports.length > 0) {
            content += `Exports: ${data.exports.slice(0, 3).join(', ')}${data.exports.length > 3 ? '...' : ''}`;
        }
        tooltip.innerHTML = content;
        tooltip.classList.remove('hidden');
    });

    cy.on('mousemove', (evt) => {
        tooltip.style.left = evt.originalEvent.pageX + 15 + 'px';
        tooltip.style.top = evt.originalEvent.pageY + 15 + 'px';
    });

    cy.on('mouseout', 'node', () => {
        tooltip.classList.add('hidden');
    });

    // Context menu / Double click for AI explanation
    cy.on('dblclick', 'node', (evt) => {
        const node = evt.target;
        vscode.postMessage({ type: 'EXPLAIN_NODE', payload: { nodeId: node.id() } });
    });
}

function updateGraph(graph: any) {
    currentGraph = graph;
    const elements: cytoscape.ElementDefinition[] = [];

    for (const n of graph.nodes) {
        elements.push({ group: 'nodes', data: { ...n } });
    }
    for (const e of graph.edges) {
        elements.push({ group: 'edges', data: { ...e, id: e.id, source: e.source, target: e.target } });
    }

    if (!cy) initGraph();
    cy.elements().remove();
    cy.add(elements);
    applyFilters();
    if (isTableView) {
        renderTable();
    }
}

function renderTable() {
    if (!currentGraph) return;

    // Check filters
    const typesToHide: string[] = [];
    if (!(document.getElementById('filter-route') as HTMLInputElement).checked) typesToHide.push('route');
    if (!(document.getElementById('filter-controller') as HTMLInputElement).checked) typesToHide.push('controller');
    if (!(document.getElementById('filter-service') as HTMLInputElement).checked) typesToHide.push('service');
    if (!(document.getElementById('filter-model') as HTMLInputElement).checked) typesToHide.push('model');
    if (!(document.getElementById('filter-middleware') as HTMLInputElement).checked) typesToHide.push('middleware');

    const tbody = document.getElementById('data-table-body')!;
    tbody.innerHTML = '';

    const visibleNodes = currentGraph.nodes.filter((n: any) => !typesToHide.includes(n.type));

    for (const node of visibleNodes) {
        const tr = document.createElement('tr');

        // Label
        const tdLabel = document.createElement('td');
        tdLabel.textContent = node.label;
        tdLabel.className = 'clickable-cell';
        tdLabel.onclick = () => {
            vscode.postMessage({ type: 'OPEN_FILE', payload: { filePath: node.id } });
        };

        const tdType = document.createElement('td');
        tdType.textContent = node.type;

        const tdLines = document.createElement('td');
        tdLines.textContent = node.lineCount.toString();

        const tdComp = document.createElement('td');
        tdComp.textContent = node.complexityScore.toString();

        const tdCirc = document.createElement('td');
        tdCirc.textContent = node.isCircular ? 'Yes' : 'No';
        if (node.isCircular) tdCirc.style.color = '#FF3333';

        const tdUnused = document.createElement('td');
        tdUnused.textContent = node.isUnused ? 'Yes' : 'No';
        if (node.isUnused) tdUnused.style.color = '#AAAAAA';

        tr.appendChild(tdLabel);
        tr.appendChild(tdType);
        tr.appendChild(tdLines);
        tr.appendChild(tdComp);
        tr.appendChild(tdCirc);
        tr.appendChild(tdUnused);

        tbody.appendChild(tr);
    }
}

function applyFilters() {
    if (!cy) return;
    const typesToHide: string[] = [];
    if (!(document.getElementById('filter-route') as HTMLInputElement).checked) typesToHide.push('route');
    if (!(document.getElementById('filter-controller') as HTMLInputElement).checked) typesToHide.push('controller');
    if (!(document.getElementById('filter-service') as HTMLInputElement).checked) typesToHide.push('service');
    if (!(document.getElementById('filter-model') as HTMLInputElement).checked) typesToHide.push('model');
    if (!(document.getElementById('filter-middleware') as HTMLInputElement).checked) typesToHide.push('middleware');

    cy.elements().removeClass('hidden');
    if (typesToHide.length > 0) {
        const filterStr = typesToHide.map(t => `[type = "${t}"]`).join(', ');
        cy.nodes(filterStr).addClass('hidden');
    }

    if (isTableView) {
        renderTable();
    } else {
        // Refresh layout
        cy.layout({ name: 'dagre', rankDir: 'TB', nodeSep: 80, rankSep: 120, padding: 50 } as any).run();
    }
}

// Setup Event Listeners
window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
        case 'GRAPH_UPDATE':
            if (!cy) initGraph();
            updateGraph(message.payload);
            break;
        case 'SHOW_EXPLANATION':
            document.getElementById('explanation-content')!.innerHTML = message.payload.explanation;
            document.getElementById('explanation-card')!.classList.remove('hidden');
            break;
    }
});

document.querySelectorAll('.filter-group input').forEach(el => {
    el.addEventListener('change', applyFilters);
});

document.getElementById('btn-toggle-view')?.addEventListener('click', () => {
    isTableView = !isTableView;
    const cyContainer = document.getElementById('cy')!;
    const tableContainer = document.getElementById('table-view')!;

    if (isTableView) {
        cyContainer.classList.add('hidden');
        tableContainer.classList.remove('hidden');
        document.getElementById('btn-toggle-view')!.textContent = 'View Visualization';
        renderTable();
    } else {
        tableContainer.classList.add('hidden');
        cyContainer.classList.remove('hidden');
        document.getElementById('btn-toggle-view')!.textContent = 'View Data Table';
        if (cy) cy.resize();
        if (cy) cy.layout({ name: 'dagre', rankDir: 'TB', nodeSep: 80, rankSep: 120, padding: 50 } as any).run();
    }
});

document.getElementById('close-explanation')?.addEventListener('click', () => {
    document.getElementById('explanation-card')?.classList.add('hidden');
});

document.getElementById('search-box')?.addEventListener('input', (e) => {
    if (!cy) return;
    const term = (e.target as HTMLInputElement).value.toLowerCase();
    if (!term) {
        cy.elements().removeClass('faded');
        return;
    }
    cy.elements().addClass('faded');
    cy.nodes().filter((n: any) => n.data('label').toLowerCase().includes(term)).removeClass('faded');
});

document.getElementById('btn-export-png')?.addEventListener('click', () => {
    if (!cy) return;
    try {
        // Use scale: 1 and define maxWidth/maxHeight to prevent browser canvas size limits on huge architectures
        const dataUri = cy.png({
            full: true,
            output: 'base64uri',
            bg: 'var(--vscode-editor-background)',
            maxWidth: 8000,
            maxHeight: 8000
        });
        vscode.postMessage({ type: 'EXPORT_REQUEST', payload: { format: 'png', data: dataUri } });
    } catch (e) {
        console.error('Export failed (graph possibly too large)', e);
    }
});

document.getElementById('btn-export-json')?.addEventListener('click', () => {
    if (!currentGraph) return;
    const dataStr = JSON.stringify(currentGraph, null, 2);
    vscode.postMessage({ type: 'EXPORT_REQUEST', payload: { format: 'json', data: dataStr } });
});

vscode.postMessage({ type: 'READY' });
