var counterpary = {}
counterpary.datadetailgraph = ko.observableArray([])

counterpary.meglobal = [{
    "value": "ASA",
    "text": "ASA"
}, {
    "value": "AME",
    "text": "AME"
}]
counterpary.buyer = [{
    "value": 1,
    "text": "Ibrahim Fibres"
}, {
    "value": 2,
    "text": "Reliance Ind"
}]
counterpary.group = [{
    "value": "ETB",
    "text": "ETB"
}, {
    "value": "NTB",
    "text": "NTB"
}]
counterpary.top = [{
    "value": 5,
    "text": "Top 5"
}, {
    "value": 3,
    "text": "Top 3"
}]
counterpary.flows = [{
    "value": 31,
    "text": "Flows>$30M"
}, {
    "value": 100,
    "text": "Flows>$100M"
}]


counterpary.generateGraph = function() {
 var data = {
  "DOW CHEMICAL INTERNATIONAL PRIVATE LIMITED": [
  {
    cpty_long_name: "DowChemical InternationalPvt. Ltd.",
    cpty_bank: "CITI",
    cpty_coi: "IN",
    cust_bank: "SCBL",
    cust_role: "BUYER",
    total: "100000000"
  },{
    cpty_long_name: "ASIAN PAINTS SUPPLIER PAYMENTS A C",
    cpty_bank: "HDFC",
    cpty_coi: "IN",
    cust_bank: "SCBL",
    cust_role: "BUYER",
    total: "10000000"
  },{
    cpty_long_name: "AKZO NOBEL INDIA LIMITED",
    cpty_bank: "CITI",
    cpty_coi: "IN",
    cust_bank: "SCBL",
    cust_role: "PAYEE",
    total: "80000000"
  },{
    cpty_long_name: "KANSAI NEROLAC PAINT INDIA PRIVATE LIMITED",
    cpty_bank: "DEUT",
    cpty_coi: "IN",
    cust_bank: "SCBL",
    cust_role: "PAYEE",
    total: "80000000"
  },{
    cpty_long_name: "NIPPON PAINT INDIA PRIVATE LIMITED",
    cpty_bank: "UTIB",
    cpty_coi: "IN",
    cust_bank: "SCBL",
    cust_role: "PAYEE",
    total: "80000000"
  }]
}

console.log(data);
  

    // $('#month').data('kendoDatePicker').enable(false);

    // $('#radioBtn a').on('click', function() {
    //     var sel = $(this).data('title');
    //     var tog = $(this).data('toggle');
    //     $('#' + tog).prop('value', sel);
    //     if (sel == "M") {
    //         $('#year').data('kendoDatePicker').enable(false);
    //         $('#month').data('kendoDatePicker').enable(true);
    //     } else if (sel == "Y") {
    //         $('#year').data('kendoDatePicker').enable(true);
    //         $('#month').data('kendoDatePicker').enable(false);
    //     }

    //     $('a[data-toggle="' + tog + '"]').not('[data-title="' + sel + '"]').removeClass('active').addClass('notActive');
    //     $('a[data-toggle="' + tog + '"][data-title="' + sel + '"]').removeClass('notActive').addClass('active');
    // })

    // var dgraph = [{
    //         "id": 1,
    //         "bottom": 170,
    //         "left": 40,
    //         "transform": -40,
    //         "bbottom": 76,
    //         "bleft": 20,
    //         "linklabel": "UTI Bank $107M",
    //         "nodelabel": "Relliance Ind",
    //         "nodelabel2": "IN",
    //         listdetail: [{
    //             "bank": "FIBB",
    //             "product": "TRADE",
    //             "flow": 8.44,
    //             "not": 2
    //         }, {
    //             "bank": "HBKS",
    //             "product": "TRADE",
    //             "flow": 3.40,
    //             "not": 1
    //         }, {
    //             "bank": "HCEB",
    //             "product": "TRADE",
    //             "flow": 8.95,
    //             "not": 2
    //         }]
    //     },
    //     {
    //         "id": 2,
    //         "bottom": 300,
    //         "left": 20,
    //         "transform": 21,
    //         "bbottom": 331,
    //         "bleft": -7,
    //         "linklabel": "Various Banks $121M SCB",
    //         "nodelabel": "Ibrahim Fibres",
    //         "nodelabel2": "Pak",
    //         listdetail: [{
    //             "bank": "FIBB",
    //             "product": "TRADE",
    //             "flow": 8.44,
    //             "not": 2
    //         }, {
    //             "bank": "HBKS",
    //             "product": "TRADE",
    //             "flow": 3.40,
    //             "not": 1
    //         }, {
    //             "bank": "HCEB",
    //             "product": "TRADE",
    //             "flow": 8.95,
    //             "not": 2
    //         }, {
    //             "bank": "MCBK",
    //             "product": "TRADE",
    //             "flow": 9.27,
    //             "not": 2
    //         }, {
    //             "bank": "MEEB",
    //             "product": "TRADE",
    //             "flow": 3.98,
    //             "not": 2
    //         }, {
    //             "bank": "SCBL",
    //             "product": "TRADE",
    //             "flow": 2.0,
    //             "not": 1
    //         }, {
    //             "bank": "UNIL",
    //             "product": "TRADE",
    //             "flow": 13.18,
    //             "not": 2
    //         }]
    //     },
    //     {
    //         "id": 3,
    //         "bottom": 380,
    //         "left": 160,
    //         "transform": -90,
    //         "bbottom": 490,
    //         "bleft": 240,
    //         "linklabel": "$154M SBI",
    //         "nodelabel": "Bhilosha Ind",
    //         "nodelabel2": "Ind",
    //         listdetail: [{
    //             "bank": "FIBB",
    //             "product": "TRADE",
    //             "flow": 8.44,
    //             "not": 2
    //         }, {
    //             "bank": "HBKS",
    //             "product": "TRADE",
    //             "flow": 3.40,
    //             "not": 1
    //         }, {
    //             "bank": "HCEB",
    //             "product": "TRADE",
    //             "flow": 8.95,
    //             "not": 2
    //         }]
    //     },
    //     {
    //         "id": 4,
    //         "bottom": 360,
    //         "left": 290,
    //         "transform": -50,
    //         "bbottom": 450,
    //         "bleft": 450,
    //         "linklabel": "$94M UBL",
    //         "nodelabel": "ICI Pakistan",
    //         "nodelabel2": "Pak",
    //         listdetail: [{
    //             "bank": "FIBB",
    //             "product": "TRADE",
    //             "flow": 8.44,
    //             "not": 2
    //         }, {
    //             "bank": "HBKS",
    //             "product": "TRADE",
    //             "flow": 3.40,
    //             "not": 1
    //         }]
    //     },
    //     {
    //         "id": 5,
    //         "bottom": 200,
    //         "left": 310,
    //         "transform": 16,
    //         "bbottom": 160,
    //         "bleft": 510,
    //         "linklabel": "$5M",
    //         "nodelabel": "PWC",
    //         "nodelabel2": "UK",
    //         listdetail: [{
    //             "bank": "FIBB",
    //             "product": "TRADE",
    //             "flow": 8.44,
    //             "not": 2
    //         }, {
    //             "bank": "HBKS",
    //             "product": "TRADE",
    //             "flow": 3.40,
    //             "not": 1
    //         }, {
    //             "bank": "HCEB",
    //             "product": "TRADE",
    //             "flow": 8.95,
    //             "not": 2
    //         }]
    //     }
    // ]

    // for (var key in dgraph) {
    //     if (key > 1 && dgraph[key].nodelabel != "PWC") {
    //         var aleft = '<i class="fa fa-caret-left arrowleft" aria-hidden="true"></i>'
    //     } else {
    //         var aleft = '<i class="fa fa-caret-right arrowright" aria-hidden="true"></i>'
    //     }
    //     var mynode = '<div align="center" id="jo' + key + '"class="titletext">' +
    //         '<div style="position: relative" ><span id="linklabel' + key + '"></span>' +
    //         '<div class="titletextafter"></div>' +
    //         '<div class="linkdashed" style=""></div>' +
    //         '</div>' +
    //         '' + aleft + '' +
    //         '</div>' +
    //         '<div class="newtitle" id="bubble' + key + '" >' +
    //         '<div class="afternewtitle" ><span rel=' + dgraph[key].id + ' id="nodelabel' + key + '"></span></div>' +
    //         '</div>'

    //     $("#showing").append(mynode);
    //     $("#jo" + key + "").css({

    //         'bottom': dgraph[key].bottom + 'px',
    //         'left': dgraph[key].left + 'px',
    //         'transform': 'rotate(' + dgraph[key].transform + 'deg)',

    //     });
    //     $("#bubble" + key + "").css({
    //         'bottom': dgraph[key].bbottom + 'px',
    //         'left': dgraph[key].bleft + 'px',
    //     });
    //     if (dgraph[key].nodelabel == "PWC") {

    //         $("#bubble" + key + "").css({
    //             "background-color": "#00bcd4"
    //         });
    //         $("#jo" + key + "").find(".linkdashed").css({
    //             "border": "0px"
    //         });

    //         $("#jo" + key + "").css({
    //             "border": "0px",
    //             "background-color": "#fff"
    //         })
    //     }
    //     $("#linklabel" + key + "").text(dgraph[key].linklabel);
    //     $("#nodelabel" + key + "").html(dgraph[key].nodelabel + "<br>" + dgraph[key].nodelabel2);
    // }


    // $(".afternewtitle").click(function() {

    //     var bubbletitle = $(this).find("span").attr("rel")

    //     var data = _.find(dgraph, function(d) {
    //         return d.id == bubbletitle
    //     })


    //     console.log(data["nodelabel"])
    //     counterpary.datadetailgraph(data.listdetail)

    //     var arr = bubbletitle.split('<br>')
    //     var arr1 = arr[0]
    //     var arr2 = arr[1]
    //     $(".modal-title").html(data["nodelabel"])
    //     $('#Modal').modal('show')



    // });



}



$(window).load(function() {
    counterpary.generateGraph()
})