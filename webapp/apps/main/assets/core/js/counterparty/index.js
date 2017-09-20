var counterpary = {}

counterpary.generateGraph = function () {
  var links = [{
      source: "Ibrahim Fibres",
      target: "MEGLOBAL INTERNATIONAL FZE",
      type: "missed"
    },
    {
      source: "Bhilosha Ind",
      target: "MEGLOBAL INTERNATIONAL FZE",
      type: "missed"
    },
    {
      source: "ICI Pakistan",
      target: "MEGLOBAL INTERNATIONAL FZE",
      type: "missed"
    },
    {
      source: "Reliance Ind",
      target: "MEGLOBAL INTERNATIONAL FZE",
      type: "missed"
    }
  ];

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

  var width = $("#graph").width(),
    height = $("#graph").height();

  var force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links(links)
    .size([width, height])
    .linkDistance(100)
    .charge(-300)
    .on("tick", tick)
    .start();

  var svg = d3.select("#graph").append("svg")
    .attr("width", width)
    .attr("height", height);

  // Per-type markers, as they don't inherit styles.
  svg.append("defs").selectAll("marker")
    .data(["missed", "licensing", "resolved"])
    .enter().append("marker")
    .attr("id", function (d) {
      return d;
    })
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 20)
    .attr("refY", -1.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5");

  var path = svg.append("g").selectAll("path")
    .data(force.links())
    .enter().append("path")
    .attr("class", function (d) {
      return "link " + d.type;
    })
    .attr("marker-end", function (d) {
      return "url(#" + d.type + ")";
    });

  var circle = svg.append("g").selectAll("circle")
    .data(force.nodes())
    .enter().append("circle")
    .attr("r", 30)
    .call(force.drag);

  var text = svg.append("g").selectAll("text")
    .data(force.nodes())
    .enter().append("text")
    .attr("text-anchor", "middle")
    .text(function (d) {
      return d.name;
    });

  // Use elliptical arc path segments to doubly-encode directionality.
  function tick() {
    path.attr("d", linkArc);
    circle.attr("transform", transform);
    text.attr("transform", transform);
  }

  function linkArc(d) {
    var dx = d.target.x - d.source.x,
      dy = d.target.y - d.source.y,
      dr = Math.sqrt(dx * dx + dy * dy);
    return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
  }

  function transform(d) {
    return "translate(" + d.x + "," + d.y + ")";
  }
}

$(window).load(function () {
  counterpary.generateGraph()
})