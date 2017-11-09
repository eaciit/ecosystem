var dashboard = {}
dashboard.activeEntities = ko.observable({})
dashboard.activeEntity = ko.observable({})
dashboard.inflow = ko.observable(true)
dashboard.outflow = ko.observable(true)
dashboard.other = ko.observable(true)
dashboard.labelimport = ko.observable()
dashboard.labelexport = ko.observable()
dashboard.activeEntityDetail = {
  noteHeaderModal: ko.observable(),
  dataProductMix: ko.observableArray([]),
  dataProductMixA: ko.observableArray([]),
  dataProductMixB: ko.observableArray([]),
  dataProductMixC: ko.observableArray([]),
  dataInFlow: ko.observableArray([]),
  dataOutFlow: ko.observableArray([]),
  sumInFlow: ko.observable(),
  sumOutFlow: ko.observable(),
}

var filter = {}
filter.groups = ko.observableArray([])
filter.selectedGroup = ko.observable("")
filter.selectedYear = ko.observable(new Date())

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


filter.payload = ko.computed(function () {
  viewModel.globalFilter.groupname(filter.selectedGroup())

  return {
    fromYearMonth: parseInt(moment().subtract(1, "years").format("YYYYMM")),
    toYearMonth: parseInt(moment().format("YYYYMM")),
    year: moment(filter.selectedYear()).format("YYYY"),
    groupName: filter.selectedGroup()
  }
})

filter.payloadQuarter = function () {
  return {
    fromYearMonth: parseInt(moment().subtract(3, "months").format("YYYYMM")),
    toYearMonth: parseInt(moment().format("YYYYMM")),
    year: moment(filter.selectedYear()).format("YYYY"),
    groupName: filter.selectedGroup()
  }
}

filter.loadGroups = function () {
  viewModel.ajaxPostCallback("/main/master/getgroups", {}, function (data) {
    filter.groups(_.map(data, "value"))
    filter.selectedGroup.valueHasMutated()
  })
}

filter.loadAll = function () {
  filter.payload.subscribe(function (nv) {
    if (nv.groupName != "") {
      widget.loadData()
      dashboard.loadDataIntoMap()
    }
  })

  filter.loadGroups()
}

dashboard.getMapData = function (callback) {
  viewModel.ajaxPostCallback("/main/dashboard/getmapdata", filter.payload(), function (data) {
    $.getJSON("/main/static/core/js/countries.json", function (countries) {
      var maxVal = 0
      var minVal = 1000

      var result = _(data)
        .groupBy('country')
        .map(function (items, e) {
          var c = _.find(countries, {
            "country_code": e
          })
          var entities = _.map(items, 'entity')

          maxVal = entities.length > maxVal ? entities.length : maxVal
          minVal = entities.length < minVal ? entities.length : minVal

          return {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: c.latlng.reverse(),
            },
            properties: {
              country: e,
              name: c.name,
              entities: entities,
              value: entities.length
            }
          }
        })
        .map(function (e) {
          maxVal = minVal == maxVal ? minVal + 1 : maxVal
          e.properties.radius = (e.properties.value - minVal) / (maxVal - minVal) * (1000000 - 300000) + 300000

          return e
        })
        .value()

      callback({
        type: "FeatureCollection",
        features: result
      })
    })
  })
}

var activeShape

dashboard.generateMapbox = function () {
  var map = undefined
  var circles = undefined
  var texts = undefined

  function generate() {
    L.mapbox.accessToken = 'pk.eyJ1IjoiYmFndXNjYWh5b25vIiwiYSI6ImNqOWpqbzBjYjByNXEzM2xnZ2ppcDBpN2EifQ.pFc9EQsAK5vd4ZWgCcAPJg'
    map = L.mapbox.map('map', 'mapbox.light')
      .setView([1.3, 103.8], 3)

    circles = L.geoJson(null, {
      pointToLayer: function (feature, ll) {
        return L.circle(ll, feature.properties.radius, {
          color: "white",
          weight: 0,
          fillColor: "#428bca",
          fillOpacity: 0.5
        })
      }
    }).addTo(map)

    texts = L.geoJson(null, {
      pointToLayer: function (feature, ll) {
        return L.marker(ll, {
          icon: L.divIcon({
            className: 'label',
            html: feature.properties.country,
            iconSize: [30, 12]
          })
        })
      }
    }).addTo(map)
  }

  dashboard.loadDataIntoMap = function () {
    dashboard.getMapData(function (data) {
      circles.clearLayers()
      texts.clearLayers()

      circles.addData(data)
      texts.addData(data)

      circles.eachLayer(function (layer) {
        var prop = layer.feature.properties
        var template = kendo.template($("#tooltip-template").html())

        layer.bindPopup(template(prop))

        layer.on("mouseover", function (e) {
          dashboard.activeEntities(prop)
          this.openPopup()
        })
      })
    })
  }

  generate()
}

var ifload = 0
dashboard.country = ko.observable("")
dashboard.name = ko.observable("")
var varactiveentity = []
dashboard.showMapDetails = function (i) {
  ifload = 0
  dashboard.activeEntityDetail.noteHeaderModal("")
  $("#groupbuttondetail").show()
  $("#tradetabs").hide()
  dashboard.country(dashboard.activeEntities().name)
  dashboard.name(dashboard.activeEntities().entities[i])
  $("#mapDetailModal").modal("show")
  popup.close()
  popup.element.kendoStop(true, true)
}

dashboard.getEntityDetail = function (entityName, changetradeorcash) {
  viewModel.ajaxPostCallback("/main/dashboard/getentitydetail", {
    entityName: entityName
  }, function (data) {
    var bank = _(data.bank)
      .groupBy("product_category")
      .mapValues(function (items) {
        return _.groupBy(items, "flow")
      }).value()
    dashboard.activeEntity([])
    dashboard.activeEntity({
      name: entityName,
      bank: bank,
      product: data.product,
      country: dashboard.activeEntities().name
    })
    varactiveentity = []
    varactiveentity.push(dashboard.activeEntity())
    if (changetradeorcash == "CASH") {
      dashboard.btnTrade(dashboard.activeEntity())
      dashboard.btnCash(dashboard.activeEntity())
      $(".tab-content").show()
    } else {
      dashboard.btnCash(dashboard.activeEntity())
      dashboard.btnTrade(dashboard.activeEntity())
      $(".tab-content").show()
    }

  })
}

dashboard.bm = function (databm, sts) {
  if (databm < 1000000000) {
    var databmr = databm / 1000000
    databmr = currencynum(databmr)
    databmr = databmr + " M"
    return databmr
  } else if (databm >= 1000000000) {
    var databmr = databm / 1000000000
    databmr = currencynum(databmr)
    databmr = databmr + " B"
    return databmr
  }
}

dashboard.btnCash = function () {
  if (ifload == 0) {
    ifload = 1
    dashboard.getEntityDetail(dashboard.name(), "CASH")
    $(".tab-content").hide()
  }
  if (varactiveentity.length > 0) {
    dashboard.activeEntityDetail.noteHeaderModal(" Cash")
    dashboard.activeEntityDetail.dataInFlow([])
    dashboard.activeEntityDetail.dataOutFlow([])
    dashboard.activeEntityDetail.sumInFlow(0)
    dashboard.activeEntityDetail.sumOutFlow(0)
    dashboard.other(false)
    var cashinward = []
    cashinward = dashboard.activeEntity().product.Cash.inward;
    var cashoutward = []
    cashoutward = dashboard.activeEntity().product.Cash.outward;

    var keyMap = {
      product: 'product2',
      value: 'value2'
    };

    var cashoutward_val = cashoutward.map(function (obj) {
      return _.mapKeys(obj, function (value, key) {
        return keyMap[key];
      });
    });
    var inwardoutward = _.merge(cashinward, cashoutward_val)

    dashboard.activeEntityDetail.dataProductMixA(inwardoutward)
    dashboard.activeEntityDetail.dataProductMixC("")
    dashboard.labelimport("Inward")
    dashboard.labelexport("Outward")
    // for flow
    if (dashboard.activeEntity().bank.Cash != undefined) {
      var datainflow = dashboard.activeEntity().bank.Cash.PAYEE
      var dataoutflow = dashboard.activeEntity().bank.Cash.BUYER
    }
    var suminflow = _.sumBy(datainflow, 'value')
    var sumoutflow = _.sumBy(dataoutflow, 'value')
    var colorval = ["#000000", "#0070c0", "#60d5a8", "#8faadc"]
    if (suminflow == 0) {
      dashboard.inflow(false)
    } else {
      dashboard.inflow(true)
    }
    if (sumoutflow == 0) {
      dashboard.outflow(false)
    } else {
      dashboard.outflow(true)
    }

    if (datainflow != undefined) {
      var maxthreein = _.sortBy(datainflow, 'value').reverse().splice(0, 3);
      var summaxthreein = _.sumBy(maxthreein, 'value')
      tempdatain = [];

      _.each(maxthreein, function (v, i) {
        tempdatain.push({
          text: v.bank,
          value: Math.round((v.value / suminflow) * 100),
          color: colorval[i],
          tooltip: dashboard.bm(v.value, "")
        });
      });
      var sumtin = _.sumBy(tempdatain, 'value')
      if (datainflow.length > 3) {
        tempdatain.push({
          text: "Other",
          value: (100 - sumtin),
          color: colorval[3],
          tooltip: dashboard.bm(suminflow - summaxthreein, "")
        });
      }

      dashboard.activeEntityDetail.dataInFlow(tempdatain)
      var suminflowr = dashboard.bm(suminflow, "inflow")
      dashboard.activeEntityDetail.sumInFlow(suminflowr)
    }

    if (dataoutflow != undefined) {
      var maxthreeout = _.sortBy(dataoutflow, 'value').reverse().splice(0, 3);
      var summaxthreeout = _.sumBy(maxthreeout, 'value')
      tempdataout = [];
      _.each(maxthreeout, function (v, i) {
        tempdataout.push({
          text: v.bank,
          value: Math.round((v.value / sumoutflow) * 100),
          color: colorval[i],
          tooltip: dashboard.bm(v.value, "")
        });
      });
      var sumtout = _.sumBy(tempdataout, 'value')
      if (dataoutflow.length > 3) {
        tempdataout.push({
          text: "Other",
          value: (100 - sumtout),
          color: colorval[3],
          tooltip: dashboard.bm(sumoutflow - summaxthreeout, "")
        });
      }
      dashboard.activeEntityDetail.dataOutFlow(tempdataout)
      var sumoutflowr = dashboard.bm(sumoutflow, "outflow")
      dashboard.activeEntityDetail.sumOutFlow(sumoutflowr)
    }
    $("#groupbuttondetail").hide()
    $("#tradetabs").show()
    $(".some").kendoTooltip({
      animation: false,
      width: 180,
      position: "top"
    })
  }

}

dashboard.btnTrade = function () {
  if (ifload == 0) {
    ifload = 1
    dashboard.getEntityDetail(dashboard.name(), "TRADE")
    $(".tab-content").hide()
  }
  if (varactiveentity.length > 0) {
    dashboard.activeEntityDetail.noteHeaderModal(" Trade")
    dashboard.activeEntityDetail.dataProductMix([])
    dashboard.activeEntityDetail.dataInFlow([])
    dashboard.activeEntityDetail.dataOutFlow([])
    dashboard.activeEntityDetail.sumInFlow(0)
    dashboard.activeEntityDetail.sumOutFlow(0)
    dashboard.other(true)
    // for trade  

    var tradeexport = []
    tradeexport = dashboard.activeEntity().product.Trade.export;
    var tradeimport = []
    tradeimport = dashboard.activeEntity().product.Trade.import;
    var tradeother = []
    tradeother = dashboard.activeEntity().product.Trade.other;

    var keyMap = {
      product: 'product2',
      value: 'value2'
    };

    var tradeimport_val = tradeimport.map(function (obj) {
      return _.mapKeys(obj, function (value, key) {
        return keyMap[key];
      });
    });
    var exportimport = _.merge(tradeexport, tradeimport_val)

    dashboard.activeEntityDetail.dataProductMixA(exportimport)
    dashboard.activeEntityDetail.dataProductMixC(tradeother)
    dashboard.labelimport("Export")
    dashboard.labelexport("Import")

    var data = dashboard.activeEntity().product.Trade
    var maxthree = _.sortBy(data, 'value').reverse().splice(0, 3);
    dashboard.activeEntityDetail.dataProductMix(maxthree)
    // for flow
    if (dashboard.activeEntity().bank.Trade != undefined) {
      var datainflow = dashboard.activeEntity().bank.Trade.PAYEE
      var dataoutflow = dashboard.activeEntity().bank.Trade.BUYER
    }
    var suminflow = _.sumBy(datainflow, 'value')
    var sumoutflow = _.sumBy(dataoutflow, 'value')
    var colorval = ["#000000", "#0070c0", "#60d5a8", "#8faadc"]
    if (suminflow == 0) {
      dashboard.inflow(false)
    } else {
      dashboard.inflow(true)
    }
    if (sumoutflow == 0) {
      dashboard.outflow(false)
    } else {
      dashboard.outflow(true)
    }

    if (datainflow != undefined) {
      var maxthreein = _.sortBy(datainflow, 'value').reverse().splice(0, 3);
      var summaxthreein = _.sumBy(maxthreein, 'value')
      tempdatain = [];
      _.each(maxthreein, function (v, i) {
        tempdatain.push({
          text: v.bank,
          value: Math.round((v.value / suminflow) * 100),
          color: colorval[i],
          tooltip: dashboard.bm(v.value, "")
        });
      });
      var sumtin = _.sumBy(tempdatain, 'value')
      if (datainflow.length > 3) {
        tempdatain.push({
          text: "Other",
          value: (100 - sumtin),
          color: colorval[3],
          tooltip: dashboard.bm(suminflow - summaxthreein, "")
        });
      }
      dashboard.activeEntityDetail.dataInFlow(tempdatain)
      var suminflowr = dashboard.bm(suminflow, "inflow")
      dashboard.activeEntityDetail.sumInFlow(suminflowr)
    }

    if (dataoutflow != undefined) {
      var maxthreeout = _.sortBy(dataoutflow, 'value').reverse().splice(0, 3);
      var summaxthreeout = _.sumBy(maxthreeout, 'value')
      tempdataout = [];
      _.each(maxthreeout, function (v, i) {
        tempdataout.push({
          text: v.bank,
          value: Math.round((v.value / sumoutflow) * 100),
          color: colorval[i],
          tooltip: dashboard.bm(v.value, "")
        });
      });
      var sumtout = _.sumBy(tempdataout, 'value')
      if (dataoutflow.length > 3) {
        tempdataout.push({
          text: "Other",
          value: (100 - sumtout),
          color: colorval[3],
          tooltip: dashboard.bm(sumoutflow - summaxthreeout, "")
        });
      }
      dashboard.activeEntityDetail.dataOutFlow(tempdataout)
      var sumoutflowr = dashboard.bm(sumoutflow, "outflow")
      dashboard.activeEntityDetail.sumOutFlow(sumoutflowr)
    }
    $("#groupbuttondetail").hide()
    $("#tradetabs").show()
    $(".some").kendoTooltip({
      animation: false,
      width: 180,
      position: "top"
    });
  }
}

dashboard.btnBack = function () {
  dashboard.activeEntityDetail.noteHeaderModal("")
  $("#groupbuttondetail").show()
  $("#tradetabs").hide()
}

var widget = {}

widget.etb = ko.observable(0)
widget.buyer = ko.observable(0)
widget.seller = ko.observable(0)
widget.inFlow = ko.observable(0)
widget.outFlow = ko.observable(0)
widget.pipeline = ko.observable(0)

widget.etbQuarterChange = ko.observable(0)
widget.buyerQuarterChange = ko.observable(0)
widget.sellerQuarterChange = ko.observable(0)
widget.inFlowQuarterChange = ko.observable(0)
widget.outFlowQuarterChange = ko.observable(0)
widget.pipelineQuarterChange = ko.observable(0)

widget.etbYearChange = ko.observable(0)
widget.buyerYearChange = ko.observable(0)
widget.sellerYearChange = ko.observable(0)
widget.inFlowYearChange = ko.observable(0)
widget.outFlowYearChange = ko.observable(0)
widget.pipelineYearChange = ko.observable(0)

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
  viewModel.ajaxPostCallback("/main/dashboard/getchartetb", filter.payload(), function (data) {
    widget.buildChart("#widgetChart1", data)
  })
}

widget.generateChart2 = function () {
  viewModel.ajaxPostCallback("/main/dashboard/getchartbuyer", filter.payload(), function (data) {
    widget.buildChart("#widgetChart2", data)
  })
}

widget.generateChart3 = function () {
  viewModel.ajaxPostCallback("/main/dashboard/getchartseller", filter.payload(), function (data) {
    widget.buildChart("#widgetChart3", data)
  })
}

widget.generateChart4 = function () {
  viewModel.ajaxPostCallback("/main/dashboard/getchartinflow", filter.payload(), function (data) {
    data = _.map(data, function (e) {
      e.value = e.value / 1000000000

      return e
    })

    widget.buildChart("#widgetChart4", data, "B")
  })
}

widget.generateChart5 = function () {
  viewModel.ajaxPostCallback("/main/dashboard/getchartoutflow", filter.payload(), function (data) {
    data = _.map(data, function (e) {
      e.value = e.value / 1000000000

      return e
    })

    widget.buildChart("#widgetChart5", data, "B")
  })
}


widget.generateChart6 = function () {
  var data = []
  widget.buildChart("#widgetChart6", data)
}

widget.loadCharts = function () {
  widget.generateChart1()
  widget.generateChart2()
  widget.generateChart3()
  widget.generateChart4()
  widget.generateChart5()
  widget.generateChart6()
}

widget.loadData = function () {
  // Loading current data
  viewModel.ajaxPostCallback("/main/dashboard/getetb", filter.payload(), function (data) {
    widget.etb(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getbuyer", filter.payload(), function (data) {
    widget.buyer(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getseller", filter.payload(), function (data) {
    widget.seller(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getinflow", filter.payload(), function (data) {
    widget.inFlow(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getoutflow", filter.payload(), function (data) {
    widget.outFlow(data)
  })

  // Loading quarter change data
  viewModel.ajaxPostCallback("/main/dashboard/getperiodchangeetb", filter.payloadQuarter(), function (data) {
    widget.etbQuarterChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getperiodchangebuyer", filter.payloadQuarter(), function (data) {
    widget.buyerQuarterChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getperiodchangeseller", filter.payloadQuarter(), function (data) {
    widget.sellerQuarterChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getperiodchangeinflow", filter.payloadQuarter(), function (data) {
    widget.inFlowQuarterChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getperiodchangeoutflow", filter.payloadQuarter(), function (data) {
    widget.outFlowQuarterChange(data)
  })

  // Loading annualy change data
  viewModel.ajaxPostCallback("/main/dashboard/getperiodchangeetb", filter.payload(), function (data) {
    widget.etbYearChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getperiodchangebuyer", filter.payload(), function (data) {
    widget.buyerYearChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getperiodchangeseller", filter.payload(), function (data) {
    widget.sellerYearChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getperiodchangeinflow", filter.payload(), function (data) {
    widget.inFlowYearChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getperiodchangeoutflow", filter.payload(), function (data) {
    widget.outFlowYearChange(data)
  })

  // Loading charts
  widget.loadCharts()
}

$(window).load(function () {
  filter.loadAll()
  dashboard.generateMapbox()
})