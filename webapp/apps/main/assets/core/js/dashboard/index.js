var dashboard = {}
dashboard.activeEntities = ko.observable({})
dashboard.activeEntity = ko.observable({})
dashboard.inflow = ko.observable(true)
dashboard.outflow = ko.observable(true)
dashboard.other = ko.observable(true)
dashboard.labelimport = ko.observable()
dashboard.labelexport = ko.observable()
dashboard.noinflow = ko.observable()
dashboard.nooutflow = ko.observable()
dashboard.tablenoinflowoutflow = ko.observable(true)
dashboard.labeltableno = ko.observable()
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
filter.groupNames = ko.observableArray([])
filter.selectedGroupName = ko.observable("")

filter.entities = ko.observableArray(["All"])
filter.selectedEntity = ko.observable("All")

filter.role = ko.observableArray([{
  "value": "",
  "text": "In & Out"
}, {
  "value": "BUYER",
  "text": "Out"
}, {
  "value": "PAYEE",
  "text": "In"
}])
filter.selectedRole = ko.observable("")

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
  "text": "All Product"
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
  "text": "All Flows"
}, {
  "value": 30000000,
  "text": "Flows > $30M"
}, {
  "value": 100000000,
  "text": "Flows > $100M"
}]
filter.selectedFlow = ko.observable(0)

filter.selectedDateType = ko.observable("Y")
filter.selectedDate = ko.observable(moment().subtract(1, "years").toDate())

// Filter booking country
filter.bookingCountry = {}
filter.bookingCountry.selecteds = ko.observableArray([])

filter.bookingCountry.selectedRegions = ko.pureComputed({
  read: function () {
    var selecteds = filter.bookingCountry.selecteds()
    var selectedRegions = []
    _.each(filter.bookingCountry.data(), function (region) {
      var countryInSelecteds = _.filter(region.countries, function (e) {
        return selecteds.indexOf(e) != -1
      })

      if (countryInSelecteds.length == region.countries.length) {
        selectedRegions.push(region.id)
      }
    })

    return selectedRegions
  },
  owner: filter.bookingCountry
})

filter.bookingCountry.selectedAll = ko.pureComputed({
  read: function () {
    var allCountries = _.uniq(_.flatten(_.map(filter.bookingCountry.data(), "countries")))
    return allCountries.length == filter.bookingCountry.selecteds().length;
  },
  write: function (value) {
    var selecteds = []

    if (value) {
      selecteds = _.uniq(_.flatten(_.map(filter.bookingCountry.data(), "countries")))
    }

    filter.bookingCountry.selecteds(selecteds)
  },
  owner: filter.bookingCountry
})

filter.bookingCountry.data = ko.observableArray(viewModel.bookingCountries)

filter.bookingCountry.displaySelected = ko.pureComputed(function () {
  if (filter.bookingCountry.selecteds().length == 0) {
    return "Region/Country"
  }

  var allCountries = _.uniq(_.flatten(_.map(filter.bookingCountry.data(), "countries")))
  if (allCountries.length == filter.bookingCountry.selecteds().length) {
    return "All"
  }

  return filter.bookingCountry.selecteds().length > 1 ? "Multiple" : filter.bookingCountry.selecteds()[0]
})

filter.bookingCountry.regionClick = function (data, event) {
  var selecteds = filter.bookingCountry.selecteds()
  if (event.target.checked) {
    selecteds = _.uniq(selecteds.concat(data.countries))
  } else {
    selecteds = _.filter(selecteds, function (e) {
      return _.indexOf(data.countries, e) == -1
    })
  }

  filter.bookingCountry.selecteds(selecteds)

  return true
}

filter.bookingCountry.regionIsIndeterminate = function (regionId) {
  return ko.computed(function () {
    var data = _.filter(filter.bookingCountry.data(), {
      id: regionId
    })[0]

    var countryInSelecteds = _.filter(filter.bookingCountry.selecteds(), function (e) {
      return data.countries.indexOf(e) != -1
    })

    return countryInSelecteds.length < data.countries.length && countryInSelecteds.length > 0
  })
}

filter.bookingCountry.allIsIndeterminate = function () {
  return ko.computed(function () {
    var data = _.uniq(_.flatten(_.map(filter.bookingCountry.data(), "countries")))

    return filter.bookingCountry.selecteds().length < data.length && filter.bookingCountry.selecteds().length > 0
  })
}

filter.bookingCountry.expand = function (data, event) {
  var list = $("#bookingCountryDropdown #" + data.id)
  list.css("display", list.css("display") == "none" ? "block" : "none")
}

filter.bookingCountry.toggle = function () {
  var target = $("#bookingCountryDropdown")
  var oriHeight = 212

  if (target.css("visibility") != "visible") {
    target.height(0)
    target.css("visibility", "visible")
    target.animate({
      height: oriHeight
    }, 200)
  } else {
    target.animate({
      height: 0
    }, 200, function () {
      target.css("visibility", "hidden")
      target.height(oriHeight)
    })
  }
}

filter.bookingCountry.initListener = function () {
  $(document).click(function (e) {
    var target = $("#bookingCountryDropdown")
    var oriHeight = 212

    if ($(e.target).parents('.filter-group.multiselect').length === 0 && target.css("visibility") == "visible") {
      target.animate({
        height: 0
      }, 200, function () {
        target.css("visibility", "hidden")
        target.height(oriHeight)
      })
    }
  })
}

// End of Filter booking country

filter.switchDateType = function (data, event) {
  $(event.target).siblings().removeClass("active")
  $(event.target).addClass("active")

  filter.selectedDateType($(event.target).text())

  if (filter.selectedDateType() == "M") {
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
  var yearMonth = 0
  var fromYearMonth = 0
  var toYearMonth = 0
  var dateType = ""
  var d = moment(filter.selectedDate())

  if (filter.selectedDateType() == "Y") {
    dateType = "YEAR"

    if (d.isValid()) {
      yearMonth = parseInt(d.format("YYYY"))
      // Subtract 1 year
      fromYearMonth = (yearMonth - 1) * 100 + 12
      toYearMonth = yearMonth * 100 + 12
    }
  } else {
    dateType = "MONTH"

    if (d.isValid()) {
      yearMonth = parseInt(d.format("YYYYMM"))
      // 100 = 1 Year
      fromYearMonth = (yearMonth - 100)
      toYearMonth = yearMonth
    }
  }

  return {
    fromYearMonth: fromYearMonth,
    toYearMonth: toYearMonth,
    groupName: filter.selectedGroupName(),
    entityName: filter.selectedEntity(),
    role: filter.selectedRole(),
    group: filter.selectedGroup(),
    productCategory: filter.selectedProductCategory(),
    limit: parseInt(filter.selectedLimit()),
    flowAbove: parseInt(filter.selectedFlow()),
    bookingCountries: filter.bookingCountry.selecteds(),
    dateType: dateType,
    yearMonth: yearMonth
  }
})

filter.payloadQuarter = function () {
  var payload = JSON.parse(JSON.stringify(filter.payload()))

  var fromYearMonth = 0
  var toYearMonth = 0
  var d = moment(filter.selectedDate())

  if (filter.selectedDateType() == "Y") {
    if (d.isValid()) {
      yearMonth = parseInt(d.format("YYYY"))
      // 3 month difference
      fromYearMonth = (yearMonth) * 100 + 9
      toYearMonth = yearMonth * 100 + 12
    }
  } else {
    if (d.isValid()) {
      fromYearMonth = parseInt(d.subtract(3, "months").format("YYYYMM"))
      toYearMonth = parseInt(d.format("YYYYMM"))
    }
  }

  payload.fromYearMonth = fromYearMonth
  payload.toYearMonth = toYearMonth

  return payload
}

filter.loadGroups = function () {
  viewModel.ajaxPostCallback("/main/master/getgroups", {}, function (data) {
    filter.groupNames(_.map(data, "value"))
    filter.selectedGroupName.valueHasMutated()
  })
}

filter.loadEntities = function () {
  viewModel.ajaxPostCallback("/main/master/getentities", {
    groupName: filter.selectedGroupName()
  }, function (data) {
    filter.entities(["All"].concat(_.map(data, "value")))
    filter.selectedEntity.valueHasMutated()
  })
}

filter.loadFromURI = function () {
  var uriFilter = viewModel.globalFilter.fromURI()

  filter.selectedGroupName(uriFilter.groupName)
  filter.selectedEntity(uriFilter.entityName)
  filter.selectedRole(uriFilter.role)
  filter.selectedGroup(uriFilter.group)
  filter.selectedProductCategory(uriFilter.productCategory)
  filter.selectedLimit(uriFilter.limit)
  filter.selectedFlow(uriFilter.flow)
  filter.bookingCountry.selecteds(uriFilter.bookingCountries)
  filter.selectedDate(moment(uriFilter.yearMonth, uriFilter.dateType == "YEAR" ? "YYYY" : "YYYYMM").toDate())

  if (uriFilter.dateType == "YEAR") {
    $("button[data-target='#year']").click()
  } else {
    $("button[data-target='#month']").click()
  }
}

filter.loadAll = function () {
  filter.loadFromURI()

  filter.payload.subscribe(function (nv) {
    viewModel.globalFilter.allFilter(nv)

    // Enable this if you want the filter to be realtime
    // dashboard.loadAllData()
  })

  filter.selectedGroupName.subscribe(function (nv) {
    filter.loadEntities()
  })

  filter.loadGroups()

  dashboard.activeEntity.subscribe(function (nv) {
    viewModel.globalFilter.allFilter({
      entityName: nv
    })
  })

  dashboard.loadAllData()
}

dashboard.loadAllData = function () {
  if (filter.payload().groupName != "") {
    widget.loadData()
    dashboard.loadEntitiesDataIntoMap()
    dashboard.loadDomicileDataIntoMap()
  }
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
          var total = _.sum(_.map(items, 'total'))

          maxVal = total > maxVal ? total : maxVal
          minVal = total < minVal ? total : minVal

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
              value: total
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

dashboard.getDomicileData = function (callback) {
  viewModel.ajaxPostCallback("/main/dashboard/getdomiciledata", filter.payload(), function (data) {
    $.getJSON("/main/static/core/js/countries.json", function (countries) {
      var result = _(data)
        .map(function (e) {
          var c = _.find(countries, {
            "country_code": e
          })

          return {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: c.latlng.reverse(),
            },
            properties: {
              country: e,
              name: c.name,
            }
          }
        })
        .value()

      callback({
        type: "FeatureCollection",
        features: result
      })
    })
  })
}

dashboard.generateMapbox = function () {
  var map = undefined
  var entitiesCircles = undefined
  var entitiesTexts = undefined
  var domicileCircles = undefined
  var domicileTexts = undefined

  function generate() {
    L.mapbox.accessToken = 'pk.eyJ1IjoiYmFndXNjYWh5b25vIiwiYSI6ImNqOWpqbzBjYjByNXEzM2xnZ2ppcDBpN2EifQ.pFc9EQsAK5vd4ZWgCcAPJg'
    map = L.mapbox.map('map', 'mapbox.light')
      .setView([1.3, 103.8], 3)

    entitiesCircles = L.geoJson(null, {
      pointToLayer: function (feature, ll) {
        return L.circle(ll, feature.properties.radius, {
          color: "white",
          weight: 0,
          fillColor: "#69be28",
          fillOpacity: 0.85
        })
      }
    }).addTo(map)

    entitiesTexts = L.geoJson(null, {
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

    domicileCircles = L.geoJson(null, {
      pointToLayer: function (feature, ll) {
        return L.circle(ll, 600000, {
          color: "white",
          weight: 0,
          fillColor: "#1f4e1a",
          fillOpacity: 0.85
        })
      }
    }).addTo(map)

    domicileTexts = L.geoJson(null, {
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

  dashboard.loadEntitiesDataIntoMap = function () {
    dashboard.getMapData(function (data) {
      entitiesCircles.clearLayers()
      entitiesTexts.clearLayers()

      entitiesCircles.addData(data)
      entitiesTexts.addData(data)

      entitiesCircles.eachLayer(function (layer) {
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

  dashboard.loadDomicileDataIntoMap = function () {
    dashboard.getDomicileData(function (data) {
      domicileCircles.clearLayers()
      domicileTexts.clearLayers()

      domicileCircles.addData(data)
      domicileTexts.addData(data)
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
  viewModel.ajaxPostCallback("/main/dashboard/getentitydetail", filter.payload(), function (data) {
    var bank = _(data.bank)
      .groupBy("product_category")
      .mapValues(function (items) {
        return _.groupBy(items, "flow")
      }).value()
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

dashboard.bmnots = function (num, sts) {
  if (typeof num != 'undefined') {
    if (num >= 1000000000) {
      return '$' + currencynum((num / 1000000000).toFixed(2).replace(/\.0$/, '')) + 'B';
    }
    if (num >= 1000000) {
      return '$' + currencynum((num / 1000000).toFixed(2).replace(/\.0$/, '')) + 'M';
    }
    if (num >= 1000) {
      return '$' + currencynum((num / 1000).toFixed(2).replace(/\.0$/, '')) + 'K';
    }
    return '$' + currencynum(num.toFixed(2));
  } else {
    return ''
  }
}

dashboard.bm = function (num, sts) {
  if (num >= 1000000000) {
    return currencynum((num / 1000000000).toFixed(2).replace(/\.0$/, '')) + 'B';
  }
  if (num >= 1000000) {
    return currencynum((num / 1000000).toFixed(2).replace(/\.0$/, '')) + 'M';
  }
  if (num >= 1000) {
    return currencynum((num / 1000).toFixed(2).replace(/\.0$/, '')) + 'K';
  }
  return currencynum(num.toFixed(2));
}

dashboard.tradecash = function (dataimport, valimport) {
  var keyMap = {
    product: 'product2',
    value: 'value2'
  };

  var tradeimport_val = dataimport.map(function (obj) {
    return _.mapKeys(obj, function (value, key) {
      return keyMap[key];
    });
  });
  var aftertradecash = _.merge(valimport, tradeimport_val)
  return aftertradecash
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
    dashboard.activeEntityDetail.dataProductMixA(dashboard.tradecash(cashinward, cashoutward))
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
      dashboard.noinflow("No IN Transaction")
      dashboard.inflow(false)
    } else {
      dashboard.noinflow("")
      dashboard.inflow(true)
    }
    if (sumoutflow == 0) {
      dashboard.nooutflow("No OUT Transaction")
      dashboard.outflow(false)
    } else {
      dashboard.nooutflow("")
      dashboard.outflow(true)
    }
    if (suminflow == 0 && sumoutflow == 0) {
      dashboard.tablenoinflowoutflow(false)
      dashboard.nooutflow("")
      dashboard.noinflow("No IN, OUT Transaction")
      dashboard.labeltableno("No Transaction")
    } else {
      dashboard.tablenoinflowoutflow(true)
      dashboard.labeltableno("")
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
    dashboard.activeEntityDetail.dataProductMixA(dashboard.tradecash(tradeexport, tradeimport))
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
      dashboard.noinflow("No IN Transaction")
      dashboard.inflow(false)
    } else {
      dashboard.noinflow("")
      dashboard.inflow(true)
    }
    if (sumoutflow == 0) {
      dashboard.nooutflow("No OUT Transaction")
      dashboard.outflow(false)
    } else {
      dashboard.nooutflow("")
      dashboard.outflow(true)
    }
    if (suminflow == 0 && sumoutflow == 0) {
      dashboard.tablenoinflowoutflow(false)
      dashboard.other(false)
      dashboard.nooutflow("")
      dashboard.noinflow("No IN, OUT Transaction")
      dashboard.labeltableno("No Transaction")
    } else {
      dashboard.tablenoinflowoutflow(true)
      dashboard.labeltableno("")
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
  dashboard.generateMapbox()
  filter.loadAll()
  filter.bookingCountry.initListener()
})