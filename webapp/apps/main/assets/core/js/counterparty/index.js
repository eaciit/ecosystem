var counterpartymain = {}
counterpartymain.headtext = ko.observable()
counterpartymain.dataDetailItemsNTB = ko.observableArray([])
counterpartymain.dataDetailItemsETB = ko.observableArray([])
counterpartymain.dataMasterBubble = ko.observableArray([])
counterpartymain.dataDetailItemsGraphBubble = ko.observableArray([])
counterpartymain.dataMasterGraphDetail = ko.observableArray([])
counterpartymain.titleCountryPartyBuble = ko.observable()
counterpartymain.dataMasterGraph = {
  nodes: ko.observableArray([]),
  links: ko.observableArray([])
}
counterpartymain.filterDataArray = {
  entityGroup: ko.observableArray([]),
  buyerSupplierGroup: ko.observableArray([]),
  limitGroup: ko.observable(),
}
counterpartymain.filterRecord = {
  entityName: ko.observable(),
  buyerSupplier: ko.observable(),
  limit: ko.observable(5),
  role: ko.observable(),
  counterpartyName: ko.observable(),
}
counterpartymain.filterDataArray.buyerSupplierGroup = [{
  "value": "PAYEE",
  "text": "Supplier"
}, {
  "value": "BUYER",
  "text": "Buyer"
}]
counterpartymain.filterDataArray.limitGroup = [{
  "value": 5,
  "text": "Top 5"
}, {
  "value": 10,
  "text": "Top 10"
}]

counterpartymain.group = [{
  "value": "ETB",
  "text": "ETB"
}, {
  "value": "NTB",
  "text": "NTB"
}]

counterpartymain.flows = [{
  "value": 31,
  "text": "Flows>$30M"
}, {
  "value": 100,
  "text": "Flows>$100M"
}]

counterpartymain.loadEntity = function() {
  viewModel.ajaxPostCallback("/main/master/getentities", {
    limit: counterpartymain.filterRecord.limit()
  }, function(data) {
    counterpartymain.filterDataArray.entityGroup(data)
    if (data != undefined && data.length > 0) {
      counterpartymain.filterRecord.entityName(data[0].cust_long_name)
    }
  })
}

counterpartymain.loadGraphData = function() {
  var entity = "Zanesfield"
  if (counterpartymain.filterRecord.entityName() != undefined) {
    var entity = counterpartymain.filterRecord.entityName()
  }
  viewModel.ajaxPostCallback("/main/counterparty/getnetworkbuyersupplier", {
    role: counterpartymain.filterRecord.role(),
    entityName: entity,
    limit: counterpartymain.filterRecord.limit()
  }, function(data) {
    var datas = data[_.keys(data)[0]]
    tempnodes = [];
    templinks = []
    _.each(datas, function(v, i) {
      var t = ""
      if (v.is_ntb == "Y") {
        t = "NTB"
      } else {
        t = "ETB"
      }
      tempnodes.push({
        id: i,
        name: v.cpty_long_name,
        group: 2,
        type: t,
        limited: v.total,
        country: v.cpty_coi,
      });

      templinks.push({
        source: i,
        name: v.cpty_long_name,
        target: entity,
        type: t,
      });
    });
    tempnodes.push({
      id: entity,
      name: entity,
      group: 1,
      type: "CENTER",
      country: "",
    });
    counterpartymain.filterRecord.entityName(entity)
    counterpartymain.dataMasterGraph.nodes(tempnodes)
    counterpartymain.dataMasterGraph.links(templinks)
    counterpartymain.generateGraph()

    if (counterpartymain.filterRecord.role() != "") {
      counterpartymain.dataMasterBubble(datas)
      tempnodesbubble = []
      _.each(datas, function(v, i) {
        var t = ""
        if (v.is_ntb == "Y") {
          t = "NTB"
        } else {
          t = "ETB"
        }
        tempnodesbubble.push({
          id: i,
          name: v.cpty_long_name,
          group: 2,
          type: t,
          limited: v.total,
          country: v.cpty_coi,
        });
      });
      counterpartymain.dataMasterBubble(tempnodesbubble)
      counterpartymain.generateGraphBubble()
    }
  })
}

var div = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

counterpartymain.generateGraph = function() {
  var nodes = counterpartymain.dataMasterGraph.nodes()
  var links = counterpartymain.dataMasterGraph.links()

  $("#graph").html("")

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
    .force("collision", d3.forceCollide().radius(function(d) {
      return 50 + 10;
    }))

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
      .attr("dy", -3)
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
      .on("click", function(d) {
        // console.log(d)
        if (d.type != "CENTER") {
          counterpartymain.headtext(d.type)
          div.transition()
            .duration(200)
            .style("opacity", 1);
          if (d.type == "NTB") {

            var ThisTemp = this

            counterpartymain.filterRecord.counterpartyName(d.name)
            viewModel.ajaxPostCallback("/main/counterparty/getnetworkbuyersupplierproducts", {
              entityName: counterpartymain.filterRecord.entityName(),
              counterpartyName: d.name,

            }, function(data) {
              counterpartymain.dataMasterGraphDetail(data)
              counterpartymain.dataDetailItemsNTB(data)

              div.html($("#counterpartyModalNTB").html())
                .style("left", (d3.select(ThisTemp).attr("cx")) + 50 + "px")
                .style("top", (d3.select(ThisTemp).attr("cy")) + 50 + "px")
                .style("margin-top", "50px")
                .style("margin-left", "120px")


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
            })
            return
          }
          counterpartymain.dataDetailItemsETB(d.listdetail[0])
          div.html($("#counterpartyModalETB").html())
            .style("left", (d3.select(this).attr("cx")) + 50 + "px")
            .style("top", (d3.select(this).attr("cy")) + 50 + "px")
            .style("margin-top", "50px")
            .style("margin-left", "120px")


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
        if (d.type == "CENTER") {
          return "#1e88e5"
        }
        if (d.type == "ETB") {
          return "#68c4fc"
        }
        return "#587b9e"
      })

    node.append("title")
      .text(function(d) {
        return d.name
      })

    node.append("text")
      .attr("x", 0)
      .attr("dy", ".15em")
      .attr("text-anchor", "middle")
      .text(function(d) {
        return d.name
      })

    node.append("text")
      .attr("x", 0)
      .attr("dy", "1.35em")
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .text(function(d) {
        if (d.type != "CENTER") {
          return "$" + currencynum(d.limited) + ""
        }
        return d.limited
      })

    node.append("text")
      .attr("x", 0)
      .attr("dy", "3.45em")
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .text(function(d) {
        if (d.type == "CENTER") {
          return ""
        }
        return d.country
      })
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
      .attr("cx", function(d) {
        return d.x;
      })
      .attr("cy", function(d) {
        return d.y;
      })
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

  simulation
    .nodes(nodes)
    .on("tick", ticked)

  simulation.force("link")
    .links(links)

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
  // var nodes = [{
  //   id: "Ibrahim Fibres",
  //   group: 2,
  //   type: "ETB",
  //   limited: 40,
  $("#bubble").html("<svg></svg>")
  var nodes = counterpartymain.dataMasterBubble()
  console.log(nodes)
  // normalize circle
  function preprocess(nod) {
    var max = _.maxBy(nod, "limited").limited;
    var min = _.minBy(nod, "limited").limited;

    m = _.map(nod, function(it) {
      it.r = (it.limited - min) / (max - min) + 0.50;
      it.r = it.r * 70;
      if (it.type == "ETB") {
        it.fill = "#68c4fc";
      } else {
        it.fill = "#587b9e";
      }
      return it;
    })

    m.unshift({});

    return m;
  }
  var width = $("#bubble").width(),
    height = $("#bubble").height()
  nodes = preprocess(nodes);
  var chart = bubbleChart().width(width).height(height);
  d3.selectAll('#bubble').data(nodes).call(chart);

  function bubbleChart() {
    // var width = 960,
    //   height = 960,
    maxRadius = 6,
      columnForColors = "category",
      columnForRadius = "views";

    function chart(selection) {
      var data = selection.enter().data();
      var div = selection,
        svg = div.selectAll('svg');
      svg.attr('width', width).attr('height', height);

      var tooltip = selection
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .attr("class", "tooltipbubble")
        .text("");

      var simulation = d3.forceSimulation(data)
        .force("charge", d3.forceManyBody().strength([-50]))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .force("collision", d3.forceCollide().radius(function(d) {
          return d.r + 10;
        }))
        .on("tick", ticked);

      function ticked(e) {
        node.attr("cx", function(d) {
            return d.x;
          })
          .attr("cy", function(d) {
            return d.y;
          })
          .attr('transform', function(d) {
            return 'translate(' + [width / 2 + d.x, height / 2 + d.y] + ')';
          })
      }

      var node = svg.selectAll("g")
        .data(data)
        .enter()
        .append("g")
        .attr('r', function(d) {
          return d.r;
        })
        .on("click", function(d, ev, eb, mn) {
          counterpartymain.titleCountryPartyBuble(d.name)
          viewModel.ajaxPostCallback("/main/counterparty/getnetworkbuyersupplierdetail", {
            entityName: counterpartymain.filterRecord.entityName(),
            counterpartyName: d.name,
          }, function(data) {
            counterpartymain.dataDetailItemsGraphBubble(data)
            tooltip.html($("#datadetailgraph").html());
            tooltip.style("margin-top", "70px")
            tooltip.style("margin-left", "60px")
            tooltip.style("left", d.x + width / 2 + d.r + 5 + "px")
            tooltip.style("top", d.y + height / 2 + "px")
            tooltip.style("visibility", "visible");

            d3.selectAll("circle").transition().duration(500)
              .style("opacity", function(o) {
                return o === d ? 1 : .1;
              });
            d3.selectAll("text").transition().duration(500)
              .style("opacity", function(o) {
                return o === d ? 1 : .1;
              });
            return
          })
        })

      node.append("circle")
        .attr('r', function(d) {
          return d.r;
        })
        .style("fill", function(d) {
          return d.fill;
        })

      node.append("text")
        .attr("x", 0)
        .attr("dy", ".15em")
        .attr("text-anchor", "middle")
        .text(function(d) {
          return d.name
        })

      node.append("text")
        .attr("x", 0)
        .attr("dy", "1.35em")
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .text(function(d) {
          if (d.type != "CENTER") {
            return "$" + currencynum(d.limited) + ""
          }
          return d.limited
        })

      node.append("text")
        .attr("x", 0)
        .attr("dy", "3.45em")
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .text(function(d) {
          if (d.type == "CENTER") {
            return ""
          }
          return d.country
        })
    }

    chart.width = function(value) {
      if (!arguments.length) {
        return width;
      }
      width = value;
      return chart;
    };

    chart.height = function(value) {
      if (!arguments.length) {
        return height;
      }
      height = value;
      return chart;
    };

    chart.columnForColors = function(value) {
      if (!arguments.columnForColors) {
        return columnForColors;
      }
      columnForColors = value;
      return chart;
    };

    chart.columnForRadius = function(value) {
      if (!arguments.columnForRadius) {
        return columnForRadius;
      }
      columnForRadius = value;
      return chart;
    };
    return chart;
  }
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

counterpartymain.closeBubbleChart = function() {
  $(".tooltipbubble").attr("style", "visibility:hidden;top:-10px;left:10px;position: absolute;");
  d3.selectAll("circle").transition().duration(500)
    .style("opacity", 1);
  d3.selectAll("text").transition().duration(500)
    .style("opacity", 1);
}

counterpartymain.onChangeBuyerSupplier = function(e) {
  console.log(e)
  if (e != "") {
    $("#graph").hide()
    $("#bubble").show()
    counterpartymain.close()
    counterpartymain.filterRecord.role()
    counterpartymain.loadGraphData()
    // counterpartymain.generateGraphBubble()
    return
  }
  $("#graph").show()
  $("#bubble").hide()
  counterpartymain.closeBubbleChart()
  counterpartymain.generateGraph()
}

counterpartymain.onChangeEntity = function(e) {
  console.log(e)
  counterpartymain.filterRecord.entityName(e)
  counterpartymain.loadGraphData()
}

counterpartymain.init = function() {
  counterpartymain.loadEntity()
  counterpartymain.loadGraphData()
}

$(window).load(function() {
  counterpartymain.init()
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