var counterparty = {}
counterparty.detail = ko.observableArray([])
counterparty.activeEnityName = ko.observable()
counterparty.activeName = ko.observable()

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
    entityName: counterparty.activeEnityName(),
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
  viewModel.ajaxPostCallback("/main/master/getentities", {}, function (data) {
    filter.entities(_.map(data, "value"))
    filter.selectedEntity.valueHasMutated()
  })
}

filter.loadAll = function () {
  $("#month").data('kendoDatePicker').enable(false)

  filter.selectedEntity.subscribe(function (nv) {
    counterparty.activeEnityName(nv)
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
network.nodes = {}
network.isExpanding = false

network.clean = function () {
  network.data = []
  network.links = []
  network.nodes = {}
}

network.loadData = function () {
  viewModel.ajaxPostCallback("/main/counterparty/getnetworkdiagramdata", filter.selectedFilters(), function (data) {
    network.processData(data)
  })
}

network.loadDetail = function (name) {
  viewModel.ajaxPostCallback("/main/counterparty/getdetailnetworkdiagramdata", {
    entityName: counterparty.activeEnityName(),
    counterpartyName: name
  }, function (data) {
    counterparty.activeName(name)
    counterparty.detail(data)
    $('#modalDetail').modal('show')
  })
}

network.loadDetailCSV = function () {
  console.log("warsawa")
  // Manual XHR based on stackoverflow jquery does not support responseType params
  var data = {
    entityName: counterparty.activeEnityName(),
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
      type: e.cpty_bank != "SCBL" && e.cust_bank != "SCBL" ? "missed" : "flow",
      text: kendo.toString(e.total / 1000000, "n2") + "M",
    }

    if (e.cust_role == "PAYEE") {
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

  if (network.nodes[parent]) {
    delete network.nodes[parent]
  }

  _.keys(network.nodes).forEach(function (key) {
    if (network.nodes[key].class != "center") {
      network.nodes[key].isFade = true
    }
  });

  var nodes = _(data[parent])
    .map(function (e) {
      if (network.nodes[e.cpty_long_name]) {
        delete network.nodes[e.cpty_long_name]
      }

      return {
        name: e.cpty_long_name,
        coi: e.cpty_coi,
        opportunity: e.cpty_bank != "SCBL" ? true : false,
        class: e.is_ntb == "Y" ? "ntb" : "etb",
        role: e.cust_role,
        isFade: false
      }
    })
    .concat({
      name: parent,
      coi: "",
      opportunity: false,
      class: "center",
      isFade: false
    })
    .uniqBy("name")
    .keyBy("name")
    .value()

  nodes = _.merge(nodes, network.nodes)

  links.forEach(function (link) {
    link.source = nodes[link.source]
    link.target = nodes[link.target]
  })

  network.nodes = nodes
  network.links = links

  network.generate()
}

network.generate = function () {
  var links = network.links
  var nodes = network.nodes

  var w = $("#graph").width(),
    h = 600

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

  var force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links(links)
    .size([w, h])
    .linkDistance(200)
    .charge(-1000)
    .on("tick", tick)
    .start()

  // Per-type markers, as they don't inherit styles.
  svg.append("svg:defs").selectAll("marker")
    .data(["flow", "missed"])
    .enter().append("svg:marker")
    .attr("id", String)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 25)
    .attr("refY", -0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5")

  svg.append("svg:defs").selectAll("marker")
    .data(["flow-big", "missed-big"])
    .enter().append("svg:marker")
    .attr("id", String)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 32)
    .attr("refY", -0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5")

  var path = svg.append("svg:g").selectAll("path")
    .data(force.links())
    .enter().append("svg:path")
    .attr("id", function (d, i) {
      return "linkId_" + i
    })
    .attr("class", function (d) {
      var c = "link " + d.type
      c += (d.target.isFade || d.source.isFade) ? " fade" : ""
      return c
    })
    .attr("marker-end", function (d) {
      var type = d.type
      type += d.target.class == "center" ? "-big" : ""
      return "url(#" + type + ")"
    })

  var pathText = svg.selectAll(".pathText")
    .data(force.links())
    .enter().append("svg:text")
    .attr("dx", 85)
    .attr("dy", -3)
    .attr("class", function (d) {
      return (d.target.isFade || d.source.isFade) ? " fade" : ""
    })
    .append("textPath")
    .attr("xlink:href", function (d, i) {
      return "#linkId_" + i
    })
    .text(function (d) {
      return d.text
    })

  var rb = 20,
    r = 15

  var circle = svg.append("svg:g").selectAll("g")
    .data(force.nodes())
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
    .call(force.drag)

  circle.append("svg:circle")
    .on("click", expand)
    .attr("r", function (d) {
      return d.class == "center" ? rb : r;
    })
    .attr("class", function (d) {
      var c = d.class
      c += d.isFade ? " fade" : ""
      return c
    })
    .attr("filter", function (d) {
      return d.opportunity && !d.isFade ? "url(#dropshadow)" : ""
    })

  circle.append("svg:circle")
    .on("click", expand)
    .attr("r", function (d) {
      return d.class == "center" ? rb - 1 : r - 1;
    })
    .attr("class", function (d) {
      var c = d.role == "BUYER" ? "buyer" : "hide"
      c += d.isFade ? " fade" : ""
      return c
    })

  circle.append("svg:circle")
    .on("click", expand)
    .attr("r", function (d) {
      return d.class == "center" ? rb - 12 : r - 12;
    })
    .attr("class", function (d) {
      var c = d.role == "PAYEE" ? "supplier" : "hide"
      c += d.isFade ? " fade" : ""
      return c
    })

  var text = svg.append("svg:g").selectAll("g")
    .data(force.nodes())
    .enter().append("svg:g")
    .attr("class", function (d) {
      return d.isFade ? "fade" : ""
    })

  // A copy of the text with a thick white stroke for legibility.
  text.append("svg:text")
    .attr("class", "shadow")
    .tspans(function (d) {
      var comp = d.name.split(" ")
      var top = comp.splice(0, comp.length / 2)
      var bottom = comp.splice(comp.length / 2, comp.length)

      return [top.join(" "), bottom.join(" ")]
    })
    .each(function (d, i) {
      if (i == 1) {
        d3.select(this).attr("dy", 10)
      }
    })
    .attr("x", 25)
    .attr("y", -5)

  text.append("svg:text")
    .tspans(function (d) {
      var comp = d.name.split(" ")
      var top = comp.splice(0, comp.length / 2)
      var bottom = comp.splice(comp.length / 2, comp.length)

      return [top.join(" "), bottom.join(" ")]
    })
    .each(function (d, i) {
      if (i == 1) {
        d3.select(this).attr("dy", 10)
      }
    })
    .attr("x", 25)
    .attr("y", -5)

  text.append("svg:text")
    .text(function (d) {
      return d.coi
    })
    .attr("x", 25)
    .attr("y", 17)
    .attr("class", "shadow")

  text.append("svg:text")
    .text(function (d) {
      return d.coi
    })
    .attr("x", 25)
    .attr("y", 17)
    .attr("class", "coi")

  text.append("svg:text")
    .text(function (d) {
      return "detail"
    })
    .on("click", detail)
    .attr("x", 25)
    .attr("y", 28)
    .attr("class", function (d) {
      return d.opportunity ? "shadow" : "hide"
    })

  text.append("svg:text")
    .text(function (d) {
      return "detail"
    })
    .on("click", detail)
    .attr("x", 25)
    .attr("y", 28)
    .attr("class", function (d) {
      return d.opportunity ? "detail-button" : "hide"
    })

  // Use elliptical arc path segments to doubly-encode directionality.
  function tick() {
    path.attr("d", function (d) {
      var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = d.type == "opportunity" ? 200 : 0
      return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y
    })

    circle.attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")"
    })

    text.attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")"
    })
  }

  function detail(d) {
    if (!d3.event.defaultPrevented) {
      network.loadDetail(d.name)
    }
  }

  function expand(d) {
    if (!d3.event.defaultPrevented) {
      if (d.class != "center") {
        network.isExpanding = true
        counterparty.activeEnityName(d.name)
      }
    }
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