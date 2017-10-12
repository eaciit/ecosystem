var missedflow = {}

missedflow.generateGraph = function() {
  var units = "Widgets";

  var margin = {
      top: 20,
      right: 50,
      bottom: 100,
      left: 50
    },
    width = $("#missedflowchart").width() - 700 - margin.left - margin.right,
    height = $("#missedflowchart").height() - margin.top - margin.bottom;

  var formatNumber = d3.format(",.0f"), // zero decimal places
    format = function(d) {
      return formatNumber(d) + " " + units;
    },
    color = d3.scaleOrdinal()
    .range(["#1e88e5", "#1e88e5", "#8893a6", "#8893a6", "#44546a", "#44546a"]);

  // append the svg canvas to the page
  var svg = d3.select("#missedflowchart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

  // Set the sankey diagram properties
  var sankey = d3sankey()
    .nodeWidth(20)
    .nodePadding(25)
    .size([width, height]);

  // load the data
  var graph = getData();

  sankey.nodes(graph.nodes)
    .links(graph.links)
    .layout(32);

  // add in the links
  var link = svg.append("g").selectAll(".link")
    .data(graph.links)
    .enter().append("path")
    .attr("class", "link")
    // .attr("d", sankey.links())
    .attr("d", d3.linkHorizontal()
      .x(function(d) {
        return d.x;
      })
      .y(function(d) {
        return d.y;
      })
      .source(function(d) {
        return {
          x: d.source.x,
          y: d.source.y + 50
        };
      })
      .target(function(d) {
        return {
          "x": d.target.x,
          "y": d.target.y + 50
        };
      }))
    .style("fill", "none")
    // .style("stroke", function(d) { return d.source.color; })
    .style("stroke", function(d) {
      console.log(d)
      if (d.source.node == 0) {
        return "#1e88e5"
      } else if (d.source.node == 2) {
        return "#8893a6"
      } else {
        return "#44546a"
      }
    })
    .style("stroke-opacity", "1")
    .on("mouseover", function() {
      d3.select(this).style("stroke-opacity", ".5")
    })
    .on("mouseout", function() {
      d3.select(this).style("stroke-opacity", "1")
    })
    .style("stroke-width", function(d) {
      return Math.sqrt(d.dy * 4)
    })
    .sort(function(a, b) {
      return b.dy - a.dy;
    });

  // add the link titles
  link.append("title")
    .text(function(d) {
      return d.source.name + " → " + d.target.name + "\n" + format(d.value);
    });

  

  // add in the nodes
  var node = svg.append("g").selectAll(".node")
    .data(graph.nodes)
    .enter().append("g")
    .attr("class", "node")
    .attr("transform", function(d) {
      // console.log(d)
      return "translate(" + d.x + "," + d.y + ")";
    })

  // add the circles for the nodes
  node.append("circle")
    .attr("cx", sankey.nodeWidth() / 2)
    .attr("cy", function(d) {
      return 48.181;
    })
    .attr("r", 50)
    .style("fill", function(d) {
      return d.color = color(d.name.replace(/ .*/, ""));
    })
    .append("title")
    .text(function(d) {
      return d.name + "\n" + format(d.value);
    });

  // add in the title for the nodes
  node.append("text")
    .attr("x", 8)
    .attr("dy", "3em")
    .attr("text-anchor", "middle")
    .text(function(d) {
      return d.country
    })

  node.append("text")
    .attr("x", 8)
    .attr("dy", "4em")
    .attr("text-anchor", "middle")
    .text(function(d) {
      return d.name
    })

  // the function for moving the nodes
  function dragmove(d) {
    d3.select(this).attr("transform",
      "translate(" + (
        d.x = Math.max(0, Math.min(width - d.dx, d3.event.x))) + "," + (
        d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
    sankey.relayout();
    link.attr("d", path);
  };

  function getData() {
    return {
      "nodes": [{
          "node": 0,
          "country": "UAE",
          "name": "MEGLOBAL"
        },
        {
          "node": 1,
          "country": "CHINA",
          "name": "Shanghai East"
        },
        {
          "node": 2,
          "country": "UAE",
          "name": "INDIA Dow"
        },
        {
          "node": 3,
          "country": "UAE",
          "name": "Arabian Chem"
        },
        {
          "node": 4,
          "country": "INDIA",
          "name": "ROHM & HAAS"
        },
        {
          "node": 5,
          "country": "IND",
          "name": "Dow Argo"
        }
      ],
      "links": [{
          "source": 0,
          "target": 3,
          "value": 2
        },
        {
          "source": 0,
          "target": 5,
          "value": 6
        },
        {
          "source": 2,
          "target": 1,
          "value": 20
        },
        {
          "source": 2,
          "target": 3,
          "value": 4
        },
        {
          "source": 2,
          "target": 5,
          "value": 5
        },
        {
          "source": 4,
          "target": 1,
          "value": 1
        },
        {
          "source": 4,
          "target": 3,
          "value": 11
        },
        {
          "source": 4,
          "target": 5,
          "value": 14
        }
      ]
    };
  }
}

$(window).load(function() {
  missedflow.generateGraph()
})