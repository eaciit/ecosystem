var missedflow = {}
missedflow.data = ko.observableArray([])

missedflow.loadGraphData = function () {
  viewModel.ajaxPostCallback("/main/missedflow/getmissedflowdata", {
    limit: 20
  }, function (data) {
    var links = []
    var nodes = []

    _.each(data, function (e) {
      var total = e.total
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
          bank: e.cust_bank,
          amount: total
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
          bank: e.cpty_bank,
          amount: total
        })

        targetIndex = nodes.length - 1
      }

      links.push({
        source: sourceIndex,
        target: targetIndex,
        value: total
      })
    })

    missedflow.generateGraph({
      "nodes": nodes,
      "links": links
    })
  })
}

missedflow.generateGraph = function (data) {
  var margin = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    },
    width = $("#missedflowchart").width() - margin.left - margin.right,
    height = $("#missedflowchart").height() - margin.top - margin.bottom

  color = d3.scaleOrdinal().range(["#1e88e5", "#1e88e5", "#8893a6", "#8893a6", "#44546a", "#44546a"])
  /* Initialize tooltip */
  var tipLinks = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10,0]);

  // append the svg canvas to the page
  var svg = d3.select("#missedflowchart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(tipLinks)

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
    .on('mouseover', tipLinks.show)
    .on('mouseout', tipLinks.hide)

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
    })

  node.append("rect")
    .attr("height", function (d) {
      return d.dy
    })
    .attr("width", sankey.nodeWidth())
    .style("fill", function (d) {
      return d.color = color(d.name.replace(/ .*/, ""))
    })
    .on("mouseover", function (d) {
      highlightLink(d.node)
    })
    .on("mouseout", unhighlightLink)

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

  function highlightLink(n) {
    d3.selectAll(".link").each(function () {
      link = d3.select(this)
      if (link.data()[0].source.node == n || link.data()[0].target.node == n) {
        link.attr("class", "link selected")
      }
    })
  }

  function unhighlightLink() {
    d3.selectAll(".link.selected").each(function(){
      d3.select(this).attr("class", "link")
    })
  }
     // "➡" 

   tipLinks.html(function(d) {
      var title, candidate;
        candidate = d.source.name;
        title = d.target.name;
        var html =  '<div class="table-wrapper">'+
            '<table>'+
                '<tr>'+
                    '<td class="col-left">Customer Name</td>'+
                    '<td class="col-left">: '+candidate+'</td>'+
                '</tr>'+
                '<tr>'+
                    '<td class="col-left">Customer Bank</td>'+
                    '<td class="col-left">: '+d.source.bank+'</td>'+
                '</tr>'+
                '<tr>'+
                    '<td class="col-left">Counterparty Name</td>'+
                    '<td class="col-left">: '+title+'</td>'+
                '</tr>'+
                '<tr>'+
                    '<td class="col-left">Counterparty Bank</td>'+
                    '<td class="col-left">: '+d.target.bank+'</td>'+
                '</tr>'+
                '<tr>'+
                    '<td class="col-left">Total Flow</td>'+
                    '<td class="col-left">: '+currencynum(d.value)+'</td>'+
                '</tr>'+
            '</table>'+
            '</div>';
      return html;
    });
}

$(window).load(function() {
  missedflow.loadGraphData()
})