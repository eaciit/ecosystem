var missedflow = {}
missedflow.data = ko.observableArray([])

missedflow.loadGraphData = function () {
  viewModel.ajaxPostCallback("/main/missedflow/getmissedflowdata", {
    limit: 20
  }, function (data) {
    var links = []
    var nodes = []

    _.each(data, function (e) {
      var source = _.find(nodes, {
        name: e.cust_long_name,
        as: "source"
      })
      var sourceIndex = undefined

      if (source) {
        sourceIndex = source.node
      } else {
        nodes.push({
          as: "source",
          node: nodes.length,
          name: e.cust_long_name,
          country: e.cust_coi,
          bank: e.cust_bank
        })

        sourceIndex = nodes.length - 1
      }

      var target = _.find(nodes, {
        name: e.cpty_long_name,
        as: "target"
      })
      var targetIndex = undefined

      if (target) {
        targetIndex = target.node
      } else {
        nodes.push({
          as: "target",
          node: nodes.length,
          name: e.cpty_long_name,
          country: e.cpty_coi,
          bank: e.cpty_bank
        })

        targetIndex = nodes.length - 1
      }

      links.push({
        source: sourceIndex,
        target: targetIndex,
        value: parseInt(Math.random() * 15) + 2
      })
    })

    missedflow.generateGraph({
      "nodes": nodes,
      "links": links
    })
  })
}

missedflow.generateGraph = function (data) {
  var units = "Widgets"

  var margin = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    },
    width = $("#missedflowchart").width() * 0.5 - margin.left - margin.right,
    height = $("#missedflowchart").height() - margin.top - margin.bottom

  color = d3.scaleOrdinal().range(["#1e88e5", "#1e88e5", "#8893a6", "#8893a6", "#44546a", "#44546a"])

  // append the svg canvas to the page
  var svg = d3.select("#missedflowchart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")")

  // Set the sankey diagram properties
  var sankey = d3sankey()
    .nodeWidth(20)
    .nodePadding(20)
    .size([width, height])

  var path = sankey.link()

  // load the data
  var graph = data

  sankey.nodes(graph.nodes)
    .links(graph.links)
    .layout(32)

  // add in the links
  var link = svg.append("g")
    .selectAll(".link")
    .data(graph.links)
    .enter().append("path")
    .attr("class", "link")
    .attr("d", path)
    .style("stroke-width", function (d) {
      return Math.max(1, d.dy)
    })
    .sort(function (a, b) {
      return b.dy - a.dy
    })

  var pathText = svg.selectAll(".pathText")
    .data(graph.links)
    .enter().append("svg:text")
    .attr("dx", width - 200)
    .attr("dy", 2)
    .attr("style", "fill:#fff")
    .style("font-size", function (d) {
      return Math.sqrt(d.dy * 2)
    })
    .append("textPath")
    .attr("xlink:href", function (d, i) {
      return "#linkId_" + i
    })
    .text(function (d, i) {
      return d.target.bank
    })

  // add in the nodes
  var node = svg.append("g").selectAll(".node")
    .data(graph.nodes)
    .enter().append("g")
    .attr("class", "node")
    .attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")"
    }).call(d3.drag()
      .subject(function (d) {
        return d
      })
      .on("start", function () {
        this.parentNode.appendChild(this)
      })
      .on("drag", dragmove)
    )

  node.append("rect")
    .attr("height", function (d) {
      return d.dy
    })
    .attr("width", sankey.nodeWidth())
    .style("fill", function (d) {
      return d.color = color(d.name.replace(/ .*/, ""))
    })
    .style("stroke", function (d) {
      return d3.rgb(d.color).darker(2)
    })

  node.append("text")
    .attr("x", -6)
    .attr("y", function (d) {
      return d.dy / 2
    })
    .attr("dy", ".35em")
    .attr("text-anchor", "end")
    .attr("transform", null)
    .text(function (d) {
      return d.name
    })
    .filter(function (d) {
      return d.x < width / 2
    })
    .attr("x", 6 + sankey.nodeWidth())
    .attr("text-anchor", "start")


  // the function for moving the nodes
  function dragmove(d) {
    d3.select(this).attr("transform",
      "translate(" + (
        d.x = Math.max(0, Math.min(width - d.dx, d3.event.x))) + "," + (
        d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")")
    sankey.relayout()
    link.attr("d", path)
  }
}

$(window).load(function () {
  missedflow.loadGraphData()
})