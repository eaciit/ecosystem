var links = [{
    source: "Apple",
    target: "Microsoft",
    type: "opportunity",
    text: "opportunity"
  },
  {
    source: "Microsoft",
    target: "Apple",
    type: "opportunity",
    text: ""
  },
  {
    source: "Samsung",
    target: "Apple",
    type: "opportunity",
    text: ""
  },
  {
    source: "Apple",
    target: "Samsung",
    type: "opportunity",
    text: "opportunity"
  },
  {
    source: "Microsoft",
    target: "Apple",
    type: "flow",
    text: ""
  },
  {
    source: "Samsung",
    target: "Apple",
    type: "missed",
    text: "missed flow"
  }
];
//sort links by source, then target
links.sort(function (a, b) {
  if (a.source > b.source) {
    return 1;
  } else if (a.source < b.source) {
    return -1;
  } else {
    if (a.target > b.target) {
      return 1;
    }
    if (a.target < b.target) {
      return -1;
    } else {
      return 0;
    }
  }
});

var nodes = {};

// Compute the distinct nodes from the links.
links.forEach(function (link) {
  link.source = nodes[link.source] || (nodes[link.source] = {
    name: link.source
  });
  link.target = nodes[link.target] || (nodes[link.target] = {
    name: link.target
  });
});

var w = 600,
  h = 600;

var force = d3.layout.force()
  .nodes(d3.values(nodes))
  .links(links)
  .size([w, h])
  .linkDistance(200)
  .charge(-500)
  .on("tick", tick)
  .start();

var svg = d3.select("#graph").append("svg:svg")
  .attr("width", w)
  .attr("height", h);

// Per-type markers, as they don't inherit styles.
svg.append("svg:defs").selectAll("marker")
  .data(["flow", "missed"])
  .enter().append("svg:marker")
  .attr("id", String)
  .attr("viewBox", "0 -5 10 10")
  .attr("refX", 20)
  .attr("refY", -1.5)
  .attr("markerWidth", 6)
  .attr("markerHeight", 6)
  .attr("orient", "auto")
  .append("svg:path")
  .attr("d", "M0,-5L10,0L0,5");

var path = svg.append("svg:g").selectAll("path")
  .data(force.links())
  .enter().append("svg:path")
  .attr("id", function (d, i) {
    return "linkId_" + i;
  })
  .attr("class", function (d) {
    return "link " + d.type;
  })
  .attr("marker-end", function (d) {
    return "url(#" + d.type + ")";
  });

var pathText = svg.selectAll(".pathText")
  .data(force.links())
  .enter().append("svg:text")
  .attr("class", "pathText")
  .attr("dx", 75)
  .attr("dy", -3)
  .style("fill", "red")
  .append("textPath")
  .attr("xlink:href", function (d, i) {
    return "#linkId_" + i;
  })
  .text(function (d, i) {
    return d.text
  });

var circle = svg.append("svg:g").selectAll("circle")
  .data(force.nodes())
  .enter().append("svg:circle")
  .attr("r", 10)
  .call(force.drag);

var text = svg.append("svg:g").selectAll("g")
  .data(force.nodes())
  .enter().append("svg:g");

// A copy of the text with a thick white stroke for legibility.
text.append("svg:text")
  .attr("x", 14)
  .attr("y", ".31em")
  .attr("class", "shadow")
  .text(function (d) {
    return d.name;
  });

text.append("svg:text")
  .attr("x", 14)
  .attr("y", ".31em")
  .text(function (d) {
    return d.name;
  });

// Use elliptical arc path segments to doubly-encode directionality.
function tick() {
  path.attr("d", function (d) {
    var dx = d.target.x - d.source.x,
      dy = d.target.y - d.source.y,
      dr = d.type == "opportunity" ? 200 : 400;
    return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
  });

  circle.attr("transform", function (d) {
    return "translate(" + d.x + "," + d.y + ")";
  });

  text.attr("transform", function (d) {
    return "translate(" + d.x + "," + d.y + ")";
  });
}