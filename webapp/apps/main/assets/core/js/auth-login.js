viewModel.isNotLoginPage(false)

var pageLogin = {}
viewModel.pageLogin = pageLogin

pageLogin.userData = ko.mapping.fromJS({
    username: '',
    password: ''
})

pageLogin.registerSubmitEvent = function () {
    $('form').on('submit', function (e) {
        e.preventDefault()
        viewModel.isLoading(true)

        var payload = ko.mapping.toJS(pageLogin.userData)
        ajaxPost('/main/auth/dologin', payload, function (res) {
            setTimeout(function () {
                viewModel.isLoading(false)

                if (res.Status !== 'OK') {
                    swal("Login Failed!", res.Message, "error")
                    return
                }
                
                swal({
                    title: 'Login Success',
                    text: 'Will automatically redirect to dashboard page',
                    type: 'success',
                    timer: 2000,
                    showConfirmButton: false
                }, function () {
                    location.href = res.Data.redirect
                })
            }, 500)
        }, function () {
            setTimeout(function () {
                viewModel.isLoading(false)
                swal("Login Failed!", "Unknown error, please try again", "error")
            }, 500)
        })
    })
}

$(function () {
    pageLogin.registerSubmitEvent()
})