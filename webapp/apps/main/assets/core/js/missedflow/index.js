var missedflow = {}
missedflow.data = ko.observableArray([])
missedflow.activeEntityName = ko.observable("")
missedflow.activeGroupName = ko.observable("DOW CHEMICAL GROUP")
missedflow.activeEntityCOI = ko.observable()
missedflow.highlightedNode = ko.observable("")
missedflow.highlightedLinks = ko.observableArray([])
missedflow.highlightedSum = ko.observable()

var filter = {}
filter.entities = ko.observableArray([])
filter.selectedEntity = ko.observable("")

filter.role = [{
  "value": "",
  "text": "Buyer & Supplier"
}, {
  "value": "BUYER",
  "text": "Buyer"
}, {
  "value": "PAYEE",
  "text": "Supplier"
}]
filter.selectedRole = ko.observable("")

filter.group = [{
  "value": "ETB",
  "text": "ETB"
}, {
  "value": "NTB",
  "text": "NTB"
}, {
  "value": "Intra-Group",
  "text": "Intra-Group"
}]
filter.selectedGroup = ko.observable("ETB")

filter.productCategories = [{
  "value": "",
  "text": "All"
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
filter.selectedYear = ko.observable("")
filter.selectedMonth = ko.observable("")

filter.selectedFilters = ko.computed(function () {
  var yearMonth = 0
  var dateType = ""
  var y = moment(filter.selectedYear())
  var m = moment(filter.selectedMonth())

  if (filter.selectedDateType == "Y") {
    dateType = "YEAR"
    yearMonth = y.isValid() ? parseInt(y.format("YYYY")) : 0
  } else {
    dateType = "MONTH"
    yearMonth = m.isValid() ? parseInt(m.format("YYYYMM")) : 0
  }

  return {
    groupName: missedflow.activeGroupName(),
    entityName: missedflow.activeEntityName(),
    role: filter.selectedRole(),
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

  $($(event.target).siblings().data("target")).data('kendoDatePicker').enable(false)
  $($(event.target).data("target")).data('kendoDatePicker').enable(true)

  filter.selectedDateType = $(event.target).text()
}

filter.loadEntities = function () {
  viewModel.ajaxPostCallback("/main/master/getentities", {
    groupName: missedflow.activeGroupName()
  }, function (data) {
    filter.entities(_.map(data, "value"))
    filter.selectedEntity(filter.entities()[0])
  })
}

filter.loadAll = function () {

  $("#month").data('kendoDatePicker').enable(false)
  missedflow.activeEntityCOI($.urlParam("entityCOI"))

  filter.selectedEntity.subscribe(function (nv) {
    missedflow.activeEntityName(nv)
  })

  filter.selectedEntity($.urlParam("entityName"))
  filter.loadEntities()

  filter.selectedFilters.subscribe(function () {
    missedflow.loadGraphData()
  })
}

missedflow.loadGraphData = function () {
  viewModel.ajaxPostCallback("/main/missedflow/getmissedflowdata", filter.selectedFilters(), function (data) {
    var links = []
    var nodes = []

    _.each(data, function (e) {
      var total = e.total

      var source = _.find(nodes, {
        name: e.cust_long_name,
        as: "source"
      })

      var target = _.find(nodes, {
        name: e.cpty_long_name,
        as: "target"
      })

      var isReversed = false
      var rs = _.find(nodes, {
        name: e.cpty_long_name,
        as: "source"
      })

      var rt = _.find(nodes, {
        name: e.cust_long_name,
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
          name: e.cust_long_name,
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
          name: e.cpty_long_name,
          country: e.cpty_coi
        })

        targetIndex = nodes.length - 1
      }

      links.push({
        source: sourceIndex,
        target: targetIndex,
        value: total,
        sourceBank: isReversed ? e.cpty_bank : e.cust_bank,
        targetBank: isReversed ? e.cust_bank : e.cpty_bank,
        isReversed: isReversed
      })
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
    height = $("#missedflowchart").height() - margin.top - margin.bottom

  color = d3.scaleOrdinal().range(["#1e88e5", "#1e88e5", "#8893a6", "#8893a6", "#44546a", "#44546a"])
  colorsource = d3.scaleOrdinal().range(["#c4e6e8", "#61cae8", "#00b4e1", "#0197d2", "#01677e", "#02667e", "#005667", "#3d1c9f", "#92d0e7", "#005399", "#192d4e", "#6e8cd5"])
  colortarget = d3.scaleOrdinal().range(["#702a72", "#7b2580", "#85298c", "#9a43a4", "#a160bc", "#cca6d5", "#e6d8e7", "#cd4ec3", "#7b316c", "#d0bae1", "#683256", "#ebd0df"])
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
    var highlightedLinks = []

    d3.selectAll(".link").each(function () {
      link = d3.select(this)
      if (link.data()[0].source.node == n || link.data()[0].target.node == n) {
        highlightedLinks.push(link.data()[0])
        link.attr("class", "link selected")
      }
    })

    missedflow.highlightedNode(graph.nodes[n])
    missedflow.highlightedLinks(highlightedLinks)

    var sumvalue = _.sumBy(highlightedLinks, 'value')
    missedflow.highlightedSum("Total Flow : $ "+setbm(sumvalue))
  }

  function unhighlightLink() {
    d3.selectAll(".link.selected").each(function () {
      d3.select(this).attr("class", "link")
    })
  }

  // "➡" 

  tipLinks.html(function (d) {
    var title, candidate;
    candidate = d.source.name;
    title = d.target.name;
    var html = '<div class="table-wrapper">' +
      '<table>' +
      '<tr>' +
      '<td class="col-left">Customer Name</td>' +
      '<td class="col-left">: ' + candidate + '</td>' +
      '</tr>' +
      '<tr>' +
      '<td class="col-left">Customer Bank</td>' +
      '<td class="col-left">: ' + d.sourceBank + '</td>' +
      '</tr>' +
      '<tr>' +
      '<td class="col-left">Counterparty Name</td>' +
      '<td class="col-left">: ' + title + '</td>' +
      '</tr>' +
      '<tr>' +
      '<td class="col-left">Counterparty Bank</td>' +
      '<td class="col-left">: ' + d.targetBank + '</td>' +
      '</tr>' +
      '<tr>' +
      '<td class="col-left">Total Flow</td>' +
      '<td class="col-left">: $ ' + currencynum(d.value) + '</td>' +
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
  filter.loadAll()
  missedflow.loadGraphData()
})