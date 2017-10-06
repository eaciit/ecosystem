var dashboard = {}
dashboard.activeEntities = ko.observable({})
dashboard.activeEntity = ko.observable({})

dashboard.region = [{
  "value": "ASA",
  "text": "ASA"
}, {
  "value": "AME",
  "text": "AME"
}, {
  "value": "GCNA",
  "text": "GCNA"
}]

dashboard.country = [{
  "value": "CN",
  "text": "CHINA"
}, {
  "value": "BT",
  "text": "BHUTAN"
}, {
  "value": "BY",
  "text": "BELARUS"
}]

dashboard.businessmatric = [{
  "value": "CIB",
  "text": "CIB"
}, {
  "value": "TBD",
  "text": "TBD"
}, {
  "value": "NETWORK",
  "text": "NETWORK"
}]

dashboard.payment = [{
  "value": "CASH",
  "text": "Cash"
}, {
  "value": "INSTALLMENT",
  "text": "Installment"
}]

dashboard.getMapData = function (callback) {
  viewModel.ajaxPostCallback("/main/dashboard/getmapdata", {}, function (data) {
    $.getJSON("/main/static/core/js/countries.json", function (countries) {
      var result = _(data)
        .groupBy('country')
        .map(function (items, e) {
          var c = _.find(countries, {
            "country_code": e
          })
          var entities = _.map(items, 'entity')

          return {
            country: e,
            location: c.latlng,
            name: c.name,
            entities: entities,
            value: entities.length
          }
        })
        .value()

      callback(result)
    })
  })
}

dashboard.generateMap = function () {
  var activeShape
  var highlightedMapAlpha = 0.8
  var circledMapAlpha = 0.5
  var template = kendo.template($("#tooltip-template").html())
  var popup = $("<div class='bubble-tooltip'>Foo</div>")
    .appendTo(document.body)
    .kendoPopup()
    .data("kendoPopup")

  dashboard.getMapData(function (data) {
    $("#map").kendoMap({
      controls: {
        navigator: false
      },
      center: [18.062312304546726, 108.28125],
      zoom: 3,
      layers: [{
        type: "shape",
        dataSource: {
          data: mapTemplate.features,
        },
        style: {
          fill: {
            opacity: 0.5
          }
        }
      }, {
        type: "bubble",
        dataSource: data,
        style: {
          fill: {
            color: "#19B5FE",
            opacity: circledMapAlpha
          },
          stroke: {
            width: 0
          }
        }
      }],
      shapeMouseEnter: onShapeMouseEnter,
      shapeMouseLeave: onShapeMouseLeave
    })

    $("#map").unbind("mousewheel")
    $("#map").unbind("DOMMouseScroll")
  })

  function onShapeMouseEnter(e) {
    e.shape.options.fill.set("opacity", highlightedMapAlpha)
    activeShape = e.shape
    activeShape.options.set("stroke", {
      width: 1,
      color: "#fff"
    })
    $("#map").css("cursor", "pointer")

    if (e.shape.dataItem === undefined) {
      return
    }

    dashboard.activeEntities(e.shape.dataItem)
    var data = e.shape.dataItem

    var oe = e.originalEvent
    var x = oe.pageX || oe.clientX
    var y = oe.pageY || oe.clientY

    popup.element.html(template(data))
    popup.open(x, y)
  }

  function onShapeMouseLeave(e) {
    e.shape.options.set("fill.opacity", circledMapAlpha)
    e.shape.options.set("stroke", {
      width: 0,
      color: "#fff"
    })

    $("#map").css("cursor", "inherit")

    if (!$(e.originalEvent.relatedTarget).is(".k-popup, .k-animation-container")) {
      popup.close()
      popup.element.kendoStop(true, true)
    }
  }

  dashboard.showMapDetails = function (i) {
    dashboard.getEntityDetail(dashboard.activeEntities().entities[i])

    popup.close()
    popup.element.kendoStop(true, true)
  }
}

dashboard.getEntityDetail = function (entityName) {
  viewModel.ajaxPostCallback("/main/dashboard/getentitydetail", {
    entityName: entityName
  }, function (data) {
    var bank = _(data.bank)
      .groupBy("product_type")
      .map(function (items) {
        return _.groupBy(items, "flow")
      }).value()

    var product = _(data.product)
      .groupBy("product_type")
      .value()

    dashboard.activeEntity({
      bank: bank,
      product: product
    })
    
    $("#mapDetailModal").modal("show")
  })
}

dashboard.btnTrade = function () {
  $("#groupbuttondetail").hide()
  $("#tradetabs").show()
}

var widget = {}

widget.etb = ko.observable(0)
widget.buyer = ko.observable(0)
widget.seller = ko.observable(0)
widget.inFlow = ko.observable(0)
widget.outFlow = ko.observable(0)
widget.pipeline = ko.observable(4.01)

widget.etbYearChange = ko.observable(0)
widget.buyerYearChange = ko.observable(0)
widget.sellerYearChange = ko.observable(0)
widget.inFlowYearChange = ko.observable(0)
widget.outFlowYearChange = ko.observable(0)
widget.pipelineYearChange = ko.observable(1.54)

widget.buildChart = function (id, data, unit) {
  var chartParam = {
    dataSource: {
      data: data
    },
    title: {
      text: ""
    },
    chartArea: {
      background: ""
    },
    tooltip: {
      visible: true,
      template: "#= moment(category, 'YYYYMM').format('MMM YY') # : #= value #"
    },
    legend: {
      visible: false
    },
    seriesColors: ["#1e88e5"],
    series: [{
      field: "value",
      type: "line",
      style: "smooth",
      markers: {
        visible: false
      }
    }],
    categoryAxis: {
      field: "category",
      visible: false,
      majorGridLines: {
        visible: false
      }
    },
    valueAxis: {
      visible: false,
      majorGridLines: {
        visible: false
      }
    }
  }

  if (unit) {
    chartParam.tooltip.template = "#= moment(category, 'YYYYMM').format('MMM YY') # : #= kendo.toString(value, 'n2')#B"
  }

  $(id).kendoChart(chartParam)
}

widget.generateChart1 = function () {
  var param = {
    fromYearMonth: 201509,
    toYearMonth: 201609
  }
  viewModel.ajaxPostCallback("/main/dashboard/getchartetb", param, function (data) {
    widget.buildChart("#widgetChart1", data)
  })
}

widget.generateChart2 = function () {
  var param = {
    fromYearMonth: 201509,
    toYearMonth: 201609
  }
  viewModel.ajaxPostCallback("/main/dashboard/getchartbuyer", param, function (data) {
    widget.buildChart("#widgetChart2", data)
  })
}

widget.generateChart3 = function () {
  var param = {
    fromYearMonth: 201509,
    toYearMonth: 201609
  }
  viewModel.ajaxPostCallback("/main/dashboard/getchartseller", param, function (data) {
    widget.buildChart("#widgetChart3", data)
  })
}

widget.generateChart4 = function () {
  var param = {
    fromYearMonth: 201509,
    toYearMonth: 201609
  }
  viewModel.ajaxPostCallback("/main/dashboard/getchartinflow", param, function (data) {
    data = _.map(data, function (e) {
      e.value = e.value / 1000000000

      return e
    })

    widget.buildChart("#widgetChart4", data, "B")
  })
}

widget.generateChart5 = function () {
  var param = {
    fromYearMonth: 201509,
    toYearMonth: 201609
  }
  viewModel.ajaxPostCallback("/main/dashboard/getchartoutflow", param, function (data) {
    data = _.map(data, function (e) {
      e.value = e.value / 1000000000

      return e
    })

    widget.buildChart("#widgetChart5", data, "B")
  })
}

widget.generateChart6 = function () {
  var data = [6, 1, 10, 1, 10]
  widget.buildChart("#widgetChart6", data)
}

widget.generateCharts = function () {
  widget.generateChart1()
  widget.generateChart2()
  widget.generateChart3()
  widget.generateChart4()
  widget.generateChart5()
  widget.generateChart6()
}

widget.loadData = function () {
  // Loading current data
  viewModel.ajaxPostCallback("/main/dashboard/getetb", {}, function (data) {
    widget.etb(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getbuyer", {}, function (data) {
    widget.buyer(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getseller", {}, function (data) {
    widget.seller(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getinflow", {}, function (data) {
    widget.inFlow(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getoutflow", {}, function (data) {
    widget.outFlow(data)
  })

  // Loading annualy change data
  viewModel.ajaxPostCallback("/main/dashboard/getyearchangeetb", {}, function (data) {
    widget.etbYearChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getyearchangebuyer", {}, function (data) {
    widget.buyerYearChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getyearchangeseller", {}, function (data) {
    widget.sellerYearChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getyearchangeinflow", {}, function (data) {
    widget.inFlowYearChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getyearchangeoutflow", {}, function (data) {
    widget.outFlowYearChange(data)
  })
}

$(window).load(function () {
  widget.loadData()
  widget.generateCharts()
  dashboard.generateMap()
})