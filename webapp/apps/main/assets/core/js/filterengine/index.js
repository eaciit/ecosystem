var filter = {}
filter.tradeProducts = ko.observableArray([
  "All",
  "VPrP",
  "TPM"
])
filter.selectedTradeProduct = ko.observable("All")

filter.groups = ko.observableArray([
  "All",
  "Intra-Group",
  "Exclude Intra-Group"
])
filter.selectedGroup = ko.observable("Exclude Intra-Group")

filter.supplierNumbers = ko.observableArray([
  "> 5",
  "> 10",
  "> 25",
  "> 50"
])
filter.selectedSupplierNumber = ko.observable(">= 20")

filter.transactionNumbers = ko.observableArray([
  "> 5",
  "> 10",
  "> 25",
  "> 50"
])
filter.selectedTransactionNumber = ko.observable(">= 12")

filter.totalFlows = ko.observableArray([
  "> 50M",
  "> 100M",
  "> 250M",
  "> 500M"
])
filter.selectedTotalFlow = ko.observable(">= 50M")

filter.creditRatings = ko.observableArray([
  "> 2",
  "> 4",
  "> 6",
  "> 8",
  "> 10"
])
filter.selectedCreditRating = ko.observable("<= 8")

filter.selectedDateType = "Y"
filter.selectedDate = ko.observable(moment().subtract(1, "years").toDate())

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

filter.loadAll = function () {

}

var engine = {}
engine.resultData = ko.observableArray()
engine.savedParam = ko.observable({})
engine.nextRun = ko.observable({})

engine.gridConfig = {
  data: engine.resultData,
  noRecords: "No data available.",
  columns: [{
      field: "cust_group_name",
      title: "Anchor Group Name"
    },
    {
      field: "cust_number",
      title: "Number of Entities",
      width: 150
    },
    {
      field: "cust_coi_number",
      title: "COI Count",
      width: 150
    },
    {
      field: "cpty_number",
      title: "Number of Suppliers",
      width: 150
    },
    {
      field: "total_transaction_number",
      title: "Number of Transaction",
      width: 150
    },
    {
      template: '<div class="text-right"> #= kendo.toString(total_transaction_amount, "n") # </div>',
      field: "total_transaction_amount",
      title: "USD Amount",
      width: 250
    }
  ]
}

engine.processFilter = function (text) {
  var digit = text.replace(/\D/g, '')
  var word = text.replace(/\d/g, '').replace(/\s/g, '')
  var extraWord = word.replace(/\W/g, '')
  word = word.replace(/\w/g, '')

  var finalText = ""

  if (word.length > 2 && digit.length > 0) {
    return undefined
  }

  if (word != ">=" && word != "<=" && word != ">" && word != "<" && word != "=") {
    return undefined
  }

  finalText += word + " " + digit

  if (extraWord.length > 0) {
    if (extraWord == "B") {
      finalText += "000000000"
    } else if (extraWord == "M") {
      finalText += "000000"
    } else if (extraWord == "K") {
      finalText += "000"
    } else {
      return undefined
    }
  }

  return finalText
}

engine.generateTable = function () {
  var selectedGroup = filter.selectedGroup()
  var selectedSupplierNumber = engine.processFilter(filter.selectedSupplierNumber())
  var selectedTransactionNumber = engine.processFilter(filter.selectedTransactionNumber())
  var selectedTotalFlow = engine.processFilter(filter.selectedTotalFlow())
  var selectedCreditRating = engine.processFilter(filter.selectedCreditRating())

  if (!selectedSupplierNumber) {
    swal("Error!", "Please fill the correct format for number of supplier", "error")
    return
  }

  if (!selectedTransactionNumber) {
    swal("Error!", "Please fill the correct format for number of transaction", "error")
    return
  }

  if (!selectedTotalFlow) {
    swal("Error!", "Please fill the correct format for total flow", "error")
    return
  }

  if (!selectedCreditRating) {
    swal("Error!", "Please fill the correct format for credit rating", "error")
    return
  }

  // Update the selected filter
  filter.selectedSupplierNumber(selectedSupplierNumber)
  filter.selectedTransactionNumber(selectedTransactionNumber)
  filter.selectedTotalFlow(selectedTotalFlow)
  filter.selectedCreditRating(selectedCreditRating)

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

  var param = {
    tradeProduct: filter.selectedTradeProduct(),
    group: selectedGroup,
    supplierNumber: selectedSupplierNumber,
    transactionNumber: selectedTransactionNumber,
    totalFlow: selectedTotalFlow,
    creditRating: selectedCreditRating,
    dateType: dateType,
    yearMonth: yearMonth
  }

  var savedParam = engine.savedParam()

  if (savedParam.TradeProduct == param.tradeProduct &&
    savedParam.Group == param.group &&
    savedParam.SupplierNumber == param.supplierNumber &&
    savedParam.TransactionNumber == param.transactionNumber &&
    savedParam.TotalFlow == param.totalFlow &&
    savedParam.CreditRating == param.creditRating) {
    swal("Filter Not Changed", "Filter parameters is same with the existing filter parameter from current table!", "warning")
    return
  }

  var a = swal({
    html: true,
    title: 'Execute time',
    text: 'Next scheduler will run at <b>' + moment(engine.nextRun()).format("DD-MM-YYYY HH:mm ") + '</b>. Do you want to execute it right now?',
    type: 'info',
    showCancelButton: true,
    confirmButtonText: 'Yes, execute now',
    cancelButtonText: 'No, execute later'
  }, function(result) {
    param.executeNow = result

    viewModel.ajaxPostCallback("/main/filterengine/generatetable", param, function (data) {
      swal("Success", "Recomended engine filter parameter is saved.", "success")
    })
  })
}

engine.getSavedParameter = function () {
  viewModel.ajaxPostCallback("/main/filterengine/getsavedparameter", {}, function (data) {
    engine.savedParam(data)
  })
}

engine.getNextRun = function () {
  viewModel.ajaxPostCallback("/main/filterengine/getschedulernextrun", {}, function (data) {
    engine.nextRun(data.nextTime)
  })
}

engine.load = function () {
  viewModel.ajaxPostCallback("/main/filterengine/getresult", {}, function (data) {
    engine.resultData(data)
  })
}

engine.loadAll = function () {
  engine.load()
  engine.getSavedParameter()
  engine.getNextRun()
}

$(window).load(function () {
  kendo.culture("en-US")

  filter.loadAll()
  engine.loadAll()
})