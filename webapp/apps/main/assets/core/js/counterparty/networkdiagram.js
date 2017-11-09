var counterparty = {}
counterparty.detail = ko.observableArray([])
counterparty.activeEntityName = ko.observable()
counterparty.activeEntityCOI = ko.observable()
counterparty.activeName = ko.observable()
counterparty.activeGroupName = ko.observable("DOW CHEMICAL GROUP")
// Graph indicator R = Relationship, B = Buyer only (bubble), S = Supplier only (bubble)
counterparty.activeGraphIndicator = ko.observable("R")

counterparty.switchGraph = function (element, event) {
  var e = $(event.target)

  if (e.attr("name") != counterparty.activeGraphIndicator()) {
    counterparty.activeGraphIndicator(e.attr("name"))
  }
}

counterparty.loadAll = function () {
  counterparty.activeGraphIndicator.subscribe(function (nv) {
    if (nv == "R") {
      filter.role([{
        "value": "",
        "text": "Buyer & Supplier"
      }, {
        "value": "BUYER",
        "text": "Buyer"
      }, {
        "value": "PAYEE",
        "text": "Supplier"
      }])
      filter.selectedRole("")
    } else if (nv == "B") {
      filter.role([{
        "value": "BUYER",
        "text": "Buyer"
      }])

      if (filter.selectedRole() == "BUYER") {
        filter.selectedRole.valueHasMutated()
      } else {
        filter.selectedRole("BUYER")
      }
    } else if (nv == "S") {
      filter.role([{
        "value": "PAYEE",
        "text": "Supplier"
      }])

      if (filter.selectedRole() == "PAYEE") {
        filter.selectedRole.valueHasMutated()
      } else {
        filter.selectedRole("PAYEE")
      }
    } else {
      window.location.href = "/main/missedflow/index?entityName=" + counterparty.activeEntityName() + "&entityGroup=" + counterparty.activeGroupName() + "&entityCOI=" + counterparty.activeEntityCOI()
    }
  })

  // TODO: Enable this later
  counterparty.activeGroupName($.urlParam("entityGroup"))
  counterparty.activeEntityCOI($.urlParam("entityCOI"))
  counterparty.activeGraphIndicator($.urlParam("activeGraphIndicator") ? $.urlParam("activeGraphIndicator") : "R")
}

var filter = {}
filter.groupNames = ko.observableArray([])
filter.selectedGroupName = ko.observable("")
filter.entities = ko.observableArray([])
filter.selectedEntity = ko.observable("")

filter.role = ko.observableArray([{
  "value": "",
  "text": "Buyer & Supplier"
}, {
  "value": "BUYER",
  "text": "Buyer"
}, {
  "value": "PAYEE",
  "text": "Supplier"
}])
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
    filter.entities(_.map(data, "value"))
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
  counterparty.activeEntityName.subscribe(function (nv) {
    filter.selectedEntity(nv)
  })

  counterparty.activeGroupName.subscribe(function (nv) {
    filter.selectedGroupName(nv)
  })

  filter.selectedEntity.subscribe(function (nv) {
    if (nv != counterparty.activeEntityName()) {
      counterparty.activeGroupName(filter.selectedGroupName())
      counterparty.activeEntityName(nv)
    }
  })

  filter.selectedGroupName(counterparty.activeGroupName())
  filter.selectedEntity($.urlParam("entityName"))

  filter.selectedGroupName.subscribe(function (nv) {
    viewModel.globalFilter.groupname(nv)
    filter.loadEntities()
  })

  filter.loadGroupNames()

  filter.selectedFilters.subscribe(function () {
    if (!network.isExpanding) {
      network.clean()
    }

    network.isExpanding = false
    network.loadData()
  })
}

var network = {}
network.rawLinks = []
network.links = []
network.nodes = []
network.level = 0
network.isExpanding = false

network.clean = function () {
  network.rawLinks = []
  network.links = []
  network.nodes = []
}

network.loadData = function () {
  viewModel.ajaxPostCallback("/main/counterparty/getnetworkdiagramdata", filter.selectedFilters(), function (data) {
    network.processData(data)
  })
}

network.loadDetail = function (name) {
  var relations = []
  _.each(network.links, function (l) {
    if (l.t.name == name) {
      if (l.t.class == "center" && l.s.class == "center") {
        relations.push(l.t.level < l.s.level ? [l.t.name, l.s.name] : [l.s.name, l.t.name])
      } else if (l.t.class == "center") {
        relations.push([l.t.name, l.s.name])
      } else {
        relations.push([l.s.name, l.t.name])
      }
    } else if (l.s.name == name) {
      if (l.s.class == "center" && l.t.class == "center") {
        relations.push(l.t.level < l.s.level ? [l.t.name, l.s.name] : [l.s.name, l.t.name])
      } else if (l.s.class == "center") {
        relations.push([l.s.name, l.t.name])
      } else {
        relations.push([l.t.name, l.s.name])
      }
    }
  })

  viewModel.ajaxPostCallback("/main/counterparty/getdetailnetworkdiagramdata", {
    relations: relations
  }, function (data) {
    counterparty.activeName(name)
    counterparty.detail(data)
    $('#modalDetail').modal('show')
  })
}

network.loadDetailCSV = function () {
  var name = counterparty.activeName()
  var relations = []
  _.each(network.links, function (l) {
    if (l.t.name == name) {
      if (l.t.class == "center" && l.s.class == "center") {
        relations.push(l.t.level < l.s.level ? [l.t.name, l.s.name] : [l.s.name, l.t.name])
      } else if (l.t.class == "center") {
        relations.push([l.t.name, l.s.name])
      } else {
        relations.push([l.s.name, l.t.name])
      }
    } else if (l.s.name == name) {
      if (l.s.class == "center" && l.t.class == "center") {
        relations.push(l.t.level < l.s.level ? [l.t.name, l.s.name] : [l.s.name, l.t.name])
      } else if (l.s.class == "center") {
        relations.push([l.s.name, l.t.name])
      } else {
        relations.push([l.t.name, l.s.name])
      }
    }
  })

  // Manual XHR based on stackoverflow jquery does not support responseType params
  var data = {
    relations: relations
  }

  var xhr = new XMLHttpRequest()
  xhr.open("POST", "/main/counterparty/getdetailnetworkdiagramcsv", true)
  xhr.setRequestHeader("Content-type", "application/json")
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      var blob = new Blob([xhr.response], {
        type: "octet/stream"
      })
      var fileName = "download.csv"
      saveAs(blob, fileName)
    }
  }
  xhr.responseType = "arraybuffer"
  xhr.send(JSON.stringify(data))
}

network.processData = function (data) {
  var parent = _.keys(data)[0]
  // Group the node based on the counterparty node, so the multiple link will be merged into 1 link only
  var nodes = _(data[parent])
    .map(function (e) {
      var flow = e.cpty_bank == "SCBL" && e.cust_bank == "SCBL" ? true : false

      return {
        name: e.cpty_long_name,
        bank: e.cpty_bank,
        coi: e.cpty_coi,
        groupName: e.cpty_group_name,
        total: e.total,
        class: e.is_ntb == "Y" ? "ntb" : "etb",
        role: e.cust_role,
        isFlow: flow,
        isMissed: !flow,
        level: network.level
      }
    })
    .groupBy("name")
    .map(function (e) {
      var d = _.first(e)
      d.banks = _.map(e, "bank")
      d.total = _.sum(_.map(e, "total"))
      d.isFlow = _.sum(_.map(e, "isFlow")) >= 1
      d.isMissed = _.sum(_.map(e, "isMissed")) >= 1

      return d
    })
    .value()

  // Generate links based on merged nodes
  var rawLinks = []
  _.each(nodes, function (e) {
    var link = {
      total: e.total,
      isFlow: e.isFlow,
      isMissed: e.isMissed
    }

    if (e.role == "BUYER") {
      link.source = e.name
      link.target = parent
    } else {
      link.source = parent
      link.target = e.name
    }

    rawLinks.push(link)
  })

  // Remove duplicate parent node in current nodes
  _.remove(nodes, function (e) {
    return e.name == parent
  })

  // Get previous banks of the node that now become center
  var prevNodeThatNowBecomeCenter = _.find(network.nodes, {
    name: parent
  })
  var prevNodeThatNowBecomeCenterBanks = prevNodeThatNowBecomeCenter ? prevNodeThatNowBecomeCenter.banks : []

  // Adding the new center node (customer) also add the prev banks if exist
  nodes = _.concat(nodes, {
    name: parent,
    banks: _.uniq(_.map(data[parent], "cust_bank").concat(prevNodeThatNowBecomeCenterBanks)),
    coi: counterparty.activeEntityCOI(),
    groupName: counterparty.activeGroupName(),
    class: "center",
    level: network.level
  })

  // Get the previous nodes if exist and remove the duplicate nodes
  var prevNodes = _(network.nodes).filter(function (e) {
    return (_.findIndex(nodes, {
      name: e.name
    }) == -1)
  }).value()

  // Merge the new nodes to previous node
  nodes = nodes.concat(prevNodes)

  // Merge the rawLinks
  // RawLinks is used because the links that used by d3 is modified, so we need to keep the original version
  var links = rawLinks.concat(network.rawLinks)
  network.rawLinks = JSON.parse(JSON.stringify(links))

  // Sort links by source, then target
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

  // Linking the object of source and target based on name
  links = _.map(links, function (link) {
    link.s = _.find(nodes, {
      name: link.source
    })
    link.t = _.find(nodes, {
      name: link.target
    })

    return link
  })

  // calculate nodes total ampount based on the amount flow going and or going in
  nodes = _.map(nodes, function (n) {
    n.total = _.sumBy(links, function (l) {
      if (l.t.name == n.name || l.s.name == n.name) {
        return l.total
      } else {
        return 0
      }
    })
    n.amountText = !isNaN(n.total) ? setbm(n.total) : ""

    return n
  })

  // Define max and min of node radius and find the max and min of total amount of all nodes
  // used to calculate node radius
  var minV = _.minBy(nodes, 'total').total
  var maxV = _.maxBy(nodes, 'total').total
  maxV = maxV == minV ? maxV + 1 : maxV
  var minR = 20
  var maxR = 80

  // Calculate the radius for each nodes based on the total amount
  nodes = _.map(nodes, function (n) {
    n.r = parseInt(minR + (n.total - minV) / (maxV - minV) * (maxR - minR))

    return n
  })

  // Keep track of network levels
  network.level += 1
  network.nodes = nodes
  network.links = links

  // R for Relationship
  if (counterparty.activeGraphIndicator() == "R") {
    network.generate()
  } else {
    network.bubble.generate()
  }
}

network.generateLegend = function (parent) {
  var g = parent.append("svg:g")
  var texts = ["Anchor Entity", "ETB Node", "NTB Node"]
  var classes1 = ["center", "etb", "ntb"]

  var y = 15
  _.each(texts, function (t, i) {
    g.append("svg:circle")
      .attr("r", 8)
      .attr("cx", 30)
      .attr("cy", y)
      .attr("class", classes1[i])
      .on("mouseover", function () {
        network.highlight(classes1[i])
      })
      .on("mouseout", function () {
        network.unhighlight()
      })

    g.append("svg:text")
      .attr("x", 65)
      .attr("y", y + 4)
      .text(t)

    y += 30
  })

  texts = ["Supplier Node", "Buyer Node"]
  var classes2 = ["supplier", "buyer"]

  _.each(texts, function (t, i) {
    g.append("svg:circle")
      .attr("r", 10)
      .attr("cx", 15)
      .attr("cy", y)
      .attr("class", "legend-circle etb " + classes2[i])
      .on("mouseover", function () {
        network.highlight(classes2[i])
      })
      .on("mouseout", function () {
        network.unhighlight()
      })

    g.append("svg:circle")
      .attr("r", 10 - i)
      .attr("cx", 45)
      .attr("cy", y)
      .attr("class", "legend-circle ntb " + classes2[i])
      .on("mouseover", function () {
        network.highlight(classes2[i])
      })
      .on("mouseout", function () {
        network.unhighlight()
      })

    g.append("svg:text")
      .attr("x", 65)
      .attr("y", y + 4)
      .text(t)

    y += 30
  })

  texts = ["Missed Flow", "SCB Flow", "Intragroup Flow"]
  var indicators = ["M", "S", "I"]

  _.each(texts, function (t, i) {
    g.append("svg:line")
      .attr("x1", 5)
      .attr("x2", 55)
      .attr("y1", y)
      .attr("y2", y)
      .attr("class", "link missed")

    g.append("svg:circle")
      .attr("r", 10)
      .attr("cx", 30)
      .attr("cy", y)
      .attr("class", "missed")

    g.append("svg:text")
      .attr("x", 30)
      .attr("y", y + 4)
      .attr("text-anchor", "middle")
      .text(indicators[i])

    g.append("svg:text")
      .attr("x", 65)
      .attr("y", y + 4)
      .text(t)

    y += 30
  })

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

  network.generateLegend(svg)

  // Filter
  var defs = svg.append("defs")
  var filter = defs.append("filter")
    .attr("id", "dropshadow")
  filter.append("feGaussianBlur")
    .attr("in", "SourceAlpha")
    .attr("stdDeviation", 2)
    .attr("result", "blur")
  filter.append("feFlood")
    .attr("in", "offsetBlur")
    .attr("flood-opacity", "0.5")
    .attr("result", "offsetColor")
  filter.append("feOffset")
    .attr("in", "blur")
    .attr("dx", 0)
    .attr("dy", 0)
    .attr("result", "offsetBlur")

  var feMerge = filter.append("feMerge")
  feMerge.append("feMergeNode")
    .attr("in", "offsetBlur")
  feMerge.append("feMergeNode")
    .attr("in", "SourceGraphic")
  // End of filter

  // Force Simulation
  var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function (d) {
      return d.name
    }).distance(300).strength(0.5))
    .force("charge", d3.forceManyBody())
    .force("x", d3.forceX(function (d) {
      if (d.role == "BUYER") {
        return w / 4 * 3
      } else if (d.role == "PAYEE") {
        return w / 4
      } else {
        return w / 2
      }
    }).strength(0.1))
    .force("y", d3.forceY(function (d) {
      return levelHeight + (network.level - d.level - 1) * levelHeight
    }).strength(0.1))
    .force("collision", d3.forceCollide().radius(function (d) {
      return d.r + 10
    }))

  simulation
    .nodes(nodes)
    .on("tick", ticked)

  simulation.force("link")
    .links(links)

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

  var pathBg = svg.append("svg:g")
    .selectAll("path")
    .data(links)
    .enter().append("svg:path")
    .attr("class", "link bg")

  var path = svg.append("svg:g")
    .selectAll("path")
    .data(links)
    .enter().append("svg:path")
    .attr("id", function (d, i) {
      return "linkId_" + i
    })
    .attr("class", "link missed")
    .attr("marker-end", function (d) {
      return "url(#missed" + d.t.r + ")"
    })

  // For Missed flow (non-SCB) indicator
  var pathCircle1 = svg.append("svg:g")
    .selectAll("path")
    .data(links)
    .enter().append("svg:circle")
    .attr("r", 10)
    .attr("class", function (d) {
      return d.isMissed ? "missed" : "hide"
    })

  // For SCB to SCB indicator
  var pathCircle2 = svg.append("svg:g")
    .selectAll("path")
    .data(links)
    .enter().append("svg:circle")
    .attr("r", 10)
    .attr("class", function (d) {
      return d.isFlow ? "missed" : "hide"
    })

  // For Intragroup transaction indicator
  var pathCircle3 = svg.append("svg:g")
    .selectAll("path")
    .data(links)
    .enter().append("svg:circle")
    .attr("r", 10)
    .attr("class", function (d) {
      return d.t.groupName == d.s.groupName ? "missed" : "hide"
    })

  // For Missed flow (non-SCB) indicator
  var pathText1 = svg.append("svg:g")
    .selectAll(".pathText")
    .data(links)
    .enter().append("svg:text")
    .attr("class", "pathText")
    .attr("dy", 3)

  pathText1.append("textPath")
    .attr("xlink:href", function (d, i) {
      return "#linkId_" + i
    })
    .style("text-anchor", "middle")
    .attr("startOffset", "40%")
    .text(function (d) {
      return d.isMissed ? "M" : ""
    })

  // For SCB to SCB indicator
  var pathText2 = svg.append("svg:g")
    .selectAll(".pathText")
    .data(links)
    .enter().append("svg:text")
    .attr("class", "pathText")
    .attr("dy", 3)

  pathText2.append("textPath")
    .attr("xlink:href", function (d, i) {
      return "#linkId_" + i
    })
    .style("text-anchor", "middle")
    .attr("startOffset", "50%")
    .text(function (d) {
      return d.isFlow ? "S" : ""
    })

  // For Intragroup transaction indicator
  var pathText3 = svg.append("svg:g")
    .selectAll(".pathText")
    .data(links)
    .enter().append("svg:text")
    .attr("class", "pathText")
    .attr("dy", 3)

  pathText3.append("textPath")
    .attr("xlink:href", function (d, i) {
      return "#linkId_" + i
    })
    .style("text-anchor", "middle")
    .attr("startOffset", "60%")
    .text(function (d) {
      return d.t.groupName == d.s.groupName ? "I" : ""
    })

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
    })
    .each(function (d) {
      network.tooltip(this, d)
    })
    .on("mouseover", function (d) {
      highlightLink(d.name)
    })
    .on("mouseout", unhighlightLink)

  circle.append("svg:circle")
    .on("click", expand)
    .attr("r", function (d) {
      return d.role == "BUYER" ? d.r - 3 : d.r
    })
    .attr("class", function (d) {
      var c = d.class
      c += d.role == "BUYER" ? " buyer" : ""
      return c
    })

  circle.append("svg:text")
    .attr("y", "-1em")
    .tspans(function (d) {
      var matches = d.name.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/)
      if (matches) {
        return [d.name.substring(0, 4) + "..."]
      }

      if (d.r <= 40) {
        matches = d.name.match(/\b(\w)/g)
        if (matches) {
          return [matches.join("")]
        }
      }

      return d3.wordwrap(d.name, d.name.length / 2);
    })
    .attr("text-anchor", "middle")
    .attr("x", 0)
    .attr("dy", "1.2em")

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

  // Detail Texts
  text.each(function (d) {
    var g = d3.select(this)
    var texts = [d.name, d.coi, d.amountText, d.banks.join(", ")]
    var classes = ["", "coi", "", ""]

    var start = -5
    _.each(texts, function (text, i) {
      // A copy of the text with a thick white stroke for legibility.
      g.append("svg:text")
        .attr("class", "shadow")
        .text(text)
        .attr("x", function (d) {
          return d.r + 10
        })
        .attr("y", start)

      g.append("svg:text")
        .attr("class", classes[i])
        .text(text)
        .attr("x", function (d) {
          return d.r + 10
        })
        .attr("y", start)

      start += 12
    })
  })

  function ticked() {
    path.attr("d", function (d) {
      var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = 0
      return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y
    })

    pathBg.attr("d", function (d) {
      var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = 0
      return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y
    })

    pathCircle1.attr("transform", function (d) {
      return "translate(" + (d.source.x - (d.source.x - d.target.x) / 2 * 0.8) + ", " + (d.source.y - (d.source.y - d.target.y) / 2 * 0.8) + ")"
    })

    pathCircle2.attr("transform", function (d) {
      return "translate(" + (d.source.x - (d.source.x - d.target.x) / 2) + ", " + (d.source.y - (d.source.y - d.target.y) / 2) + ")"
    })

    pathCircle3.attr("transform", function (d) {
      return "translate(" + (d.source.x - (d.source.x - d.target.x) / 2 * 1.2) + ", " + (d.source.y - (d.source.y - d.target.y) / 2 * 1.2) + ")"
    })

    circle.attr("transform", function (d) {
      return "translate(" + d.x + ", " + d.y + ")"
    })

    text.attr("transform", function (d) {
      return "translate(" + d.x + ", " + d.y + ")"
    })

    d3.selectAll(".pathText").attr("transform", function (d) {
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

  function highlightLink(n) {
    pathBg.each(function (d) {
      var link = d3.select(this)
      if (d.s.name == n || d.t.name == n) {
        link.classed("selected", true)
      }
    })
  }

  function unhighlightLink() {
    d3.selectAll(".link.selected").classed("selected", false)
  }

  function expand(d) {
    if (!d3.event.defaultPrevented) {
      if (d.class != "center") {
        network.isExpanding = true
        counterparty.activeEntityName(d.name)
        counterparty.activeGroupName(d.groupName)
        counterparty.activeEntityCOI(d.coi)
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

network.bubble = {}
network.bubble.force = d3.forceSimulation()

network.bubble.generate = function () {
  var w = $("#graph").width(),
    h = 600

  d3.select("#graph").selectAll("*").remove()

  var nodes = network.nodes
  // Readjust the node raidus for Bubble Diagram
  var min = 25
  var max = 100
  nodes = _.map(nodes, function (d) {
    if (d.class == "center") {
      d.fx = w / 2
      d.fy = h / 2
    }

    d.r = min + (d.r - 20) / (80 - 20) * (max - min)

    return d
  })

  var svg = d3.select("#graph").append("svg:svg")
    .attr("width", w)
    .attr("height", h)

  network.generateLegend(svg)

  var simulation = network.bubble.force
    .force("charge", d3.forceManyBody())
    .force("x", d3.forceX(w / 2))
    .force("y", d3.forceY(h / 2))
    .force("collision", d3.forceCollide().radius(function (d) {
      return d.r + 5
    }))
    .nodes(nodes)
    .on("tick", ticked)
    .alpha(1).restart();

  var bubbles = svg.append("svg:g").selectAll("g")
    .data(nodes)
    .enter()
    .append("svg:g")
    .attr("class", function (d) {
      var c = "wrapper node bubble " + d.class
      if (d.role == "BUYER") {
        c += " buyer"
      } else if (d.role == "PAYEE") {
        c += " supplier"
      }

      return c
    })
    .each(function (d) {
      network.tooltip(this, d)
    })
    .on("mouseover", function (d) {
      d3.select(this)
        .select(".inner-bubble")
        .transition()
        .ease(d3.easeElastic)
        .duration(1000)
        .attr("r", function (d) {
          return (d.role == "BUYER" ? d.r - 5 : d.r) * 1.1 + 10
        })

      d3.select(this)
        .selectAll(".outer-bubble")
        .transition()
        .ease(d3.easeElastic)
        .duration(1000)
        .attr("r", function (d) {
          return d.r * 1.1 + 10
        })
    })
    .on("mouseout", function (d) {
      d3.select(this)
        .select(".inner-bubble")
        .transition()
        .ease(d3.easeElastic)
        .duration(1000)
        .attr("r", function (d) {
          return d.role == "BUYER" ? d.r - 5 : d.r
        })

      d3.select(this)
        .select(".outer-bubble")
        .transition()
        .ease(d3.easeElastic)
        .duration(1000)
        .attr("r", function (d) {
          return d.r
        })
    })

  bubbles.append("svg:circle")
    .attr("r", function (d) {
      return d.role == "BUYER" ? d.r - 5 : d.r
    })
    .attr("class", function (d) {
      var c = "inner-bubble " + d.class
      c += d.role == "BUYER" ? " buyer" : ""
      return c
    })

  bubbles.append("svg:circle")
    .attr("r", function (d) {
      return d.r
    })
    .attr("class", "outer-bubble")

  bubbles.append("svg:text")
    .attr("y", "-1em")
    .tspans(function (d) {
      var matches = d.name.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/)
      if (matches) {
        return [d.name.substring(0, 4) + "..."]
      }

      if (d.r <= 40) {
        matches = d.name.match(/\b(\w)/g)
        if (matches) {
          return [matches.join("")]
        }
      }

      return d3.wordwrap(d.name, d.name.length / 2);
    })
    .attr("text-anchor", "middle")
    .attr("x", 0)
    .attr("dy", "1.2em")

  function ticked() {
    bubbles.attr("transform", function (d) {
      return "translate(" + d.x + ", " + d.y + ")"
    })
  }
}

network.tooltip = function (elem, d) {
  $(elem).popover({
      placement: "top",
      container: "body",
      trigger: "manual",
      html: true,
      content: `
      <table class="tooltip-table">
        <tr>
          <td><b>Name</b></td>
          <td>` + d.name + `</td>
        </tr>
        <tr>
          <td><b>COI</b></td>
          <td>` + d.coi + `</td>
        </tr>
        <tr>
          <td><b>Total Flow</b></td>
          <td>` + d.amountText + `</td>
        </tr>
        <tr>
          <td><b>Bank</b></td>
          <td>` + d.banks.join(", ") + `</td>
        </tr>
        <tr>
          <td></td>
          <td><a onclick="network.loadDetail('` + d.name + `')">Show Detail</a></td>
        </tr>
      </tabl>
    `
    })
    .on("mouseenter", function () {
      var _this = this
      $(this).popover("show")
      $(".popover").on("mouseleave", function () {
        $(_this).popover('hide')
      })
    }).on("mouseleave", function () {
      var _this = this
      setTimeout(function () {
        if (!$(".popover:hover").length) {
          $(_this).popover("hide")
        }
      }, 300)
    })
}

network.highlight = function (c) {
  console.log(c)
  d3.select("#graph").selectAll(".wrapper").classed("fade", true)
  d3.select("#graph").selectAll(".wrapper." + c).classed("fade", false)
}

network.unhighlight = function () {
  d3.select("#graph").selectAll(".wrapper").classed("fade", false)
}

// Printing
counterparty.beforePDFPrinting = function (style) {
  var def = $.Deferred();

  var svg = $("#graph svg")[0];

  var styleElement = document.createElement("style")
  styleElement.innerHTML = style
  styleElement.innerHTML += ".wrapper>.hide{display: block !important;}"

  // inject style
  $(svg).prepend(styleElement);

  var sheight = $("#graph svg").attr("height")

  var rect = svg.getBoundingClientRect();
  var img = document.createElement("img");
  var canvas = document.createElement('canvas');
  canvas.width = 1386 * 2;
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
    ctx.fillRect(0, 0, 1386 * 2, sheight * 2);
    ctx.drawImage(imgCanvas, 0, 0, 1386 * 2, sheight * 2);

    var base64Image = canvas.toDataURL("image/jpeg", 0.75);

    img.src = base64Image;
    img.style = "position:absolute;top:" + rect.top + "px;left:" + rect.left + "px;";
    img.className = "remove-after-print";
    img.width = 1386;
    img.height = sheight;
    svg.parentNode.insertBefore(img, svg);

    def.resolve(true)
  }

  imgCanvas.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
  return def
}

counterparty.afterPDFPrinting = function () {
  $(".remove-after-print").remove();
  $("svg > style").remove();
}

counterparty.getPDF = function (selector) {
  $.ajax({
    url: "/main/static/core/css/counterparty/networkdiagram.css",
    success: function (data) {
      buildAndSave(data)
    },
    dataType: 'html'
  })

  function buildAndSave(style) {
    $.when(
      counterparty.beforePDFPrinting(style)
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
            fileName: "ExportND.pdf"
          });
        })
        .done(function () {
          counterparty.afterPDFPrinting();
        })
    })
  }
}

$(window).load(function () {
  counterparty.loadAll()
  filter.loadAll()
  network.loadData()
})