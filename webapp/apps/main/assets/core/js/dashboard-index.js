var dashboard = {}
dashboard.entities = ko.observableArray([])
dashboard.activeEntity = ko.observable()
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

dashboard.mapsdata1 = [{
    _id: 1,
    location: [-7.274879, 111.6099528],
    name: "Jakarta, Indonesia",
    entities: "MEGLOBAL INTERNATIONAL FZE"
  },
  {
    _id: 2,
    location: [1.3440852, 103.6839573],
    name: "Singapore, Singapore",
    entities: "MEGLOBAL INTERNATIONAL FZE"
  }
]
dashboard.mapsdata2 = [{
    _id: 21,
    location: [13.7245601, 100.4930264],
    name: "Bangkok, Thailand",
    entities: "MEGLOBAL INTERNATIONAL FZE"
  },
  {
    _id: 22,
    location: [25.0171608, 121.3662942],
    name: "Taipei, Taiwan",
    entities: "MEGLOBAL INTERNATIONAL FZE"
  }
]
dashboard.mapsdata3 = [{
    _id: 31,
    location: [35.006095, 135.7259306],
    name: "Kyoto, Japan",
    entities: "MEGLOBAL INTERNATIONAL FZE"
  },
  {
    _id: 32,
    location: [37.5650172, 126.8494673],
    name: "Seol, South Korea",
    entities: "MEGLOBAL INTERNATIONAL FZE"
  }
]

var widget = {}

widget.ETB = ko.observable(0)
widget.Buyer = ko.observable(0)
widget.Seller = ko.observable(0)
widget.InFlow = ko.observable(0)
widget.OutFlow = ko.observable(0)
widget.Pipeline = ko.observable(4.01)

widget.ETBYearChange = ko.observable(0)
widget.BuyerYearChange = ko.observable(0)
widget.SellerYearChange = ko.observable(0)
widget.InFlowYearChange = ko.observable(0)
widget.OutFlowYearChange = ko.observable(0)
widget.PipelineYearChange = ko.observable(1.54)

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
    widget.ETB(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getbuyer", {}, function (data) {
    widget.Buyer(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getseller", {}, function (data) {
    widget.Seller(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getinflow", {}, function (data) {
    widget.InFlow(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getoutflow", {}, function (data) {
    widget.OutFlow(data)
  })

  // Loading annualy change data
  viewModel.ajaxPostCallback("/main/dashboard/getyearchangeetb", {}, function (data) {
    widget.ETBYearChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getyearchangebuyer", {}, function (data) {
    widget.BuyerYearChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getyearchangeseller", {}, function (data) {
    widget.SellerYearChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getyearchangeinflow", {}, function (data) {
    widget.InFlowYearChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getyearchangeoutflow", {}, function (data) {
    widget.OutFlowYearChange(data)
  })
}

dashboard.generateMap = function () {
  var template = mapTemplate

  $("#map").kendoMap({
    controls: {
      navigator: false
    },
    center: [18.062312304546726, 108.28125],
    zoom: 3,
    layers: [{
      type: "shape",
      dataSource: {
        data: template.features,
      },
      style: {
        fill: {
          opacity: 0.5
        }
      }
    }, {
      type: "marker",
      dataSource: dashboard.mapsdata1,
      shape: "pinRed",
      locationField: "location",
      titleField: "name"
    }, {
      type: "marker",
      dataSource: dashboard.mapsdata2,
      shape: "pinBlue",
      locationField: "location",
      titleField: "name"
    }, {
      type: "marker",
      dataSource: dashboard.mapsdata3,
      shape: "pinGreen",
      locationField: "location",
      titleField: "name"
    }],
    markerClick: onClickMarker
  });

  $("#map").unbind("mousewheel")
  $("#map").unbind("DOMMouseScroll")

  function onClickMarker(e) {
    dashboard.showMapDetails()
    dashboard.activeEntity(e.marker.dataItem.entities)
    $("#mapDetailModal").modal("show")
  }
}

dashboard.btnTrade = function () {
  $("#groupbuttondetail").hide()
  $("#tradetabs").show()
}

dashboard.showMapDetails = function () {

}

$(window).load(function () {
  widget.loadData()
  widget.generateCharts()
  dashboard.generateMap()
})