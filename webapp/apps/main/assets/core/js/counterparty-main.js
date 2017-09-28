var counterpartymain = {}
counterpartymain.headtext = ko.observable()
counterpartymain.dataDetailItemsNTB = ko.observableArray([])
counterpartymain.dataDetailItemsETB = ko.observableArray([])

counterpartymain.meglobal = [{
  "value": "ASA",
  "text": "ASA"
}, {
  "value": "AME",
  "text": "AME"
}]
counterpartymain.buyer = [{
  "value": "Supplier",
  "text": "Supplier"
}, {
  "value": "Buyer",
  "text": "Buyer"
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

var div = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

counterpartymain.generateGraph = function() {
  var nodes = [{
    id: "Ibrahim Fibres",
    group: 2,
    type: "ETB",
    limited: 40,
    listdetail: [{
      "notrx": "ETB/002/2017/0001",
      "monthly": 50,
      "yearly": 500,
      "recieved": "Receivable Service (RS)"
    }]
  }, {
    id: "Bhilosha Ind",
    group: 2,
    type: "ETB",
    limited: 200,
    listdetail: [{
      "notrx": "ETB/002/2017/0002",
      "monthly": 10,
      "yearly": 230,
      "recieved": "Receivable Service (RS)"
    }]
  }, {
    id: "ICI Pakistan",
    group: 2,
    type: "NTB",
    limited: 60,
    listdetail: [{
      "accopening": "Account Opening",
      "general": "General Banking",
      "fx": "FX",
      "s2b": "S2B",
      "credit": "Credits"
    }]
  }, {
    id: "Reliance Ind",
    group: 2,
    type: "NTB",
    limited: 135,
    listdetail: [{
      "accopening": "Account Opening",
      "general": "General Banking",
      "fx": "FX",
      "s2b": "S2B",
      "credit": "Credits"
    }]
  }, {
    id: "MEGLOBAL",
    group: 1,
    type: "CENTER",
    limited: "INTERNATIONAL FZE"
  }]

  var links = [{
      source: "Ibrahim Fibres",
      target: "MEGLOBAL",
      type: "ETB",

    },
    {
      source: "Bhilosha Ind",
      target: "MEGLOBAL",
      type: "ETB"
    },
    {
      source: "ICI Pakistan",
      target: "MEGLOBAL",
      type: "NTB"
    },
    {
      source: "Reliance Ind",
      target: "MEGLOBAL",
      type: "NTB"
    }
  ]

  function createSvgEl(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
  }

  var width = $("#graph").width(),
    height = $("#graph").height()

  var colors = d3.scaleOrdinal(d3.schemeCategory20c)

  var svg = d3.select("#graph")
    .append("svg")
    .attr("width", width)
    .attr("height", height),
    node, link

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
    // .attr('marker-end', 'url(#arrowhead)')

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
      .attr("r", function(d) {
        if (d.type == "CENTER") {
          return 70
        }
        return 50
      })
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
        if (d.type != "CENTER") {
          counterpartymain.headtext(d.type)
          div.transition()
            .duration(200)
            .style("opacity", 1);
          if (d.type == "NTB") {
            counterpartymain.dataDetailItemsNTB(d.listdetail[0])
            div.html($("#counterpartyModalNTB").html())
              .style("left", (d3.event.pageX) + "px")
              .style("top", (d3.event.pageY) + "px")
              .style("padding-top", "30px")
              .style("padding-left", "30px")

            d3.selectAll("circle").transition().duration(500)
              .style("opacity", function(o) {
                return o === d ? 1 : .1;
              });

            d3.selectAll("text").transition().duration(500)
              .style("opacity", function(o) {
                return o === d ? 1 : .1;
              });

            d3.selectAll(".link").transition().duration(500)
              .style("opacity", .1);

            d3.selectAll(".linkdash").transition().duration(500)
              .style("opacity", .1);

            return
          }
          counterpartymain.dataDetailItemsETB(d.listdetail[0])
          div.html($("#counterpartyModalETB").html())
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY) + "px")
            .style("padding-top", "30px")
            .style("padding-left", "30px")

          d3.selectAll("circle").transition().duration(500)
            .style("opacity", function(o) {
              return o === d ? 1 : .1;
            });

          d3.selectAll("text").transition().duration(500)
            .style("opacity", function(o) {
              return o === d ? 1 : .1;
            });

          d3.selectAll(".link").transition().duration(500)
            .style("opacity", .1);

          d3.selectAll(".linkdash").transition().duration(500)
            .style("opacity", .1);
        }
      })

    node.append("title")
      .text(function(d) {
        return d.id
      })

    node.append("text")
      .attr("x", 0)
      .attr("dy", ".25em")
      .attr("text-anchor", "middle")
      .text(function(d) {
        return d.id
      })

    node.append("text")
      .attr("x", 0)
      .attr("dy", "1.35em")
      .attr("text-anchor", "middle")
      .text(function(d) {
        if (d.type != "CENTER") {
          return "$" + d.limited + "M"
        }
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

counterpartymain.generateGraphBubble = function() {
   var nodes = [{
    id: "Ibrahim Fibres",
    group: 2,
    type: "ETB",
    limited: 40,
    listdetail: [{
      "notrx": "ETB/002/2017/0001",
      "monthly": 50,
      "yearly": 500,
      "recieved": "Receivable Service (RS)"
    }]
  }, {
    id: "Bhilosha Ind",
    group: 2,
    type: "ETB",
    limited: 200,
    listdetail: [{
      "notrx": "ETB/002/2017/0002",
      "monthly": 10,
      "yearly": 230,
      "recieved": "Receivable Service (RS)"
    }]
  }, {
    id: "ICI Pakistan",
    group: 2,
    type: "NTB",
    limited: 60,
    listdetail: [{
      "accopening": "Account Opening",
      "general": "General Banking",
      "fx": "FX",
      "s2b": "S2B",
      "credit": "Credits"
    }]
  }, {
    id: "Reliance Ind",
    group: 2,
    type: "NTB",
    limited: 135,
    listdetail: [{
      "accopening": "Account Opening",
      "general": "General Banking",
      "fx": "FX",
      "s2b": "S2B",
      "credit": "Credits"
    }]
  }]
  var canvas = document.querySelector("#bubble"),
      context = canvas.getContext("2d")
      width = canvas.width,
      height = canvas.height,
      tau = 2 * Math.PI;

  // var nodes = d3.range(1000).map(function(i) {
  //   return {
  //     r: Math.random() * 14 + 4
  //   };
  // });

  var simulation = d3.forceSimulation(nodes)
      .velocityDecay(0.2)
      .force("x", d3.forceX().strength(0.002))
      .force("y", d3.forceY().strength(0.002))
      .force("collide", d3.forceCollide().radius(function(d) { return d.limited/4; }).iterations(2))
      .on("tick", ticked);

  function ticked() {
    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(width / 2, height / 2);
    
    nodes.forEach(function(d) {            
      if (d.type == "ETB") {
        context.beginPath();
        context.moveTo(d.x + d.limited/2, d.y);      
        context.fillStyle = "#68c4fc" 
        context.arc(d.x, d.y, d.limited/2, 0, tau);
        context.fill(); 
        context.closePath();       

      } else {
        context.beginPath();
        context.moveTo(d.x + d.limited/2, d.y);
        context.fillStyle = "#587b9e"  
        context.arc(d.x, d.y, d.limited/2, 0, tau);
        context.fill();   
        context.closePath();    
      } 
        context.beginPath();
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText(d.limited, d.x, d.y); 
        context.closePath(); 

    });
    // context.fillStyle = "#ddd";
    // context.fill();
    // context.strokeStyle = "#333";
    // context.stroke();

    context.restore();
  }

  // $("#chart").kendoChart({
  //     dataSource: {
  //         data: salesData
  //     },
  //     series: [{
  //         name: "Sales",
  //         type: "bubble",
  //         xField: "numberOfSales",
  //         yField: "volume",
  //         sizeField: "marketShare"
  //     }]
  // });

}

counterpartymain.close = function() {
  div.transition()
    .duration(500)
    .style("opacity", 0);
  d3.selectAll("circle").transition().duration(500)
    .style("opacity", 1);
  d3.selectAll("text").transition().duration(500)
    .style("opacity", 1);
  d3.selectAll(".link").transition().duration(500)
    .style("opacity", 1);
  d3.selectAll(".linkdash").transition().duration(500)
    .style("opacity", 1);
}

counterpartymain.onChangeBuyerSupplier = function(e) {
  if (e != "") {
    // console.log(e)
    $("#graph").hide()
    $("#bubble").show()
    counterpartymain.generateGraphBubble()
    return
  }
  $("#graph").show()
  $("#bubble").hide()
  counterpartymain.generateGraph()
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