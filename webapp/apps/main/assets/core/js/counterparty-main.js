var counterpartymain = {}

counterpartymain.meglobal = [{
  "value": "ASA",
  "text": "ASA"
}, {
  "value": "AME",
  "text": "AME"
}]
counterpartymain.buyer = [{
  "value": 1,
  "text": "Ibrahim Fibres"
}, {
  "value": 2,
  "text": "Reliance Ind"
}]
counterpartymain.group = [{
  "value": "ETB",
  "text": "ETB"
}, {
  "value": "NTB",
  "text": "NTB"
}]
counterpartymain.top = [{
  "value": 5,
  "text": "Top 5"
}, {
  "value": 3,
  "text": "Top 3"
}]
counterpartymain.flows = [{
  "value": 31,
  "text": "Flows>$30M"
}, {
  "value": 100,
  "text": "Flows>$100M"
}]

counterpartymain.generateGraph = function() {
  var nodes = [{
    id: "Ibrahim Fibres",
    group: 2,
    type: "ETB",
    limited: 40
  }, {
    id: "Bhilosha Ind",
    group: 2,
    type: "ETB",
    limited: 200
  }, {
    id: "ICI Pakistan",
    group: 2,
    type: "NTB",
    limited: 60
  }, {
    id: "Reliance Ind",
    group: 2,
    type: "NTB",
    limited: 135
  }, {
    id: "MEGLOBAL INTERNATIONAL FZE",
    group: 1,
    type: "CENTER"
  }]

  var links = [{
      source: "Ibrahim Fibres",
      target: "MEGLOBAL INTERNATIONAL FZE",
      type: "ETB",

    },
    {
      source: "Bhilosha Ind",
      target: "MEGLOBAL INTERNATIONAL FZE",
      type: "ETB"
    },
    {
      source: "ICI Pakistan",
      target: "MEGLOBAL INTERNATIONAL FZE",
      type: "NTB"
    },
    {
      source: "Reliance Ind",
      target: "MEGLOBAL INTERNATIONAL FZE",
      type: "NTB"
    }
  ]

  var width = $("#graph").width(),
    height = $("#graph").height()

  var colors = d3.scaleOrdinal(d3.schemeCategory20c)
  // var colors = d3.rgb("#68c4fc","#587b9e")
  // colors.toString();

  var svg = d3.select("#graph")
    .append("svg")
    .attr("width", width)
    .attr("height", height),
    node, link

  console.log(svg)

  svg.append('defs').append('marker')
    .attrs({
      'id': 'arrowhead',
      'viewBox': '-0 -5 10 10',
      'refX': 43,
      'refY': 0,
      'orient': 'auto',
      'markerWidth': 15,
      'markerHeight': 15,
      'xoverflow': 'visible'
    })
    .append('svg:path')
    .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
    .attr('fill', '#999')
    .style('stroke', 'none')

  var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) {
      return d.id
    }).distance(300).strength(1))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2))

  update(links, nodes)

  function update(links, nodes) {
    link = svg.selectAll(".link")
      .data(links)
      .enter()
      .append("line")
      .attr("class", function(d) {
        if (d.type == "NTB") {
          return "link"
        }
        return "linkdash"
      })
      .attr('marker-end', 'url(#arrowhead)')

    link.append("title")
      .text(function(d) {
        return d.type
      })

    edgepaths = svg.selectAll(".edgepath")
      .data(links)
      .enter()
      .append('path')
      .attrs({
        'class': 'edgepath',
        'fill-opacity': 0,
        'stroke-opacity': 0,
        'id': function(d, i) {
          return 'edgepath' + i
        }
      })
      .style("pointer-events", "none")

    edgelabels = svg.selectAll(".edgelabel")
      .data(links)
      .enter()
      .append('text')
      .style("pointer-events", "none")
      .attrs({
        'class': 'edgelabel',
        'id': function(d, i) {
          return 'edgelabel' + i
        },
        'font-size': 10,
        'fill': '#aaa'
      })

    edgelabels.append('textPath')
      .attr('xlink:href', function(d, i) {
        return '#edgepath' + i
      })
      .style("text-anchor", "middle")
      .style("pointer-events", "none")
      .attr("startOffset", "50%")
      .text(function(d) {
        return d.type
      })

    node = svg.selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      )

    node.append("circle")
      .attr("r", 50)
      .attr("id", function(d) {
        return d.id
      })
      .style("fill", function(d) {
        if (d.type == "ETB") {
          return "#68c4fc"
        }
        return "#587b9e"
      })
      .on("click", function(d) {
        console.log(d.id)
      })

    node.append("title")
      .text(function(d) {
        return d.id
      })

    node.append("text")
      .attr("x", 0)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .text(function(d) {
        return d.id
      })

    node.append("text")
      .attr("x", 0)
      .attr("dy", "1.35em")
      .attr("text-anchor", "middle")
      .text(function(d) {
        return d.limited
      })

    simulation
      .nodes(nodes)
      .on("tick", ticked)

    simulation.force("link")
      .links(links)
  }

  function ticked() {
    link
      .attr("x1", function(d) {
        return d.source.x
      })
      .attr("y1", function(d) {
        return d.source.y
      })
      .attr("x2", function(d) {
        return d.target.x
      })
      .attr("y2", function(d) {
        return d.target.y
      })

    node
      .attr("transform", function(d) {
        return "translate(" + d.x + ", " + d.y + ")"
      })

    edgepaths.attr('d', function(d) {
      return 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y
    })

    edgelabels.attr('transform', function(d) {
      if (d.target.x < d.source.x) {
        var bbox = this.getBBox()
        rx = bbox.x + bbox.width / 2
        ry = bbox.y + bbox.height / 2
        return 'rotate(180 ' + rx + ' ' + ry + ')'
      } else {
        return 'rotate(0)'
      }
    })
  }

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart()
    d.fx = d.x
    d.fy = d.y
  }

  function dragged(d) {
    d.fx = d3.event.x
    d.fy = d3.event.y
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0)
    d.fx = undefined
    d.fy = undefined
  }
}

$(window).load(function() {
  counterpartymain.generateGraph()
  $('#month').data('kendoDatePicker').enable(false);

  $('#radioBtn a').on('click', function() {
  var sel = $(this).data('title');
  var tog = $(this).data('toggle');
  $('#' + tog).prop('value', sel);
  if (sel == "M") {
    $('#year').data('kendoDatePicker').enable(false);
    $('#month').data('kendoDatePicker').enable(true);
  } else if (sel == "Y") {
    $('#year').data('kendoDatePicker').enable(true);
    $('#month').data('kendoDatePicker').enable(false);
  }

  $('a[data-toggle="' + tog + '"]').not('[data-title="' + sel + '"]').removeClass('active').addClass('notActive');
  $('a[data-toggle="' + tog + '"][data-title="' + sel + '"]').removeClass('notActive').addClass('active');
  })
})