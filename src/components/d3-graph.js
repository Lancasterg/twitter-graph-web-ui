import * as d3 from 'd3';

export default class Graph {
  constructor(elementName, nodes, edges, rootUsername) {
    this.elementName = elementName;
    this.nodes = nodes;
    this.links = edges;
    this.rootUsername = rootUsername;

    const size = this.getGraphSize();

    this.svg = d3.select('#' + this.elementName);
    this.svg.attr('width', size.w).attr('height', size.h);

    this.reset();
    this.init();
  }

  init() {
    // Parent container
    const g = this.svg.append("g")
      .attr("class", "everything");

    // Draw edges
    this.linkGroup = g.selectAll(".link")
      .data(this.links, (d) => d.source.id + "-" + d.target.id)
      .enter().append("line")
      .attr("class", "link")
      .attr("stroke-width", (link) => this.getEdgeWidth(link));

    // Nodes container
    this.nodeGroup = g.selectAll(".node")
      .data(this.nodes, d => d.id)
      .enter().append("g")
      .attr("class", "node")
      // .on("mouseover", this.onNodeHoverBegin.bind(this))
      // .on("mouseout", this.onNodeHoverEnd.bind(this))
      // Configure node dragging
      .call(d3.drag()
        .on("start", this.dragStarted.bind(this))
        .on("drag", this.dragged.bind(this))
        .on("end", this.dragEnded.bind(this)));

    // Draw nodes
    this.nodeGroup.append("circle")
      .attr("r", (node) => this.getNodeRadius(node))
      .attr("fill", (node) => this.getNodeColour(node))
      .style("stroke-width", (node) => {
        return node.username === this.rootUsername ? 10 : undefined;
      })
      .style("stroke", (node) => {
        return node.username === this.rootUsername ? "#2983fe" : undefined;
      });

    // Draw avatars
    this.nodeGroup.append("defs")
      .append("clipPath")
      .attr("id", (node) => "avatar-clip-" + node.id)
      .append("circle")
      .attr("cx", (node) => this.getNodeRadius(node))
      .attr("cy", (node) => this.getNodeRadius(node))
      .attr("r", (node) => this.getNodeRadius(node));
    this.nodeGroup.append("image")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", (node) => this.getNodeRadius(node) * 2)
      .attr("height", (node) => this.getNodeRadius(node) * 2)
      .attr("xlink:href", (node) => "https://twivatar.glitch.me/" + node.username)
      .attr("clip-path", (node) => "url(#avatar-clip-" + node.id + ")")
      .attr("transform", (node) => "translate("
        + -this.getNodeRadius(node) + ", "
        + -this.getNodeRadius(node) + ")");

    // Draw node labels
    // this.nodeGroup.append("text")
    //   .text((node) => this.getNodeLabel(node))
    //   .style('font-size', (node) => this.getNodeLabelSize(node))
    //   .attr('x', (node) => this.getNodeLabelXPos(node))
    //   .attr('y', (node) => this.getNodeLabelYPos(node));

    // Set the node title (on mouse hover)
    // this.nodeGroup.append("title").text((node) => this.getNodeTitle(node));

    // Redraw when the window is resized
    window.addEventListener("resize", () => this.windowResized());

    const size = this.getGraphSize();

    // Enable zooming
    d3.zoom()
      .scaleExtent([0.5, 3])
      .translateExtent([[0, 0], [size.w, size.h]])
      .extent([[0, 0], [size.w, size.h]])
      .on("zoom", () => g.style('transform', 'scale(' + d3.event.transform.k + ')'))
      (this.svg);
    g.style("transform-origin", "50% 50% 0");

    // Create force directed graph
    this.simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(node => node.id)
        .distance(node => this.getNodeRadius(node) / 2))
      .force("collide", d3.forceCollide(node => this.getNodeRadius(node)))
      .force("charge", d3.forceManyBody()
        .strength(node => -this.getNodeRadius(node) * 50))
      .force("center", d3.forceCenter(size.w / 2, size.h / 2));

    // Start the simulation
    this.simulation.nodes(this.nodes).on("tick", this.ticked.bind(this));
    this.simulation.force("link").links(this.links);
  }

  reset() {
    this.svg.selectAll("*").remove();
  }

  getGraphSize() {
    const rect = document.getElementById(this.elementName).getBoundingClientRect();
    return {w: rect.width, h: rect.height};
  }

  addNode(node, links) {
    this.simulation.stop();

    let max = 50;
    let min = -50;
    let x = Math.floor(Math.random() * (max - min + 1) + min);
    let y = Math.floor(Math.random() * (max - min + 1) + min);

    const size = this.getGraphSize();
    node.x = size.w / 2 + x;
    node.y = size.h / 2 + y;

    // Find and add all links to existing nodes
    links.forEach((link) => {
      if (link.source === node.id) {
        if (this.getNode(link.target) !== undefined) {
          this.links.push(link);
        }
      }

      if (link.target === node.id) {
        this.links.push(link);
      }
    });

    this.nodes.push(node);

    this.reset();
    this.init();

    this.simulation.alpha(0.1).restart();
  }

  getNode(id) {
    let node;
    this.nodes.forEach((n) => {
      if (n.id === id) {
        node = n;
      }
    });
    return node;
  }

  getNodeColour(node) {
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    return color(node.group);
  }

  getNodeRadius(node) {
    let min = 10;
    let max = 50;
    let num = this.getNodeInDegree(node);
    return num <= min ? min : num >= max ? max : num;
  }

  getNodeInDegree(node) {
    let links = this.links.filter((p) => {
      return p.source === node.id;
    });
    node.inDegree = links.length;
    return links.length;
  }

  getNodeLabel(node) {
    return node.username;
  }

  getNodeLabelSize(node) {
    let links = this.links.filter((p) => {
      return p.source === node.id;
    });
    return (links.length + 10) + "px";
  }

  getNodeLabelXPos(node) {
    return this.getNodeInDegree(node) + 12;
  }

  getNodeLabelYPos(node) {
    return (this.getNodeInDegree(node) / 2) + 4;
  }

  getNodeTitle(node) {
    return node.username;
  }

  getEdgeWidth(edge) {
    return edge.value / 2;
  }

  ticked() {
    this.linkGroup.attr("x1", (link) => {
      return link.source.x;
    })
      .attr("y1", (link) => link.source.y)
      .attr("x2", (link) => link.target.x)
      .attr("y2", (link) => link.target.y);

    this.nodeGroup.attr("transform", function (node) {
      return "translate(" + node.x + "," + node.y + ")";
    })
  }

  dragStarted(node) {
    if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
  }

  dragged(node) {
    node.fx = d3.event.x;
    node.fy = d3.event.y;
  }

  dragEnded(node) {
    if (!d3.event.active) this.simulation.alphaTarget(0);
    node.fx = null;
    node.fy = null;
  }

  onNodeClick(callback) {
    this.nodeGroup.on("click", (node) => callback(node));
  }

  onNodeHover(callback) {
    this.nodeGroup.on("mouseover", (node) => callback(node));
  }

  onNodeHoverEnd(callback) {
    this.nodeGroup.on("mouseout", (node) => callback(node));
  }

  onLinkHover(callback) {
    this.linkGroup.on("mouseover", (link) => callback(link));
  }

  onLinkHoverEnd(callback) {
    this.linkGroup.on("mouseout", (link) => callback(link));
  }

  windowResized() {
    const size = this.getGraphSize();

    this.simulation
      .force("center", d3.forceCenter(size.w / 2, size.h / 2))
      .force("x", d3.forceX(size.w / 2))
      .force("y", d3.forceY(size.h / 2))
      .alpha(0.1).restart();
  }
}
