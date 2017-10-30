var counterparty = {}
counterparty.detail = ko.observableArray([])
counterparty.activeEntityName = ko.observable()
counterparty.activeEntityCOI = ko.observable()
counterparty.activeName = ko.observable()
counterparty.activeDisplayName = ko.observable()
counterparty.activeGroupName = ko.observable("Rollin")

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
  "value": "",
  "text": "Both"
}, {
  "value": "ETB",
  "text": "ETB"
}, {
  "value": "NTB",
  "text": "NTB"
}]
filter.selectedGroup = ko.observable("")

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
    entityName: counterparty.activeEntityName(),
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
    groupName: counterparty.activeGroupName()
  }, function (data) {
    filter.entities(_.map(data, "value"))
    filter.selectedEntity.valueHasMutated()
  })
}

filter.loadAll = function () {
  $("#month").data('kendoDatePicker').enable(false)
  counterparty.activeEntityCOI($.urlParam("entityCOI"))

  filter.selectedEntity.subscribe(function (nv) {
    counterparty.activeEntityName(nv)
  })

  filter.selectedEntity($.urlParam("entityName"))
  filter.loadEntities()

  filter.selectedFilters.subscribe(function () {
    if (!network.isExpanding) {
      network.clean()
    }

    network.isExpanding = false
    network.loadData()
  })
}

var network = {}
network.data = []
network.links = []
network.nodes = []
network.level = 0
network.isExpanding = false

network.clean = function () {
  network.data = []
  network.links = []
  network.nodes = []
}

network.loadData = function () {
  viewModel.ajaxPostCallback("/main/counterparty/getnetworkdiagramdata", filter.selectedFilters(), function (data) {
    network.processData(data)
  })
}

network.loadDetail = function (name, displayName) {
  viewModel.ajaxPostCallback("/main/counterparty/getdetailnetworkdiagramdata", {
    entityName: counterparty.activeEntityName(),
    counterpartyName: name
  }, function (data) {
    if (displayName) {
      counterparty.activeDisplayName(displayName)
    } else {
      counterparty.activeDisplayName(name)
    }
    
    counterparty.activeName(name)
    counterparty.detail(data)
    $('#modalDetail').modal('show')
  })
}

network.loadDetailCSV = function () {
  // Manual XHR based on stackoverflow jquery does not support responseType params
  var data = {
    entityName: counterparty.activeEntityName(),
    counterpartyName: counterparty.activeName()
  }
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/main/counterparty/getdetailnetworkdiagramcsv", true);
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      var blob = new Blob([xhr.response], {
        type: "octet/stream"
      });
      var fileName = "download.csv";
      saveAs(blob, fileName);
    }
  }
  xhr.responseType = "arraybuffer";
  xhr.send(JSON.stringify(data));
}

network.processData = function (data) {
  var rawLinks = []
  var parent = _.keys(data)[0]
  _.each(data[parent], function (e) {
    var link = {
      total: e.total,
      type: String(e.cpty_bank).substring(0, 3) == "SCB" && String(e.cust_bank).substring(0, 3) == "SCB" ? "flow" : "missed",
    }

    if (e.cust_role == "BUYER") {
      link.source = e.cpty_long_name
      link.source_bank = e.cpty_bank
      link.target = parent
      link.target_bank = e.cust_bank
    } else {
      link.target = e.cpty_long_name
      link.target_bank = e.cpty_bank
      link.source = parent
      link.source_bank = e.cust_bank
    }

    rawLinks.push(link)
  })

  rawLinks = rawLinks.concat(network.data)
  network.data = rawLinks

  var links = JSON.parse(JSON.stringify(rawLinks))

  //sort links by source, then target
  links.sort(function (a, b) {
    if (a.source > b.source) {
      return 1
    } else if (a.source < b.source) {
      return -1
    } else {
      if (a.target > b.target) {
        return 1
      }
      if (a.target < b.target) {
        return -1
      } else {
        return 0
      }
    }
  })

  var nodes = _(data[parent])
    .map(function (e) {
      return {
        name: e.cpty_long_name,
        coi: e.cpty_coi,
        groupName: e.cpty_group_name,
        amountText: kendo.toString(e.total / 1000000, "n2") + "M",
        opportunity: String(e.cpty_bank).substring(0, 3) != "SCB" ? true : false,
        class: e.is_ntb == "Y" ? "ntb" : "etb",
        role: e.cust_role,
        level: network.level,
      }
    })
    .concat({
      name: parent,
      coi: counterparty.activeEntityCOI(),
      groupName: counterparty.activeGroupName(),
      amountText: "",
      opportunity: false,
      class: "center",
      level: network.level
    })
    .uniqBy("name")
    .value()

  var prevNodes = _(network.nodes).remove(function (e) {
    return (_.findIndex(nodes, {
      name: e.name
    }) == -1)
  }).value()

  nodes = nodes.concat(prevNodes)

  links.forEach(function (link) {
    link.s = _.find(nodes, {
      name: link.source
    })
    link.t = _.find(nodes, {
      name: link.target
    })
  })

  nodes = _.map(nodes, function (n) {
    n.total = _.sumBy(links, function (l) {
      if (l.t.name == n.name || l.s.name == n.name) {
        return l.total
      } else {
        return 0
      }
    })

    return n
  })

  var minV = _.minBy(nodes, 'total').total
  var maxV = _.maxBy(nodes, 'total').total
  var minR = 15
  var maxR = 80

  nodes = _.map(nodes, function (n) {
    n.r = parseInt(minR + (n.total - minV) / (maxV - minV) * (maxR - minR))

    return n
  })

  network.level += 1
  network.nodes = nodes
  network.links = links

  network.generate()
}

network.generate = function () {
  var links = network.links
  var nodes = network.nodes

  var levelHeight = 300
  var w = $("#graph").width(),
    h = (network.level + 1) * levelHeight

  d3.select("#graph").selectAll("*").remove()

  var svg = d3.select("#graph").append("svg:svg")
    .attr("width", w)
    .attr("height", h)

  // Filter
  var defs = svg.append("defs");
  var filter = defs.append("filter")
    .attr("id", "dropshadow")
  filter.append("feGaussianBlur")
    .attr("in", "SourceAlpha")
    .attr("stdDeviation", 2)
    .attr("result", "blur");
  filter.append("feFlood")
    .attr("in", "offsetBlur")
    .attr("flood-opacity", "0.5")
    .attr("result", "offsetColor");
  filter.append("feOffset")
    .attr("in", "blur")
    .attr("dx", 0)
    .attr("dy", 0)
    .attr("result", "offsetBlur");

  var feMerge = filter.append("feMerge");
  feMerge.append("feMergeNode")
    .attr("in", "offsetBlur")
  feMerge.append("feMergeNode")
    .attr("in", "SourceGraphic");
  // End of filter

  // Force Simulation
  var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function (d) {
      return d.name;
    }).distance(300).strength(1))
    .force("charge", d3.forceManyBody())
    .force("x", d3.forceX(function (d) {
      if (d.role == "BUYER") {
        return w / 4 * 3
      } else if (d.role == "PAYEE") {
        return w / 4
      } else {
        return w / 2
      }
    }))
    .force("y", d3.forceY(function (d) {
      return levelHeight / 1.5 + (network.level - d.level - 1) * levelHeight
    }))
    .force("collision", d3.forceCollide().radius(function (d) {
      return 50;
    }))

  // Per-type markers, as they don't inherit styles.
  var marker = svg.append("svg:defs").selectAll("marker")
    .data(nodes)
    .enter()

  marker.append("svg:marker")
    .attr("id", function (d) {
      return "missed" + d.r
    })
    .attr("class", "missed")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", function (d) {
      return d.r + 10 + d.r * 0.1
    })
    .attr("refY", -0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5")

  var path = svg.append("svg:g")
    .selectAll("path")
    .data(links)
    .enter().append("svg:path")
    .attr("id", function (d, i) {
      return "linkId_" + i
    })
    .attr("class", function (d) {
      return "link " + d.type
    })
    .attr("marker-end", function (d) {
      return "url(#" + d.type + d.t.r + ")"
    })

  var pathText = svg.append("svg:g")
    .selectAll(".pathText")
    .data(links)
    .enter().append("svg:text")
    .attr("dx", 125)
    .attr("dy", -3)
    .append("textPath")
    .attr("xlink:href", function (d, i) {
      return "#linkId_" + i
    })
    .text(function (d) {
      return d.t.groupName == d.s.groupName ? "G" : ""
    })

  var prevNode = "#nodeDetail"
  var circle = svg.append("svg:g").selectAll("g")
    .data(nodes)
    .enter()
    .append("svg:g")
    .attr("class", function (d) {
      var c = "wrapper node " + d.class
      if (d.role == "BUYER") {
        c += " buyer"
      } else if (d.role == "PAYEE") {
        c += " supplier"
      }

      return c
    }).on("mouseover", function (d, i) {
      d3.select(prevNode).classed("hide", true)
      prevNode = "#nodeDetail" + i
      d3.select(prevNode).classed("hide", false)
    })

  circle.append("svg:circle")
    .on("click", expand)
    .attr("r", function (d) {
      return d.r
    })
    .attr("class", function (d) {
      return d.class
    })

  circle.append("svg:text")
    .text(function (d) {
      if (d.role == "BUYER") {
        return "□"
      } else if (d.role == "PAYEE") {
        return "+"
      } else {
        return ""
      }
    })
    .attr("class", "bs-indicator")
    .attr("x", function (d) {
      return d.r / 2 - 8
    })
    .attr("y", function (d) {
      return -d.r / 2 + 8
    })

  var text = svg.append("svg:g").selectAll("g")
    .data(nodes)
    .enter()
    .append("svg:g")
    .attr("class", function (d) {
      var c = "wrapper " + d.class
      if (d.role == "BUYER") {
        c += " buyer"
      } else if (d.role == "PAYEE") {
        c += " supplier"
      }

      return c
    })
    .append("svg:g")
    .attr("id", function (d, i) {
      return "nodeDetail" + i
    })
    .attr("class", "hide")

  // A copy of the text with a thick white stroke for legibility.
  // Name Text
  text.append("svg:text")
    .attr("class", "shadow")
    .text(function (d) {
      return d.name
    })
    .attr("x", function (d) {
      return d.r + 10
    })
    .attr("y", -5)

  text.append("svg:text")
    .text(function (d) {
      return d.name
    })
    .attr("x", function (d) {
      return d.r + 10
    })
    .attr("y", -5)

  // COI Text
  text.append("svg:text")
    .text(function (d) {
      return d.coi
    })
    .attr("x", function (d) {
      return d.r + 10
    })
    .attr("y", 6)
    .attr("class", "shadow")

  text.append("svg:text")
    .text(function (d) {
      return d.coi
    })
    .attr("x", function (d) {
      return d.r + 10
    })
    .attr("y", 6)
    .attr("class", "coi")

  // Amount Text
  text.append("svg:text")
    .text(function (d) {
      return d.amountText
    })
    .attr("x", function (d) {
      return d.r + 10
    })
    .attr("y", 17)
    .attr("class", "shadow")

  text.append("svg:text")
    .text(function (d) {
      return d.amountText
    })
    .attr("x", function (d) {
      return d.r + 10
    })
    .attr("y", 17)

  // Detail Link
  text.append("svg:text")
    .text(function (d) {
      return "show detail"
    })
    .on("click", detail)
    .attr("x", function (d) {
      return d.r + 10
    })
    .attr("y", 28)
    .attr("class", "shadow")

  text.append("svg:text")
    .text(function (d) {
      return "show detail"
    })
    .on("click", detail)
    .attr("x", function (d) {
      return d.r + 10
    })
    .attr("y", 28)
    .attr("class", "detail-button")

  simulation
    .nodes(nodes)
    .on("tick", ticked);

  simulation.force("link")
    .links(links);

  function ticked() {
    path.attr("d", function (d) {
      var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = d.type == "opportunity" ? 200 : 0
      return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y
    })

    circle.attr("transform", function (d) {
      return "translate(" + d.x + ", " + d.y + ")";
    })

    text.attr("transform", function (d) {
      return "translate(" + d.x + ", " + d.y + ")";
    })
  }

  function detail(d) {
    if (!d3.event.defaultPrevented) {
      if (d.class == "center") {
        var counterparties = []
        var connectedLinks = _.each(network.links, function(e) {
          if (e.s.name == d.name) {
            counterparties.push(e.t.name)
          } else if (e.t.name == d.name) {
            counterparties.push(e.s.name)
          }
        })

        network.loadDetail(counterparties.join("|"), d.name)
      } else {
        network.loadDetail(d.name)
      }
    }
  }

  function expand(d) {
    if (!d3.event.defaultPrevented) {
      if (d.class != "center") {
        network.isExpanding = true
        counterparty.activeEntityName(d.name)
        counterparty.activeGroupName(d.groupName)
      }
    }
  }

  function detach(d) {
    _.remove(network.nodes, function (e) {
      return e.name == d.name
    })

    _.remove(network.links, function (e) {
      return e.t.name == d.name || e.s.name == d.name
    })

    d3.selectAll(".node").filter(function (e) {
      return e.name == d.name
    }).remove()

    d3.selectAll(".link").filter(function (e) {
      return e.t.name == d.name || e.s.name == d.name
    }).remove()
  }

}

network.highlight = function (c) {
  d3.select("#graph").selectAll(".wrapper").classed("fade", true)
  d3.select("#graph").selectAll("g." + c).classed("fade", false)
}

network.unhighlight = function () {
  d3.select("#graph").selectAll(".wrapper").classed("fade", false)
}

$(window).load(function () {
  filter.loadAll()
  network.loadData()
})