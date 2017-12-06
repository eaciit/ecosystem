var missedflow = {}
missedflow.data = ko.observableArray([])
missedflow.activeEntityName = ko.observable("")
missedflow.activeGroupName = ko.observable("")
missedflow.activeEntityCOI = ko.observable("")
missedflow.highlightedNode = ko.observable("")
missedflow.highlightedLinks = ko.observableArray([])
missedflow.highlightedSum = ko.observable()

missedflow.resetHighlight = function () {
  missedflow.highlightedNode("")
  missedflow.highlightedLinks([])
  missedflow.highlightedSum()
}

missedflow.loadAll = function () {
  missedflow.activeGroupName($.urlParam("entityGroup"))
  missedflow.activeEntityCOI($.urlParam("entityCOI"))

  // Update the view model global filter
  viewModel.globalFilter.groupname($.urlParam("entityGroup"))
}

var filter = {}
filter.groupNames = ko.observableArray([])
filter.selectedGroupName = ko.observable("")
filter.entities = ko.observableArray([])
filter.selectedEntity = ko.observable("")

filter.group = [{
  "value": "ALL",
  "text": "All"
}, {
  "value": "ETB",
  "text": "ETB"
}, {
  "value": "NTB",
  "text": "NTB"
}, {
  "value": "Intra-Group",
  "text": "Intra-Group"
}]
filter.selectedGroup = ko.observable("ALL")

filter.productCategories = [{
  "value": "",
  "text": "All Products"
}, {
  "value": "Cash",
  "text": "Cash"
}, {
  "value": "Trade",
  "text": "Trade"
}]
filter.selectedProductCategory = ko.observable("")

filter.limit = [{
  "value": 5,
  "text": "Top 5"
}, {
  "value": 10,
  "text": "Top 10"
}, {
  "value": 50,
  "text": "Top 50"
}, {
  "value": 100,
  "text": "Top 100"
}, {
  "value": 0,
  "text": "All"
}]
filter.selectedLimit = ko.observable(5)

filter.flow = [{
  "value": 0,
  "text": "All"
}, {
  "value": 30000000,
  "text": "Flows > $30M"
}, {
  "value": 100000000,
  "text": "Flows > $100M"
}]
filter.selectedFlow = ko.observable(0)

filter.selectedDateType = "Y"
filter.selectedDate = ko.observable("")

filter.selectedFilters = ko.computed(function () {
  var yearMonth = 0
  var dateType = ""
  var d = moment(filter.selectedDate())

  if (filter.selectedDateType == "Y") {
    dateType = "YEAR"
    yearMonth = d.isValid() ? parseInt(d.format("YYYY")) : 0
  } else {
    dateType = "MONTH"
    yearMonth = d.isValid() ? parseInt(d.format("YYYYMM")) : 0
  }

  return {
    groupName: missedflow.activeGroupName(),
    entityName: missedflow.activeEntityName(),
    group: filter.selectedGroup(),
    productCategory: filter.selectedProductCategory(),
    limit: parseInt(filter.selectedLimit()),
    flowAbove: parseInt(filter.selectedFlow()),
    datetype: dateType,
    yearMonth: yearMonth
  }
})

filter.switchDateType = function (data, event) {
  $(event.target).siblings().removeClass("active")
  $(event.target).addClass("active")

  filter.selectedDateType = $(event.target).text()

  if (filter.selectedDateType == "M") {
    $("#datePicker").data("kendoDatePicker").setOptions({
      start: "year",
      depth: "year",
      format: "MMM yyyy"
    })
  } else {
    $("#datePicker").data("kendoDatePicker").setOptions({
      start: "decade",
      depth: "decade",
      format: "yyyy"
    })
  }
}

filter.loadEntities = function () {
  viewModel.ajaxPostCallback("/main/master/getentities", {
    groupName: filter.selectedGroupName()
  }, function (data) {
    filter.entities(["All"].concat(_.map(data, "value")))
    filter.selectedEntity.valueHasMutated()
  })
}

filter.loadGroupNames = function () {
  viewModel.ajaxPostCallback("/main/master/getgroups", {}, function (data) {
    filter.groupNames(_.map(data, "value"))
    filter.selectedGroupName.valueHasMutated()
  })
}

filter.loadAll = function () {
  filter.selectedGroupName(missedflow.activeGroupName())
  filter.selectedEntity.subscribe(function (nv) {
    missedflow.activeGroupName(filter.selectedGroupName())
    missedflow.activeEntityName(nv)
  })

  filter.selectedGroupName.subscribe(function () {
    filter.loadEntities()
  })

  filter.selectedEntity($.urlParam("entityName"))

  filter.loadGroupNames()
  missedflow.loadGraphData()

  // Enable this if you want the filter to be realtime load
  // filter.selectedFilters.subscribe(function () {
  //   missedflow.loadGraphData()
  // })
}

missedflow.loadGraphData = function () {
  missedflow.resetHighlight()

  viewModel.ajaxPostCallback("/main/missedflow/getmissedflowdata", filter.selectedFilters(), function (data) {
    var links = []
    var nodes = []

    if (filter.selectedGroup() == "ALL" && data.length > 0) {
      var groups = ["ETB", "NTB", "Intra-Group"]

      _.each(groups, function (g, i) {
        var count = 0
        var newNodes = []

        _.each(data, function (e) {
          var isReversed = false
          isReversed = e.cust_role == "PAYEE" ? !isReversed : isReversed
          var push = false

          if (g == "ETB" && e.is_ntb == "N" && e.cust_group_name != e.cpty_group_name) {
            push = true
          } else if (g == "NTB" && e.is_ntb == "Y") {
            push = true
          } else if (g == "Intra-Group" && e.cust_group_name == e.cpty_group_name) {
            push = true
          }

          if (push) {
            var sourceName = e.cust_long_name
            var source = _.find(nodes, {
              name: sourceName,
              as: "source"
            })

            if (!source) {
              source = _.find(newNodes, {
                name: sourceName,
                as: "source"
              })
            }

            if (source) {
              sourceIndex = source.node
            } else {
              newNodes.push({
                as: "source",
                node: nodes.length + newNodes.length + 1,
                name: sourceName,
                country: e.cust_coi
              })

              sourceIndex = nodes.length + newNodes.length
            }

            count += 1

            links.push({
              source: sourceIndex,
              target: nodes.length,
              value: e.total,
              sourceBank: e.cust_bank,
              sourceName: e.cust_long_name,
              targetBank: e.cpty_bank,
              targetName: e.cpty_long_name,
              isReversed: isReversed
            })
          }
        })

        if (count > 0) {
          nodes.push({
            as: "target",
            node: nodes.length,
            name: g,
            country: ""
          })

          nodes = nodes.concat(newNodes)
        }
      })
    } else {
      _.each(data, function (e) {
        var sourceName = e.cust_long_name
        var targetName = e.cpty_long_name

        var source = _.find(nodes, {
          name: sourceName,
          as: "source"
        })

        var target = _.find(nodes, {
          name: targetName,
          as: "target"
        })

        var isReversed = false
        var rs = _.find(nodes, {
          name: targetName,
          as: "source"
        })

        var rt = _.find(nodes, {
          name: sourceName,
          as: "target"
        })

        if (rt && rs) {
          source = rs
          target = rt
          isReversed = true
        }

        var sourceIndex = undefined
        var targetIndex = undefined

        if (source) {
          sourceIndex = source.node
        } else {
          nodes.push({
            as: "source",
            node: nodes.length,
            name: sourceName,
            country: e.cust_coi
          })

          sourceIndex = nodes.length - 1
        }

        if (target) {
          targetIndex = target.node
        } else {
          nodes.push({
            as: "target",
            node: nodes.length,
            name: targetName,
            country: e.cpty_coi
          })

          targetIndex = nodes.length - 1
        }

        isReversed = e.cust_role == "PAYEE" ? !isReversed : isReversed

        links.push({
          source: sourceIndex,
          target: targetIndex,
          value: e.total,
          sourceBank: e.cust_bank,
          sourceName: e.cust_long_name,
          targetBank: e.cpty_bank,
          targetName: e.cpty_long_name,
          isReversed: isReversed
        })
      })
    }

    // Escape null
    nodes = _.map(nodes, function (e) {
      e.name = String(e.name)
      return e
    })

    links = _.map(links, function (e) {
      e.sourceName = String(e.sourceName)
      e.targetName = String(e.targetName)
      return e
    })

    missedflow.generateGraph({
      "nodes": nodes,
      "links": links
    })
  })
}

missedflow.generateGraph = function (data) {
  $("#missedflowchart").html("")
  var margin = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    },
    width = $("#missedflowchart").width() - margin.left - margin.right,
    height = Math.log2(data.links.length) * 200

  color = d3.scaleOrdinal().range(["#1e88e5", "#1e88e5", "#8893a6", "#8893a6", "#44546a", "#44546a"])
  colorsource = d3.scaleOrdinal().range(["#005c84", "#0075b0", "#009fda", "#2890c0", "#6ba8d0", "#a1c5e0"])
  colortarget = d3.scaleOrdinal().range(["#019875", "#03A678", "#3f9c35", "#69be28", "#6ac17b", "#9fd18b", "#c3e2c1"])
  /* Initialize tooltip */
  var tipLinks = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0]);

  // append the svg canvas to the page
  var svg = d3.select("#missedflowchart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(tipLinks)

  var svgDefs = svg.append('defs')
  var mainGradient = svgDefs.append('linearGradient')
    .attr('id', 'mainGradient')
    .attr('gradientUnits', 'userSpaceOnUse')

  mainGradient.append('stop')
    .attr('class', 'stop-left')
    .attr('offset', '0')

  mainGradient.append('stop')
    .attr('class', 'stop-right')
    .attr('offset', '1')

  var reversedGradient = svgDefs.append('linearGradient')
    .attr('id', 'reversedGradient')
    .attr('gradientUnits', 'userSpaceOnUse')

  reversedGradient.append('stop')
    .attr('class', 'stop-right')
    .attr('offset', '0')

  reversedGradient.append('stop')
    .attr('class', 'stop-left')
    .attr('offset', '1')

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
    .style("stroke", function (d) {
      return d.isReversed ? "url(#reversedGradient)" : "url(#mainGradient)"
    })
    .sort(function (a, b) {
      return b.dy - a.dy
    })
    .on('mouseover', function (d) {
      tipLinks.show(d)

      missedflow.highlightedNode(d.source)
      missedflow.highlightedLinks([d])
      missedflow.highlightedSum("Total Flow : $ " + setbm(d.value))
    })
    .on('mouseout', tipLinks.hide)

  var gradientLink = svg.append("g")
    .selectAll(".gradient-link")
    .data(graph.links)
    .enter()
    .append("path")
    .attr("class", "gradient-link")
    .attr("d", path)
    .style("stroke-width", function (d) {
      return Math.max(1, d.dy)
    })
    .style("stroke", function (d) {
      return d.isReversed ? "url(#reversedGradient)" : "url(#mainGradient)"
    })
    .sort(function (a, b) {
      return b.dy - a.dy
    })
    .each(setDash)

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
      if (d.as == "source") {
        return d.color = colorsource(d.name.replace(/ .*/, ""))
      }
      return d.color = colortarget(d.name.replace(/ .*/, ""))
    })
    .on("mouseover", function (d) {
      highlightLink(d.node)
    })
    .on("mouseout", unhighlightLink)

  node.append("text")
    .attr("class", "shadow")
    .attr("y", function (d) {
      return d.dy / 2
    })
    .attr("transform", function (d) {
      return filter.selectedGroup() == "ALL" && d.as == "target" ? "rotate(90, -6, " + (d.dy / 2 + 12) + ")" : ""
    })
    .tspans(function (d) {
      var name = d.name;
      return d3.wordwrap(name, name.length / 2);
    })
    .attr("x", function (d) {
      if (d.parent.as == "source") {
        return 25
      }
      return -6
    })
    .attr("text-anchor", function (d) {
      if (d.parent.as == "source") {
        return "start"
      }
      return "end"
    })

  node.append("text")
    .attr("y", function (d) {
      return d.dy / 2
    })
    .attr("transform", function (d) {
      return filter.selectedGroup() == "ALL" && d.as == "target" ? "rotate(90, -6, " + (d.dy / 2 + 12) + ")" : ""
    })
    .tspans(function (d) {
      var name = d.name;
      return d3.wordwrap(name, name.length / 2);
    })
    .attr("x", function (d) {
      if (d.parent.as == "source") {
        return 25
      }
      return -6
    })
    .attr("text-anchor", function (d) {
      if (d.parent.as == "source") {
        return "start"
      }
      return "end"
    })

  if (filter.selectedGroup() == "ALL") {
    var linkText = svg.append("g")
      .selectAll(".link-text")
      .data(graph.links)
      .enter()
      .append("g")

    linkText.append("text")
      .attr("class", "shadow")
      .attr("text-anchor", "end")
      .text(function (d) {
        return d.targetName
      })
      .attr("y", function (d) {
        return d.target.y + d.ty + d.dy / 2
      })
      .attr("x", function (d) {
        return d.target.x - 10
      })

    linkText.append("text")
      .attr("text-anchor", "end")
      .text(function (d) {
        return d.targetName
      })
      .attr("y", function (d) {
        return d.target.y + d.ty + d.dy / 2
      })
      .attr("x", function (d) {
        return d.target.x - 10
      })
  }

  function setDash(d) {
    var d3this = d3.select(this);
    var totalLength = d3this.node().getTotalLength();
    d3this
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)

    d.pathLength = totalLength
  }

  function highlightLink(n) {
    var highlightedLinks = []

    d3.selectAll(".gradient-link").each(function () {
      var link = d3.select(this)
      var data = link.data()[0]
      if (data.source.node == n || data.target.node == n) {
        highlightedLinks.push(data)

        var dashoffset = data.isReversed ? data.pathLength * 2 : 0
        link.classed("selected", true)
        link
          .style("stroke-opacity", 1)
          .transition()
          .duration(500)
          .attr("stroke-dashoffset", dashoffset)
      }
    })

    missedflow.highlightedNode(graph.nodes[n])
    missedflow.highlightedLinks(highlightedLinks)

    var sumvalue = _.sumBy(highlightedLinks, 'value')
    missedflow.highlightedSum("Total Flow : $ " + setbm(sumvalue))
  }

  function unhighlightLink() {
    d3.selectAll(".gradient-link.selected").each(function () {
      d3.select(this)
        .style("stroke-opacity", 0)
        .each(setDash)
    })
  }

  tipLinks.html(function (d) {
    var html = '<div class="table-wrapper">' +
      '<table>' +
      '<tr>' +
      '<td class="col-left">Anchor Entity</td>' +
      '<td class="col-left">: ' + d.sourceName + '</td>' +
      '</tr>' +
      '<tr>' +
      '<td class="col-left">Anchor Entity Bank</td>' +
      '<td class="col-left">: ' + d.sourceBank + '</td>' +
      '</tr>' +
      '<tr>' +
      '<td class="col-left">Cpty</td>' +
      '<td class="col-left">: ' + d.targetName + '</td>' +
      '</tr>' +
      '<tr>' +
      '<td class="col-left">Cpty Bank</td>' +
      '<td class="col-left">: ' + d.targetBank + '</td>' +
      '</tr>' +
      '<tr>' +
      '<td class="col-left">Total Flow</td>' +
      '<td class="col-left">: $ ' + setbm(d.value) + '</td>' +
      '</tr>' +
      '</table>' +
      '</div>';
    return html;
  });
}

// Printing
missedflow.beforePDFPrinting = function (style) {
  var def = $.Deferred();

  var svg = $("#missedflowchart svg")[0];

  var styleElement = document.createElement("style")
  styleElement.innerHTML = style

  // inject style
  $(svg).prepend(styleElement);

  // var sheight = $("#missedflowchart svg").attr("height")
  var sheight = 700

  var rect = svg.getBoundingClientRect();
  var img = document.createElement("img");
  var canvas = document.createElement('canvas');
  canvas.width = 693 * 2;
  canvas.height = sheight * 2;
  var ctx = canvas.getContext('2d');

  var imgCanvas = new Image(),
    serializer = new XMLSerializer(),
    svgStr = serializer.serializeToString(svg);

  imgCanvas.onload = function () {
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 693 * 2, sheight * 2);
    ctx.drawImage(imgCanvas, 0, 0, 693 * 2, sheight * 2);

    var base64Image = canvas.toDataURL("image/jpeg", 0.75);

    img.src = base64Image;
    img.style = "position:absolute;top:" + rect.top + "px;left:" + rect.left + "px;";
    img.className = "remove-after-print";
    img.width = 693;
    img.height = sheight;
    svg.parentNode.insertBefore(img, svg);

    def.resolve(true)
  }

  imgCanvas.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
  return def
}

missedflow.afterPDFPrinting = function () {
  $(".remove-after-print").remove();
  $("svg > style").remove();
}

missedflow.getPDF = function (selector) {
  $.ajax({
    url: "/main/static/core/css/missedflow/index.css",
    success: function (data) {
      buildAndSave(data)
    },
    dataType: 'html'
  })

  function buildAndSave(style) {
    $.when(
      missedflow.beforePDFPrinting(style)
    ).done(function () {
      kendo.drawing.drawDOM($(selector))
        .then(function (group) {
          return kendo.drawing.exportPDF(group, {
            paperSize: "auto",
            margin: {
              left: "1cm",
              top: "1cm",
              right: "1cm",
              bottom: "1cm"
            }
          });
        })
        .then(function (data) {
          kendo.saveAs({
            dataURI: data,
            fileName: "ExportMissedFlow.pdf"
          });
        })
        .done(function () {
          missedflow.afterPDFPrinting();
        })
    })
  }
}

$(window).load(function () {
  missedflow.loadAll()
  filter.loadAll()
})