var master = {}
viewModel.master = master

master.activeMenu = ko.observable('User') // User, Group, Menu, Log

master.toggleActiveMenu = function (activeMenu, obj) {
    master.activeMenu(activeMenu)

    $(obj).siblings().removeClass('active')
    $(obj).addClass('active')

    switch (activeMenu) {
        case 'User': 
            master.refreshGridUser()
        break
        case 'Group': 
            master.refreshGridGroup()
        break
        case 'Menu': 
            master.refreshGridMenu()
        break
        case 'Log': 
            master.refreshGridLog()
        break
    }
}

// ====== user

master.newUser = function () {
    return {
        Email: "",
        Enable: true,
        FullName: "",
        Grants: [],
        Groups: [],
        LoginConf: {},
        LoginID: "",
        LoginType: 0,
        Password: "",
        _id: ""
    }
}

master.selectedUser = ko.mapping.fromJS(master.newUser())
master.userIsInsertMode = ko.observable(false)
master.dataUser = ko.observableArray([])

master.refreshGridUser = function () {
    master.dataUser([])

    viewModel.ajaxPostCallback('/main/access/getuser', {}, function (data) {
        master.dataUser(data)

        var config = {
            dataSource: {
                data: data,
                pageSize: 10
            },
            pageable: true,
            sortable: true,
            filterable: true,
            columns: [{
                field: 'LoginID',
                title: 'Username'
            }, {
                field: 'Email',
                title: 'Email'
            }, {
                field: 'FullName',
                title: 'Name'
            }, {
                title: 'Group',
                template: function (d) {
                    return d.Groups.join(', ')
                }
            }, {
                title: '&nbsp;',
                width: 80,
                attributes: { class: 'align-center' },
                template: function (d) {
                    return "<button class='btn btn-xs btn-primary' data-tooltipster='Edit' onclick='master.editUser(\"" + d._id + "\")'><i class='fa fa-edit'></i></button>"
                         + "&nbsp;"
                         + "<button class='btn btn-xs btn-danger' data-tooltipster='Remove'><i class='fa fa-trash' onclick='master.deleteUser(\"" + d._id + "\")'></i></button>"
                }
            }],
            dataBound: function () {
                viewModel.prepareTooltipsterGrid(this)
            }
        }

        $('.grid-user').replaceWith('<div class="grid-user"></div>')
        $('.grid-user').kendoGrid(config)
    })
}

master.editUser = function (_id) {
    var data = master.dataUser().find(function (d) { return d._id === _id })
    
    master.userIsInsertMode(false)
    ko.mapping.fromJS(data, master.selectedUser)
    $('#modal-user').modal('show')

    setTimeout(function () { viewModel.isFormValid('#modal-user form') }, 310)
}

master.createUser = function () {
    master.userIsInsertMode(true)
    ko.mapping.fromJS(master.newUser(), master.selectedUser)
    $('#modal-user').modal('show')

    setTimeout(function () { viewModel.isFormValid('#modal-user form') }, 310)
}

master.saveUser = function () {
    if (!viewModel.isFormValid('#modal-user form')) {
        swal("Error!", "Some inputs are not valid", "error")
        return
    }
    
    var payload = ko.mapping.toJS(master.selectedUser)

    viewModel.ajaxPostCallback('/main/access/saveuser', payload, function (data) {
        swal({
            title: 'Success',
            text: 'Changes saved',
            type: 'success',
            timer: 2000,
            showConfirmButton: false
        })
    
        $('#modal-user').modal('hide')
        master.refreshGridUser()
    })
}

master.deleteUser = function (_id) {
    swal({
        title: "Are you sure?",
        text: "You will not be able to recover deleted data!",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, delete it!",
        closeOnConfirm: false
    }, function(){
        var payload = master.dataUser().find(function (d) { return d._id === _id })

        viewModel.ajaxPostCallback('/main/access/deleteuser', payload, function (data) {
            swal({
                title: 'Success',
                text: 'Menu successfully deleted',
                type: 'success',
                timer: 2000,
                showConfirmButton: false
            })
        
            $('#modal-user').modal('hide')
            master.refreshGridUser()
        })
    });
}

// ====== group

master.newAccessGrant = function () {
    return {
        AccessID: "",
        AccessValue: 1
    }
}

master.newGroup = function () {
    return {
        Enable: true,
        Grants: [],
        GroupConf: {},
        GroupType: 0,
        MemberConf: {},
        Owner: "",
        Title: "",
        _id: ""
    }
}

master.selectedGroup = ko.mapping.fromJS(master.newGroup())
master.groupIsInsertMode = ko.observable(false)
master.dataGroup = ko.observableArray([])

master.dataGroupForDropDown = ko.computed(function () {
    return master.dataGroup().map(function (d) {
        if (d._id.toLowerCase() !== d.Title.toLowerCase()) {
            var text = d._id + " - " + d.Title
            return { text: text, value: d._id }
        }
    
        return { text: d.Title, value: d._id }
    })
}, master.dataGroup)

master.refreshGridGroup = function () {
    master.dataGroup([])

    viewModel.ajaxPostCallback('/main/access/getgroup', {}, function (data) {
        // hacks for Access Grants
        data.forEach(function (d) {
            if (d.Grants == null || d.Grants == undefined) {
                d.Grants = []
            }

            if (d.Grants.length > 0) {
                d.Grants = d.Grants.map(function (e) {
                    return e.AccessID
                })
            }
        })

        master.dataGroup(data)

        var config = {
            dataSource: {
                data: data,
                pageSize: 10,
            },
            pageable: true,
            sortable: true,
            filterable: true,
            columns: [{
                field: '_id',
                title: 'Group ID'
            }, {
                field: 'Title',
                title: 'Name'
            }, {
                title: 'Grants Access Menu',
                template: function (d) {
                    return d.Grants.map(function (e) { 
                        var menu = master.dataAccessMenuFlat().find(function (f) {
                            return f._id === e
                        })
                        if (menu !== undefined) {
                            return ' - ' + menu.Title
                        }

                        return ' - ' + e
                    }).join('<br />')
                }
            }, {
                title: '&nbsp;',
                width: 80,
                attributes: { class: 'align-center' },
                template: function (d) {
                    return "<button class='btn btn-xs btn-primary' data-tooltipster='Edit' onclick='master.editGroup(\"" + d._id + "\")'><i class='fa fa-edit'></i></button>"
                         + "&nbsp;"
                         + "<button class='btn btn-xs btn-danger' data-tooltipster='Remove'><i class='fa fa-trash' onclick='master.deleteGroup(\"" + d._id + "\")'></i></button>"
                }
            }],
            dataBound: function () {
                viewModel.prepareTooltipsterGrid(this)
            }
        }

        $('.grid-group').replaceWith('<div class="grid-group"></div>')
        $('.grid-group').kendoGrid(config)
    })
}

master.editGroup = function (_id) {
    var data = master.dataGroup().find(function (d) { return d._id === _id })
    
    master.groupIsInsertMode(false)
    ko.mapping.fromJS(data, master.selectedGroup)
    $('#modal-group').modal('show')

    setTimeout(function () { viewModel.isFormValid('#modal-group form') }, 310)
}

master.createGroup = function () {
    master.groupIsInsertMode(true)
    ko.mapping.fromJS(master.newGroup(), master.selectedGroup)
    $('#modal-group').modal('show')

    setTimeout(function () { viewModel.isFormValid('#modal-user form') }, 310)
}

master.saveGroup = function () {
    if (!viewModel.isFormValid('#modal-group form')) {
        swal("Error!", "Some inputs are not valid", "error")
        return
    }
    
    var payload = ko.mapping.toJS(master.selectedGroup)
    if (payload.Grants.length > 0) {
        payload.Grants = payload.Grants.map(function (e) {
            var row = master.newAccessGrant()
            row.AccessID = e
            return row
        })
    }
        
    viewModel.ajaxPostCallback('/main/access/savegroup', payload, function (data) {
        swal({
            title: 'Success',
            text: 'Changes saved',
            type: 'success',
            timer: 2000,
            showConfirmButton: false
        })
    
        $('#modal-group').modal('hide')
        master.refreshGridGroup()
    })
}

master.deleteGroup = function (_id) {
    swal({
        title: "Are you sure?",
        text: "You will not be able to recover deleted data!",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, delete it!",
        closeOnConfirm: false
    }, function(){
        var payload = master.dataGroup().find(function (d) { return d._id === _id })

        viewModel.ajaxPostCallback('/main/access/deletegroup', payload, function (data) {
            swal({
                title: 'Success',
                text: 'Menu successfully deleted',
                type: 'success',
                timer: 2000,
                showConfirmButton: false
            })
        
            $('#modal-group').modal('hide')
            master.refreshGridGroup()
        })
    });
}

// ====== access menu

master.newAccessMenu = function () {
    return {
        _id: "",
        Title: "",
        Category: 1,
        Icon: "",
        ParentId: "",
        Url: "#",
        Index: 1,
        Group1: "",
        Group2: "",
        Group3: "",
        Enable: true,
        SpecialAccess1: "",
        SpecialAccess2: "",
        SpecialAccess3: "",
        SpecialAccess4: ""
    }
}

master.dataAccessMenuTree = ko.observableArray([])
master.dataAccessMenuFlat = ko.observableArray([])
master.selectedAccessMenu = ko.mapping.fromJS(master.newAccessMenu())
master.accessMenuIsInsertMode = ko.observable(false)

master.dataAccessMenuForDropdown = ko.computed(function () {
    return master.dataAccessMenuFlat().map(function (d) {
        if (d.ParentId !== "") {
            var parent = master.dataAccessMenuFlat().find(function (e) { return e._id === d.ParentId })
            if (parent !== undefined) {
                var text = (parent.Title + ' - ' + d.Title)
                return { text: text, value: d._id }
            }
        }

        return { text: d.Title, value: d._id }
    })
}, master.dataGroup)

master.editAccessMenu = function (data) {
    return function () {
        master.accessMenuIsInsertMode(false)
        ko.mapping.fromJS(data, master.selectedAccessMenu)
        $('#modal-access-menu').modal('show')
        
        setTimeout(function () { viewModel.isFormValid('#modal-access-menu form') }, 310)
    }
}

master.refreshGridMenu = function () {
    master.dataAccessMenuTree([])
    master.dataAccessMenuFlat([])

    viewModel.ajaxPostCallback('/main/access/getaccessmenu', {}, function (data) {
        if (data.length == 0) {
            return
        }

        data.forEach(function (d) {
            d.Submenu = []
        })

        var menu = []

        data.filter(function (d) {
            return d.Category == 1
        }).forEach(function (d) {
            menu.push(d)
        })

        data.filter(function (d) {
            return d.Category == 2
        }).forEach(function (d) {
            var parent = menu.find(function (e) {
                return e._id == d.ParentId
            })
            parent.Submenu.push(d)
        })

        master.dataAccessMenuTree(menu)
        master.dataAccessMenuFlat(data)

        setTimeout(function () {
            master.editAccessMenu(master.dataAccessMenuTree()[0])
        }, 100)
    })
}

master.createAccessMenu = function () {
    master.accessMenuIsInsertMode(true)
    ko.mapping.fromJS(master.newAccessMenu(), master.selectedAccessMenu)
    master.selectedAccessMenu.Index(master.dataAccessMenuTree().length + 1)
    $('#modal-access-menu').modal('show')

    setTimeout(function () { viewModel.isFormValid('#modal-access-menu form') }, 310)
}

master.saveAccessMenu = function () {
    if (!viewModel.isFormValid('#modal-access-menu form')) {
        swal("Error!", "Some inputs are not valid", "error")
        return
    }
    
    var payload = ko.mapping.toJS(master.selectedAccessMenu)

    viewModel.ajaxPostCallback('/main/access/saveaccessmenu', payload, function (data) {
        swal({
            title: 'Success',
            text: 'Changes saved',
            type: 'success',
            timer: 2000,
            showConfirmButton: false
        })
    
        $('#modal-access-menu').modal('hide')
        master.refreshGridMenu()
    })
}

master.deleteAccessMenu = function () {
    swal({
        title: "Are you sure?",
        text: "You will not be able to recover deleted data!",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, delete it!",
        closeOnConfirm: false
    }, function(){
        var payload = ko.mapping.toJS(master.selectedAccessMenu)

        viewModel.ajaxPostCallback('/main/access/deleteaccessmenu', payload, function (data) {
            swal({
                title: 'Success',
                text: 'Menu successfully deleted',
                type: 'success',
                timer: 2000,
                showConfirmButton: false
            })
        
            $('#modal-access-menu').modal('hide')
            master.refreshGridMenu()
        })
    })
}

// ====== user log

master.refreshGridLog = function () {
    viewModel.ajaxPostCallback('/main/access/getsession', {}, function (data) {
        var config = {
            dataSource: {
                data: data,
                schema: {
                    model: {
                        fields: {
                            Created: { type: 'date' },
                            Expired: { type: 'date' },
                        }
                    }
                },
                pageSize: 10,
            },
            pageable: true,
            sortable: true,
            filterable: true,
            columns: [{
                field: 'LoginID',
                title: 'Username'
            }, {
                field: 'Created',
                title: 'Login Date',
                template: function (d) {
                    return moment(d.Created).format('YYYY-MMM-DD HH:mm:ss')
                }
            }, {
                field: 'Expired',
                title: 'Activity End (Logout / Session Expired)',
                template: function (d) {
                    return moment(d.Expired).format('YYYY-MMM-DD HH:mm:ss')
                }
            }],
            dataBound: function () {
                viewModel.prepareTooltipsterGrid(this)
            }
        }

        $('.grid-log').replaceWith('<div class="grid-log"></div>')
        $('.grid-log').kendoGrid(config)
    })
}

$(function () {
    master.refreshGridUser()
    master.refreshGridGroup()
    master.refreshGridMenu()
})
