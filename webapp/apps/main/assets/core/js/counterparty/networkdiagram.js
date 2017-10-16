var counterparty = {}
counterparty.detail = ko.observableArray([])
counterparty.activeEnityName = ko.observable()
counterparty.activeName = ko.observable()
counterparty.networkData = ko.observableArray([])

filter.entities = [{
  "value": "ASA",
  "text": "ASA"
}, {
  "value": "AME",
  "text": "AME"
}]
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
filter.group = [{
  "value": "ETB",
  "text": "ETB"
}, {
  "value": "NTB",
  "text": "NTB"
}]
filter.limit = [{
  "value": 5,
  "text": "Top 5"
}, {
  "value": 10,
  "text": "Top 10"
}]
filter.flows = [{
  "value": 30000000,
  "text": "Flows > $30M"
}, {
  "value": 100000000,
  "text": "Flows > $100M"
}]

counterparty.eventclick = function () {
  $('#month').data('kendoDatePicker').enable(false)

  $('#radioBtn a').on('click', function () {
    var sel = $(this).data('title')
    var tog = $(this).data('toggle')
    $('#' + tog).prop('value', sel)
    if (sel == "M") {
      $('#year').data('kendoDatePicker').enable(false)
      $('#month').data('kendoDatePicker').enable(true)
    } else if (sel == "Y") {
      $('#year').data('kendoDatePicker').enable(true)
      $('#month').data('kendoDatePicker').enable(false)
    }

    $('a[data-toggle="' + tog + '"]').not('[data-title="' + sel + '"]').removeClass('active').addClass('notActive')
    $('a[data-toggle="' + tog + '"][data-title="' + sel + '"]').removeClass('notActive').addClass('active')
  })
}

counterparty.loadNetwork = function () {
  viewModel.ajaxPostCallback("/main/counterparty/getnetworkdiagramdata", {
    entityName: counterparty.activeEnityName(),
    limit: 5
  }, function (data) {
    counterparty.generateNetwork(data)
  })
}

counterparty.loadDetail = function (name) {
  viewModel.ajaxPostCallback("/main/counterparty/getdetailnetworkdiagramdata", {
    entityName: counterparty.activeEnityName(),
    counterpartyName: name
  }, function (data) {
    counterparty.activeName(name)
    counterparty.detail(data)
    $('#modalDetail').modal('show')
  })
}

counterparty.generateNetwork = function (data) {
  var rawLinks = []
  var parent = _.keys(data)[0]
  for (var i = 0; i < data[parent].length; i++) {
    var e = data[parent][i];
    if (e.cust_role == "PAYEE") {
      rawLinks.push({
        source: e.cpty_long_name,
        source_bank: e.cpty_bank,
        target: parent,
        target_bank: e.cust_bank,
        total: e.total,
        type: "flow",
        text: kendo.toString(e.total / 1000000, "n2") + "M",
        extra: e.cpty_bank != "SCBL" ? "opportunity" : ""
      })
    } else {
      rawLinks.push({
        target: e.cpty_long_name,
        target_bank: e.cpty_bank,
        source: parent,
        source_bank: e.cust_bank,
        total: e.total,
        type: "flow",
        text: kendo.toString(e.total / 1000000, "n2") + "M",
        extra: e.cpty_bank != "SCBL" ? "opportunity" : ""
      })
    }

    console.log(rawLinks)
  }

  rawLinks = rawLinks.concat(counterparty.networkData())
  counterparty.networkData(rawLinks)

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

  var nodes = {}
  // Compute the distinct nodes from the links.
  links.forEach(function (link) {
    link.source = nodes[link.source] || (nodes[link.source] = {
      name: link.source
    })
    link.target = nodes[link.target] || (nodes[link.target] = {
      name: link.target
    })
  })

  var w = $("#graph").width(),
    h = 600

  d3.select("#graph").selectAll("*").remove()

  var svg = d3.select("#graph").append("svg:svg")
    .attr("width", w)
    .attr("height", h)

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

  var path = svg.append("svg:g").selectAll("path")
    .data(force.links())
    .enter().append("svg:path")
    .attr("id", function (d, i) {
      return "linkId_" + i
    })
    .attr("class", function (d) {
      return "link " + d.type
    })
    .attr("marker-end", function (d) {
      return "url(#" + d.type + ")"
    })

  var pathText = svg.selectAll(".pathText")
    .data(force.links())
    .enter().append("svg:text")
    .attr("dx", 85)
    .attr("dy", -3)
    .attr("class", function (d, i) {
      return d.type
    })
    .append("textPath")
    .attr("xlink:href", function (d, i) {
      return "#linkId_" + i
    })
    .text(function (d, i) {
      return d.text
    })

  var circle = svg.append("svg:g").selectAll("g")
    .data(force.nodes())
    .enter().append("svg:g")
    .call(force.drag)

  circle.append("svg:circle")
    .attr("r", 17)
    .attr("class", "pulse")

  circle.append("svg:circle")
    .on("click", expand)
    .attr("r", 15)

  var text = svg.append("svg:g").selectAll("g")
    .data(force.nodes())
    .enter().append("svg:g")

  // A copy of the text with a thick white stroke for legibility.
  text.append("svg:text")
    .text(function (d) {
      return d.name
    })
    .attr("x", 20)
    .attr("y", -5)
    .attr("class", "shadow")

  text.append("svg:text")
    .text(function (d) {
      return d.name
    })
    .attr("x", 20)
    .attr("y", -5)

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
      counterparty.loadDetail(d.name)
    }
  }

  function expand(d) {
    if (!d3.event.defaultPrevented) {
      counterparty.activeEnityName(d.name)
      counterparty.loadNetwork()
    }
  }

}

$(window).load(function () {
  counterparty.activeEnityName($.urlParam("entityName"))
  counterparty.loadNetwork()
  counterparty.eventclick()
})